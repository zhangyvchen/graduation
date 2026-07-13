<template>
  <div 
    class="ai-float-container"
    :class="{ 'dragging': isDragging }"
    :style="containerStyle"
  >
    <div 
      class="ai-float-btn" 
      :class="{ 'active': isOpen, 'dragging': isDragging }"
    >
      <div class="btn-ring"></div>
      <div class="btn-inner">
        <img class="ai-icon" :src="aiAvatarUrl" alt="AI助手" />
      </div>
      <span class="ai-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
      <div class="btn-overlay" @mousedown="startDrag" @touchstart="startDrag" @click="toggleChat"></div>
    </div>
    
    <transition name="chat-panel">
      <div v-if="isOpen" class="ai-chat-panel" :style="panelStyle">
        <div class="chat-header" @mousedown="startDrag" @touchstart="startDrag">
          <div class="chat-title">
            <div class="avatar-wrapper">
              <img class="avatar-icon" :src="aiAvatarHeaderUrl" alt="AI助手" />
              <div class="status-dot"></div>
            </div>
            <div class="title-text">
              <span class="title-name">AI 智能助手</span>
              <span class="title-status">在线</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="minimize-btn" @click.stop="toggleChat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="chat-messages" ref="messagesContainer">
          <div class="message" :class="msg.role === 'ai' ? 'ai-message' : 'user-message'" v-for="msg in messages" :key="msg.id">
            <div class="message-avatar" v-if="msg.role === 'ai'">
              <img :src="aiAvatarMsgUrl" alt="AI助手" />
            </div>
            <div class="message-avatar" v-else>
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#e8eef5"/>
                <circle cx="16" cy="14" r="5" fill="#667eea"/>
                <path d="M8 26 Q16 30 24 26" stroke="#667eea" stroke-width="2" stroke-linecap="round" fill="none"/>
              </svg>
            </div>
            <div class="message-content">
              <span class="message-text">{{ msg.content }}</span>
              <span class="message-time">{{ msg.time || formatTime() }}</span>
            </div>
          </div>
          <div v-if="isLoading" class="loading-indicator">
            <div class="loading-bubble">
              <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <div class="input-wrapper">
            <input 
              v-model="inputText" 
              placeholder="输入问题..." 
              @keyup.enter="sendMessage"
              class="input-field"
            />
            <button class="send-btn" @click="sendMessage" :disabled="isLoading">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'sending': isLoading }">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div class="quick-actions">
            <button 
              v-for="action in quickActions" 
              :key="action.text"
              class="quick-action-btn"
              @click="sendQuickAction(action.text)"
            >
              {{ action.text }}
            </button>
          </div>
        </div>
        <div class="resize-handle" @mousedown="startResize" @touchstart="startResize"></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const isOpen = ref(false)
const isLoading = ref(false)
const isDragging = ref(false)
const unreadCount = ref(0)
const inputText = ref('')
const userId = ref('user_' + new Date().getTime())
const messagesContainer = ref(null)

const aiAvatarUrl = ref('/static/AI_1.png')
const aiAvatarHeaderUrl = ref('/static/AI_2.png')
const aiAvatarMsgUrl = ref('/static/AI_3.png')

const position = ref({
  x: window.innerWidth - 80,
  y: window.innerHeight - 140
})

const startX = ref(0)
const startY = ref(0)
const startPosX = ref(0)
const startPosY = ref(0)
const hasMoved = ref(false)

const panelWidth = ref(420)
const panelHeight = ref(580)
const isResizing = ref(false)
const startWidth = ref(0)
const startHeight = ref(0)

const quickActions = ref([
  { text: '就业分析' },
  { text: '趋势预测' },
  { text: '专业建议' },
  { text: '年度报告' }
])

const containerStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`
}))

const panelStyle = computed(() => ({
  width: `${panelWidth.value}px`,
  height: `${panelHeight.value}px`
}))

const messages = ref([
  {
    id: 1,
    role: 'ai',
    content: '您好！我是毕业数据报告系统的 AI 助手，有什么可以帮您的？',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
])

const formatTime = () => {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const toggleChat = () => {
  if (isDragging.value || hasMoved.value) {
    hasMoved.value = false
    return
  }
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    loadChatHistory()
    scrollToBottom()
  }
}

const startDrag = (e) => {
  isDragging.value = true
  const event = e.touches ? e.touches[0] : e
  startX.value = event.clientX
  startY.value = event.clientY
  startPosX.value = position.value.x
  startPosY.value = position.value.y
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('mouseleave', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  const event = e.touches ? e.touches[0] : e
  const deltaX = event.clientX - startX.value
  const deltaY = event.clientY - startY.value
  
  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
    hasMoved.value = true
  }
  
  let newX = startPosX.value + deltaX
  let newY = startPosY.value + deltaY
  
  const maxX = window.innerWidth - 56
  const maxY = window.innerHeight - 56
  
  newX = Math.max(10, Math.min(maxX, newX))
  newY = Math.max(10, Math.min(maxY, newY))
  
  position.value = { x: newX, y: newY }
}

const stopDrag = () => {
  isDragging.value = false
  snapToEdge()
  savePosition()
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mouseleave', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

const snapToEdge = () => {
  const snapThreshold = 60
  const btnWidth = 56
  
  let newX = position.value.x
  let newY = position.value.y
  
  if (newX < snapThreshold) {
    newX = 10
  } else if (window.innerWidth - newX - btnWidth < snapThreshold) {
    newX = window.innerWidth - btnWidth - 10
  }
  
  if (newY < snapThreshold) {
    newY = 10
  } else if (window.innerHeight - newY - btnWidth < snapThreshold) {
    newY = window.innerHeight - btnWidth - 10
  }
  
  if (newX !== position.value.x || newY !== position.value.y) {
    position.value = { x: newX, y: newY }
  }
}

const startResize = (e) => {
  e.preventDefault()
  e.stopPropagation()
  isResizing.value = true
  const event = e.touches ? e.touches[0] : e
  startX.value = event.clientX
  startY.value = event.clientY
  startWidth.value = panelWidth.value
  startHeight.value = panelHeight.value
  
  document.body.style.userSelect = 'none'
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('mouseleave', stopResize)
  document.addEventListener('touchmove', onResize)
  document.addEventListener('touchend', stopResize)
}

const onResize = (e) => {
  if (!isResizing.value) return
  
  const event = e.touches ? e.touches[0] : e
  const deltaX = event.clientX - startX.value
  const deltaY = event.clientY - startY.value
  
  panelWidth.value = Math.max(320, Math.min(800, startWidth.value + deltaX))
  panelHeight.value = Math.max(400, Math.min(800, startHeight.value + deltaY))
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.userSelect = ''
  
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mouseleave', stopResize)
  document.removeEventListener('touchmove', onResize)
  document.removeEventListener('touchend', stopResize)
}

const savePosition = () => {
  localStorage.setItem('aiFloatPosition', JSON.stringify(position.value))
}

const loadPosition = () => {
  const saved = localStorage.getItem('aiFloatPosition')
  if (saved) {
    try {
      const savedPos = JSON.parse(saved)
      const maxX = window.innerWidth - 56
      const maxY = window.innerHeight - 56
      
      position.value = {
        x: Math.max(10, Math.min(maxX, savedPos.x)),
        y: Math.max(10, Math.min(maxY, savedPos.y))
      }
    } catch (e) {
      console.error('加载位置失败:', e)
    }
  }
}

const loadChatHistory = async () => {
  try {
    const response = await fetch(`/api/ai/chat-history/${userId.value}`)
    const data = await response.json()
    if (data.code === 200 && data.data && data.data.length > 0) {
      messages.value = data.data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.role === 'ai' ? msg.response || msg.content : msg.content,
        time: formatTime()
      }))
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return
  
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: inputText.value,
    time: formatTime()
  })
  
  inputText.value = ''
  isLoading.value = true
  scrollToBottom()
  
  const aiMessageId = Date.now() + 1
  messages.value.push({
    id: aiMessageId,
    role: 'ai',
    content: '',
    time: formatTime()
  })
  
  try {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId.value,
        content: messages.value[messages.value.length - 2].content,
        messageType: 'general'
      })
    })
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.includes('[DONE]') && !trimmedLine.startsWith('event:') && !trimmedLine.startsWith('data:')) {
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content += trimmedLine
            scrollToBottom()
          }
        }
      }
    }
    
    isLoading.value = false
    
  } catch (error) {
    console.error('AI聊天失败:', error)
    isLoading.value = false
    const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
    if (aiMsgIndex !== -1) {
      messages.value[aiMsgIndex].content = '网络连接异常，请稍后重试。'
    }
  }
}

const sendQuickAction = (text) => {
  inputText.value = text
  sendMessage()
}

const handleResize = () => {
  const maxX = window.innerWidth - 56
  const maxY = window.innerHeight - 56
  
  position.value = {
    x: Math.min(maxX, position.value.x),
    y: Math.min(maxY, position.value.y)
  }
}

onMounted(() => {
  loadPosition()
  loadChatHistory()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mouseleave', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
.ai-float-container {
  position: fixed;
  z-index: 9999;
  cursor: grab;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-float-container:active {
  cursor: grabbing;
}

.ai-float-container.dragging {
  transition: none;
}

.ai-float-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  z-index: 10000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: ring-pulse 2s infinite;
  opacity: 0.6;
}

@keyframes ring-pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.4);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.btn-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.35);
  position: relative;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  pointer-events: none;
}

.btn-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 64px;
  height: 64px;
  margin: -8px;
  border-radius: 50%;
  z-index: 10;
  cursor: grab;
}

.ai-float-btn:hover .btn-inner {
  transform: scale(1.05);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.45);
}

.ai-float-btn.active .btn-inner {
  transform: scale(1.05) rotate(180deg);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-float-btn.active .ai-icon {
  filter: brightness(0) invert(1);
}

.ai-float-btn.dragging .btn-inner {
  transform: scale(1.15);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
}

.ai-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  z-index: 2;
}

.ai-chat-panel {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  border-radius: 24px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
  overflow: hidden;
  position: absolute;
  bottom: 70px;
  right: 0;
  animation: panel-appear 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes panel-appear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-wrapper {
  position: relative;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.status-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 50%;
  border: 3px solid #667eea;
  animation: status-blink 2s infinite;
}

@keyframes status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.title-text {
  display: flex;
  flex-direction: column;
}

.title-name {
  font-size: 16px;
  font-weight: 600;
}

.title-status {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.minimize-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.minimize-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  min-height: 0;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
}

.message-avatar svg,
.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-message {
  flex-direction: row-reverse;
}

.user-message .message-avatar {
  margin-left: 0;
}

.message-content {
  flex: 1;
  max-width: 78%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-text {
  display: inline-block;
  padding: 14px 18px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.ai-message .message-text {
  background: #fff;
  color: #1f2937;
  border-radius: 4px 20px 20px 20px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
}

.user-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  margin-left: auto;
  border-radius: 20px 4px 20px 20px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  padding: 0 6px;
}

.ai-message .message-time {
  align-self: flex-start;
}

.user-message .message-time {
  align-self: flex-end;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.loading-bubble {
  background: #fff;
  padding: 14px 20px;
  border-radius: 4px 20px 20px 20px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots .dot {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  animation: loading-bounce 1.4s infinite ease-in-out both;
}

.loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes loading-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
}

.input-wrapper {
  display: flex;
  gap: 10px;
}

.input-field {
  flex: 1;
  padding: 14px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 28px;
  font-size: 14px;
  outline: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f9fafb;
}

.input-field:focus {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
}

.input-field::placeholder {
  color: #9ca3af;
}

.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn .sending {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.quick-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.quick-action-btn {
  padding: 8px 18px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-action-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
}

.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.chat-panel-enter-to,
.chat-panel-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.resize-handle {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.resize-handle:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.resize-handle::after {
  content: '';
  width: 8px;
  height: 8px;
  border-right: 2px solid #9ca3af;
  border-bottom: 2px solid #9ca3af;
  transform: rotate(-45deg);
}

.resize-handle:hover::after {
  border-right-color: #fff;
  border-bottom-color: #fff;
}
</style>