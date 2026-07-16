import { ref, computed, watch } from 'vue'
import { useAuth } from '../stores/auth'
import { streamAIChat } from '../utils/aiStreamChat'
import { formatAIContent } from '../utils/formatAIContent'
import { getChatHistory, clearAiMemory } from '../api/admin'

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

/**
 * 是否需要在角色切换时自动清记忆
 * - 游客 -> 学生/管理员：不清
 * - 学生 <-> 管理员、登录 -> 游客：清
 */
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

function mapHistoryMessages(list) {
  return (list || []).map(msg => ({
    id: msg.id,
    role: msg.role === 'ai' ? 'ai' : 'user',
    content: msg.role === 'ai' ? (msg.response || msg.content) : msg.content,
    time: msg.createTime
      ? new Date(msg.createTime).toLocaleTimeString()
      : formatTime()
  }))
}

/**
 * AI 对话公共逻辑：流式发送、停止、历史、清除记忆
 */
export function useAiChat(options = {}) {
  const {
    welcomeMessage = DEFAULT_WELCOME,
    defaultYear = new Date().getFullYear(),
    onAfterChunk = null,
    onError = null
  } = options

  const { state: authState } = useAuth()

  const messages = ref([
    {
      id: 1,
      role: 'ai',
      content: welcomeMessage,
      time: formatTime()
    }
  ])
  const inputText = ref('')
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const currentYear = ref(defaultYear)

  let abortController = null
  let alive = true

  const chatCount = computed(() => messages.value.length)
  const identity = computed(() => resolveChatIdentity(authState))

  let lastIdentity = { ...identity.value }
  let roleSwitchHandling = false

  const formatMessage = (content) => formatAIContent(content)

  const setAlive = (value) => {
    alive = value
  }

  const resetLocalMessages = (resetText) => {
    messages.value = [{
      id: Date.now(),
      role: 'ai',
      content: resetText || welcomeMessage,
      time: formatTime()
    }]
  }

  const clearMemoryForIdentity = async (targetIdentity) => {
    if (!targetIdentity || targetIdentity.userRole === 'guest') return
    await clearAiMemory({
      userType: targetIdentity.userRole,
      userId: targetIdentity.userId,
      adminId: targetIdentity.adminId
    })
  }

  const handleRoleSwitch = async (prevIdentity, nextIdentity) => {
    const prevKey = getIdentityMemoryKey(prevIdentity)
    const nextKey = getIdentityMemoryKey(nextIdentity)
    const shouldClear = shouldAutoClearOnRoleSwitch(prevKey, nextKey)

    if (!shouldClear) {
      if (nextIdentity.userRole !== 'guest') {
        await loadChatHistory()
      }
      return
    }

    roleSwitchHandling = true
    stopGeneration()

    try {
      await clearMemoryForIdentity(prevIdentity)
    } catch (error) {
      console.warn('切换角色时清理旧身份记忆失败:', error)
    }

    resetLocalMessages(ROLE_SWITCH_RESET_TEXT)

    if (nextIdentity.userRole !== 'guest') {
      await loadChatHistory()
    }

    roleSwitchHandling = false
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
    if (id.userRole === 'guest') return

    try {
      const response = await getChatHistory(id.userId, {
        userType: id.userRole,
        adminId: id.adminId
      })
      if (!alive) return
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

  const sendMessage = async (rawContent, yearOverride) => {
    const content = (rawContent ?? inputText.value).trim()
    if (!content || isStreaming.value) return

    stopGeneration()
    abortController = new AbortController()
    isStreaming.value = true
    isLoading.value = true

    if (rawContent == null) {
      inputText.value = ''
    }

    messages.value.push({
      id: Date.now(),
      role: 'user',
      content,
      time: formatTime()
    })

    const aiMessageId = Date.now() + 1
    messages.value.push({
      id: aiMessageId,
      role: 'ai',
      content: '',
      time: formatTime()
    })

    const yearMatch = content.match(/(\d{4})年/)
    const year = yearOverride
      ?? (yearMatch ? parseInt(yearMatch[1], 10) : currentYear.value)

    const id = identity.value

    try {
      await streamAIChat({
        content,
        userId: id.userId,
        adminId: id.adminId,
        year,
        messageType: 'general',
        userRole: id.userRole,
        signal: abortController.signal,
        onChunk: (chunk) => {
          if (!alive) return
          isLoading.value = false
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content += chunk
            onAfterChunk?.(messages.value[aiMsgIndex])
          }
        }
      })
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('AI聊天失败:', error)
        const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
        if (aiMsgIndex !== -1 && !messages.value[aiMsgIndex].content) {
          messages.value[aiMsgIndex].content = '网络连接异常，请稍后重试。'
        }
        onError?.(error)
      }
    } finally {
      isLoading.value = false
      isStreaming.value = false
      abortController = null
    }
  }

  const clearMemory = async ({ resetText } = {}) => {
    const id = identity.value
    stopGeneration()

    try {
      await clearMemoryForIdentity(id)
    } catch (error) {
      console.error('清除记忆失败:', error)
      throw error
    }

    resetLocalMessages(resetText || '记忆已清空。有什么可以继续帮您的？')
    lastIdentity = { ...id }
  }

  const initIdentityTracking = () => {
    lastIdentity = { ...identity.value }
  }

  return {
    messages,
    inputText,
    isLoading,
    isStreaming,
    currentYear,
    chatCount,
    identity,
    formatMessage,
    formatTime,
    setAlive,
    initIdentityTracking,
    loadChatHistory,
    sendMessage,
    stopGeneration,
    clearMemory
  }
}
