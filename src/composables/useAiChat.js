import { ref, computed, watch } from 'vue'
import { useAuth } from '../stores/auth'
import { streamAIChat } from '../utils/aiStreamChat'
import { formatAIContent } from '../utils/formatAIContent'
import {
  getChatHistory,
  clearAiMemory,
  listAiSessions,
  createAiSession,
  renameAiSession,
  deleteAiSession
} from '../api/admin'

const DEFAULT_WELCOME =
  '您好！我是毕业数据报告系统的 AI 助手，有什么可以帮您的？'

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

function buildMessage({ id, role, content, time }) {
  return {
    id,
    role,
    content: content || '',
    html: formatAIContent(content || ''),
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
    onRiskBlocked = null
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

  let abortController = null
  let alive = true

  const chatCount = computed(() => messages.value.length)
  const identity = computed(() => resolveChatIdentity(authState))
  const currentSession = computed(() =>
    sessions.value.find(s => s.sessionKey === currentSessionKey.value) || null
  )

  let lastIdentity = { ...identity.value }
  let roleSwitchHandling = false

  const formatMessage = (content) => formatAIContent(content)

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

  const sendMessage = async (rawContent, yearOverride) => {
    const content = (rawContent ?? inputText.value).trim()
    if (!content || isStreaming.value) return

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

    messages.value.push(buildMessage({
      id: Date.now(),
      role: 'user',
      content
    }))

    const aiMessageId = Date.now() + 1
    messages.value.push(buildMessage({
      id: aiMessageId,
      role: 'ai',
      content: ''
    }))

    patchSessionTitleLocally(sessionId, content)

    try {
      await streamAIChat({
        content,
        userId: id.userId,
        adminId: id.adminId,
        year,
        messageType: 'general',
        userRole: id.userRole,
        sessionId,
        signal: abortController.signal,
        onChunk: (chunk) => {
          if (!alive) return
          isLoading.value = false
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content += chunk
            messages.value[aiMsgIndex].html = formatAIContent(messages.value[aiMsgIndex].content)
            onAfterChunk?.(messages.value[aiMsgIndex])
          }
        },
        onBlocked: (payload) => {
          const tip = payload?.message || `检测到敏感内容「${payload?.riskWord || '敏感词'}」，已拦截并记录。`
          onRiskBlocked?.({ riskWord: payload?.riskWord, message: tip, raw: payload })
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content = tip
            messages.value[aiMsgIndex].html = formatAIContent(tip)
          }
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
          messages.value[aiMsgIndex].html = formatAIContent(tip)
        }
        onError?.(error)
      }
    } finally {
      isLoading.value = false
      isStreaming.value = false
      abortController = null
    }
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
    formatMessage,
    formatTime,
    setAlive,
    initIdentityTracking,
    loadChatHistory,
    loadSessions,
    createSession,
    switchSession,
    renameSession,
    removeSession,
    sendMessage,
    stopGeneration,
    clearMemory
  }
}
