import { ref, computed, watch } from 'vue'
import { useAuth } from '../stores/auth'
import { streamAIChat } from '../utils/aiStreamChat'
import { compressImageFile } from '../utils/imageCompress'
import {
  getChatHistory,
  clearAiMemory,
  listAiSessions,
  createAiSession,
  renameAiSession,
  deleteAiSession,
  getAiModels
} from '../api/admin'

const DEFAULT_WELCOME =
  '您好！我是毕业数据报告系统的 AI 助手，有什么可以帮您的？'

const MODEL_STORAGE_KEY = 'aiSelectedModel'

const ROLE_SWITCH_RESET_TEXT = '检测到身份已切换，已为您清空上一角色的对话记忆。'

/**
 * 解析当前登录身份，对齐后端 ChatIdentity / chat_message 约束
 */
export function resolveChatIdentity(authState) {
  if (authState?.isLoggedIn) {
    const role = (authState.role || '').toUpperCase()
    if (role === 'ADMIN') {
      return {
        userRole: 'admin',
        userId: authState.user?.username || 'admin',
        adminId: authState.user?.id || null
      }
    }
    return {
      userRole: 'student',
      userId: authState.user?.studentId || authState.user?.username,
      adminId: null
    }
  }

  let guestId = localStorage.getItem('aiGuestUserId')
  if (!guestId) {
    guestId = 'guest_' + Date.now()
    localStorage.setItem('aiGuestUserId', guestId)
  }
  return {
    userRole: 'guest',
    userId: guestId,
    adminId: null
  }
}

/** 身份记忆键：用于判断角色是否切换 */
function getIdentityMemoryKey(identity) {
  if (!identity) return 'guest:anonymous'
  if (identity.userRole === 'admin') {
    return `admin:${identity.adminId ?? identity.userId ?? 'unknown'}`
  }
  if (identity.userRole === 'student') {
    return `student:${identity.userId ?? 'unknown'}`
  }
  return `guest:${identity.userId ?? 'anonymous'}`
}

/**
 * 校验某个身份在浏览器中是否仍持有有效鉴权信息
 * 用于退出登录时阻止 useAiChat 的 watch 触发无效的清理 API
 */
function isIdentityAuthStillValid(identity) {
  if (!identity) return false
  if (identity.userRole === 'guest') return false
  // 1) 优先看 auth store 的统一存储（graduation_auth）
  let authData = null
  try {
    authData = localStorage.getItem('graduation_auth')
      || sessionStorage.getItem('graduation_auth')
  } catch (e) {
    authData = null
  }
  if (authData) {
    try {
      const parsed = JSON.parse(authData)
      if (parsed && parsed.user && parsed.user.token) return true
    } catch (e) {}
  }
  // 2) 兜底：旧 localStorage 中的 token 字段
  if (identity.userRole === 'student' && localStorage.getItem('student_token')) return true
  if (identity.userRole === 'admin' && localStorage.getItem('token')) return true
  return false
}

function sessionStorageKey(identity) {
  return `aiCurrentSession:${getIdentityMemoryKey(identity)}`
}

function shouldAutoClearOnRoleSwitch(prevKey, nextKey) {
  if (!prevKey || prevKey === nextKey) return false
  const prevRole = prevKey.split(':')[0]
  const nextRole = nextKey.split(':')[0]
  if (prevRole === 'guest' && (nextRole === 'student' || nextRole === 'admin')) {
    return false
  }
  return true
}

function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function buildMessage({ id, role, content, time, images }) {
  return {
    id,
    role,
    content: content || '',
    images: images || [],
    time: time || formatTime()
  }
}

function mapHistoryMessages(list) {
  return (list || []).map(msg => buildMessage({
    id: msg.id,
    role: msg.role === 'ai' ? 'ai' : 'user',
    content: msg.role === 'ai' ? (msg.response || msg.content) : msg.content,
    time: msg.createTime
      ? new Date(msg.createTime).toLocaleTimeString()
      : formatTime()
  }))
}

function genLocalSessionKey() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

/**
 * AI 对话公共逻辑：多会话、流式发送、停止、历史、清除记忆
 */
export function useAiChat(options = {}) {
  const {
    welcomeMessage = DEFAULT_WELCOME,
    defaultYear = new Date().getFullYear(),
    onAfterChunk = null,
    onError = null,
    onRiskBlocked = null,
    onStreamEnd = null
  } = options

  const { state: authState } = useAuth()

  const messages = ref([
    buildMessage({
      id: 1,
      role: 'ai',
      content: welcomeMessage
    })
  ])
  const inputText = ref('')
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const currentYear = ref(defaultYear)
  const sessions = ref([])
  const currentSessionKey = ref(localStorage.getItem(sessionStorageKey(resolveChatIdentity(authState))) || '')
  const sessionsLoading = ref(false)
  const pendingImages = ref([])
  const modelOptions = ref([])
  const selectedModel = ref(localStorage.getItem(MODEL_STORAGE_KEY) || '')
  const visionEnabled = computed(() => {
    const hit = modelOptions.value.find(m => m.id === selectedModel.value)
    if (hit) return !!hit.vision
    // 列表未加载时：默认模型名含 v 视为识图
    return !selectedModel.value || /v|vision/i.test(selectedModel.value)
  })

  let abortController = null
  let alive = true

  const chatCount = computed(() => messages.value.length)
  const identity = computed(() => resolveChatIdentity(authState))
  const currentSession = computed(() =>
    sessions.value.find(s => s.sessionKey === currentSessionKey.value) || null
  )
  const currentModelMeta = computed(() =>
    modelOptions.value.find(m => m.id === selectedModel.value) || null
  )

  let lastIdentity = { ...identity.value }
  let roleSwitchHandling = false

  const setAlive = (value) => {
    alive = value
  }

  const persistSessionKey = (key) => {
    currentSessionKey.value = key || ''
    if (key) {
      localStorage.setItem(sessionStorageKey(identity.value), key)
    }
  }

  const resetLocalMessages = (resetText) => {
    messages.value = [
      buildMessage({
        id: Date.now(),
        role: 'ai',
        content: resetText || welcomeMessage
      })
    ]
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isLoading.value = false
    isStreaming.value = false
  }

  const loadChatHistory = async () => {
    const id = identity.value
    if (id.userRole === 'guest') {
      resetLocalMessages(welcomeMessage)
      return
    }
    if (!currentSessionKey.value) {
      await loadSessions()
    }

    try {
      const response = await getChatHistory(id.userId, {
        userType: id.userRole,
        adminId: id.adminId,
        sessionId: currentSessionKey.value || undefined
      })
      if (!alive) return
      if (response.meta?.sessionKey) {
        persistSessionKey(response.meta.sessionKey)
      }
      if (response.code === 200 && response.data?.length > 0) {
        messages.value = mapHistoryMessages(response.data)
      } else {
        resetLocalMessages(welcomeMessage)
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error)
    }
  }

  watch(
    identity,
    async (nextIdentity, prevIdentity) => {
      if (!alive || roleSwitchHandling) return

      const prevKey = getIdentityMemoryKey(prevIdentity ?? lastIdentity)
      const nextKey = getIdentityMemoryKey(nextIdentity)
      if (prevKey === nextKey) return

      await handleRoleSwitch(prevIdentity ?? lastIdentity, nextIdentity)
      lastIdentity = { ...nextIdentity }
    },
    { deep: true }
  )

  const patchSessionTitleLocally = (sessionId, content) => {
    if (!sessionId || !content) return
    const idx = sessions.value.findIndex(s => s.sessionKey === sessionId)
    if (idx === -1) return
    const current = sessions.value[idx]
    if (current.title && current.title !== '新对话') return
    const title = content.trim().slice(0, 20) || '新对话'
    sessions.value[idx] = { ...current, title }
  }

  const clearMemoryForIdentity = async (targetIdentity, deleteDb = false, sessionKey = null) => {
    if (!targetIdentity || targetIdentity.userRole === 'guest') return
    await clearAiMemory({
      userType: targetIdentity.userRole,
      userId: targetIdentity.userId,
      adminId: targetIdentity.adminId,
      sessionId: sessionKey || currentSessionKey.value || undefined,
      deleteDb
    })
  }

  const loadSessions = async () => {
    const id = identity.value
    if (id.userRole === 'guest') {
      sessions.value = []
      if (!currentSessionKey.value) {
        persistSessionKey(genLocalSessionKey())
      }
      return sessions.value
    }
    sessionsLoading.value = true
    try {
      const res = await listAiSessions({
        userType: id.userRole,
        userId: id.userId,
        adminId: id.adminId
      })
      if (!alive) return []
      sessions.value = res.code === 200 ? (res.data || []) : []
      if (sessions.value.length === 0) {
        await createSession('新对话')
      } else {
        const preferred = currentSessionKey.value
        const hit = sessions.value.find(s => s.sessionKey === preferred)
        persistSessionKey(hit ? hit.sessionKey : sessions.value[0].sessionKey)
      }
      return sessions.value
    } catch (e) {
      console.error('加载会话列表失败:', e)
      return []
    } finally {
      sessionsLoading.value = false
    }
  }

  const createSession = async (title = '新对话') => {
    const id = identity.value
    stopGeneration()
    if (id.userRole === 'guest') {
      persistSessionKey(genLocalSessionKey())
      resetLocalMessages(welcomeMessage)
      return { sessionKey: currentSessionKey.value, title }
    }
    try {
      const res = await createAiSession({
        userRole: id.userRole,
        userId: id.userId,
        adminId: id.adminId,
        title
      })
      if (res.code === 200 && res.data?.sessionKey) {
        const session = res.data
        sessions.value = [session, ...sessions.value.filter(s => s.sessionKey !== session.sessionKey)]
        persistSessionKey(session.sessionKey)
        resetLocalMessages(welcomeMessage)
        return session
      }
    } catch (e) {
      console.error('创建会话失败:', e)
      throw e
    }
    return null
  }

  const switchSession = async (sessionKey) => {
    if (!sessionKey || sessionKey === currentSessionKey.value) return
    stopGeneration()
    persistSessionKey(sessionKey)
    await loadChatHistory()
  }

  const renameSession = async (sessionKey, title) => {
    const id = identity.value
    if (id.userRole === 'guest' || !sessionKey || !title?.trim()) return
    const res = await renameAiSession(sessionKey, {
      userRole: id.userRole,
      userId: id.userId,
      adminId: id.adminId,
      title: title.trim()
    })
    if (res.code === 200 && res.data) {
      const idx = sessions.value.findIndex(s => s.sessionKey === sessionKey)
      if (idx !== -1) sessions.value[idx] = res.data
    }
    return res
  }

  const removeSession = async (sessionKey) => {
    const id = identity.value
    if (!sessionKey) return
    stopGeneration()
    if (id.userRole === 'guest') {
      if (sessionKey === currentSessionKey.value) {
        await createSession()
      }
      return
    }
    await deleteAiSession(sessionKey, {
      userType: id.userRole,
      userId: id.userId,
      adminId: id.adminId,
      clearMemory: true
    })
    sessions.value = sessions.value.filter(s => s.sessionKey !== sessionKey)
    if (currentSessionKey.value === sessionKey) {
      if (sessions.value.length > 0) {
        persistSessionKey(sessions.value[0].sessionKey)
        await loadChatHistory()
      } else {
        await createSession()
      }
    }
  }

  const handleRoleSwitch = async (prevIdentity, nextIdentity) => {
    const prevKey = getIdentityMemoryKey(prevIdentity)
    const nextKey = getIdentityMemoryKey(nextIdentity)
    const shouldClear = shouldAutoClearOnRoleSwitch(prevKey, nextKey)

    if (!shouldClear) {
      await loadSessions()
      if (nextIdentity.userRole !== 'guest') {
        await loadChatHistory()
      } else {
        resetLocalMessages(welcomeMessage)
      }
      return
    }

    // ★ 关键修复：退出登录场景（auth state 与 token 都已清空）下，
    //   不再调用清理记忆 API。否则会因 token 缺失触发 401，
    //   并被 request.js 拦截器跳转到 /login 登录页（用户期望跳首页 /）。
    const prevStillAuthed = isIdentityAuthStillValid(prevIdentity)
    if (!prevStillAuthed) {
      persistSessionKey('')
      resetLocalMessages(welcomeMessage)
      return
    }

    roleSwitchHandling = true
    stopGeneration()

    try {
      await clearMemoryForIdentity(prevIdentity, false, null)
    } catch (error) {
      console.warn('切换角色时清理旧身份记忆失败:', error)
    }

    persistSessionKey('')
    resetLocalMessages(ROLE_SWITCH_RESET_TEXT)
    await loadSessions()
    if (nextIdentity.userRole !== 'guest') {
      await loadChatHistory()
    }
    roleSwitchHandling = false
  }

  const sendMessage = async (rawContent, yearOverride, options = {}) => {
    const content = (rawContent ?? inputText.value).trim()
    const imagesToSend = [...pendingImages.value]
    if ((!content && imagesToSend.length === 0) || isStreaming.value) return

    const modelForRequest = (options && options.model) || selectedModel.value || undefined
    const modelMeta = modelOptions.value.find(m => m.id === modelForRequest)
    const requestSupportsVision = modelMeta
      ? !!modelMeta.vision
      : !!(modelForRequest && /v|vision/i.test(modelForRequest))

    if (imagesToSend.length > 0 && !requestSupportsVision) {
      onError?.(new Error('当前模型不支持识图'))
      onRiskBlocked?.({
        message: '当前模型不支持识图，请切换到「GLM-4.6V」后再上传图片'
      })
      return
    }

    if (!currentSessionKey.value) {
      await loadSessions()
    }

    const yearMatch = content.match(/(\d{4})年/)
    const year = yearOverride
      ?? (yearMatch ? parseInt(yearMatch[1], 10) : currentYear.value)
    const id = identity.value
    const sessionId = currentSessionKey.value || undefined

    stopGeneration()
    abortController = new AbortController()
    isStreaming.value = true
    isLoading.value = true

    if (rawContent == null) {
      inputText.value = ''
    }
    pendingImages.value = []

    const displayText = content || '请解析这些图片'
    messages.value.push(buildMessage({
      id: Date.now(),
      role: 'user',
      content: displayText,
      images: imagesToSend.map(img => ({
        previewUrl: img.previewUrl,
        mimeType: img.mimeType
      }))
    }))

    const aiMessageId = Date.now() + 1
    messages.value.push(buildMessage({
      id: aiMessageId,
      role: 'ai',
      content: ''
    }))

    patchSessionTitleLocally(sessionId, displayText)

    try {
      await streamAIChat({
        content: displayText,
        userId: id.userId,
        adminId: id.adminId,
        year,
        messageType: 'general',
        userRole: id.userRole,
        sessionId,
        images: imagesToSend,
        model: modelForRequest,
        signal: abortController.signal,
        onChunk: (chunk) => {
          if (!alive) return
          isLoading.value = false
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content += chunk
            onAfterChunk?.(messages.value[aiMsgIndex])
          }
        },
        onBlocked: (payload) => {
          const tip = payload?.message || `检测到敏感内容「${payload?.riskWord || '敏感词'}」，已拦截并记录。`
          onRiskBlocked?.({ riskWord: payload?.riskWord, message: tip, raw: payload })
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content = tip
          }
        },
        onError: (err) => {
          const tip = err?.message || 'AI 服务异常，请稍后重试'
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content = tip.startsWith('服务器错误')
              ? tip
              : `AI 服务异常：${tip}`
          }
          onError?.(err)
        }
      })
      if (id.userRole !== 'guest') {
        loadSessions()
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('AI聊天失败:', error)
        const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
        if (aiMsgIndex !== -1 && !messages.value[aiMsgIndex].content) {
          const tip = '网络连接异常，请稍后重试。'
          messages.value[aiMsgIndex].content = tip
        }
        onError?.(error)
      }
    } finally {
      isLoading.value = false
      isStreaming.value = false
      abortController = null
      onStreamEnd?.()
    }
  }

  /** 重新生成最后一条 AI 回复：回退到上一条用户消息并重发 */
  const regenerateLast = async () => {
    if (isStreaming.value) return
    const list = messages.value
    let lastAi = -1
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === 'ai') {
        lastAi = i
        break
      }
    }
    if (lastAi <= 0) return
    let lastUser = -1
    for (let i = lastAi - 1; i >= 0; i--) {
      if (list[i].role === 'user') {
        lastUser = i
        break
      }
    }
    if (lastUser < 0) return
    const userMsg = list[lastUser]
    const prompt = userMsg.content || ''
    messages.value = list.slice(0, lastUser)
    await sendMessage(prompt)
  }

  const addImages = async (fileList) => {
    if (!visionEnabled.value) {
      onRiskBlocked?.({
        message: '当前模型不支持识图，请先切换到「GLM-4.6V（识图）」'
      })
      return
    }
    const files = Array.from(fileList || []).filter(f => f.type?.startsWith('image/'))
    if (!files.length) return
    const room = Math.max(0, 4 - pendingImages.value.length)
    const selected = files.slice(0, room)
    for (const file of selected) {
      try {
        const compressed = await compressImageFile(file)
        pendingImages.value.push(compressed)
      } catch (e) {
        console.warn('图片压缩失败:', e)
        onError?.(e)
      }
    }
  }

  const setSelectedModel = (modelId) => {
    selectedModel.value = modelId || ''
    if (modelId) {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId)
    } else {
      localStorage.removeItem(MODEL_STORAGE_KEY)
    }
    if (!visionEnabled.value && pendingImages.value.length) {
      pendingImages.value = []
    }
  }

  /** 解析可用的识图/出图模型（优先配置里 vision=true，否则 glm-4.6v） */
  const resolveVisionModelId = () => {
    const hit = modelOptions.value.find(m => m.vision)
    return hit?.id || 'glm-4.6v'
  }

  const loadModels = async () => {
    try {
      const res = await getAiModels()
      const rows = Array.isArray(res?.data) ? res.data : []
      modelOptions.value = rows.map(m => ({
        id: m.id,
        label: m.label || m.id,
        vision: !!m.vision,
        description: m.description || '',
        isDefault: !!m.default
      }))
      const def = res?.defaultModel
        || modelOptions.value.find(m => m.isDefault)?.id
        || modelOptions.value[0]?.id
        || 'glm-4.6v'
      if (!selectedModel.value || !modelOptions.value.some(m => m.id === selectedModel.value)) {
        setSelectedModel(def)
      }
    } catch (e) {
      console.warn('加载模型列表失败，使用本地默认', e)
      modelOptions.value = [
        { id: 'glm-4.6v', label: 'GLM-4.6V（识图+图表）', vision: true },
        { id: 'glm-4.5-air', label: 'GLM-4.5-Air（纯文本）', vision: false }
      ]
      if (!selectedModel.value) setSelectedModel('glm-4.6v')
    }
  }

  const removePendingImage = (index) => {
    pendingImages.value.splice(index, 1)
  }

  const clearPendingImages = () => {
    pendingImages.value = []
  }

  const clearMemory = async ({ resetText, deleteDb = false } = {}) => {
    const id = identity.value
    stopGeneration()

    try {
      await clearMemoryForIdentity(id, deleteDb, currentSessionKey.value)
    } catch (error) {
      console.error('清除记忆失败:', error)
      throw error
    }

    resetLocalMessages(resetText || '记忆已清空。有什么可以继续帮您的？')
    lastIdentity = { ...id }
  }

  const initIdentityTracking = async () => {
    lastIdentity = { ...identity.value }
    const saved = localStorage.getItem(sessionStorageKey(identity.value))
    if (saved) currentSessionKey.value = saved
    await loadModels()
    await loadSessions()
  }

  return {
    messages,
    inputText,
    isLoading,
    isStreaming,
    currentYear,
    chatCount,
    identity,
    sessions,
    currentSessionKey,
    currentSession,
    sessionsLoading,
    pendingImages,
    modelOptions,
    selectedModel,
    visionEnabled,
    currentModelMeta,
    formatTime,
    setAlive,
    initIdentityTracking,
    loadModels,
    setSelectedModel,
    resolveVisionModelId,
    loadChatHistory,
    loadSessions,
    createSession,
    switchSession,
    renameSession,
    removeSession,
    sendMessage,
    regenerateLast,
    addImages,
    removePendingImage,
    clearPendingImages,
    stopGeneration,
    clearMemory
  }
}
