<template>
  <div 
    ref="rootRef"
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
        <img class="ai-icon" :src="aiAvatarUrl" alt="AI助手" draggable="false" />
      </div>
      <span class="ai-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
      <div class="btn-overlay" @mousedown="startDrag" @touchstart="startDrag" @click="toggleChat"></div>
    </div>
    
    <transition name="chat-panel">
      <div v-if="isOpen" class="ai-chat-panel" :style="panelStyle" ref="panelRef">
        <div class="chat-header" @mousedown.stop="startDrag" @touchstart.stop="startDrag" style="cursor: grab;">
          <div class="chat-title">
            <div class="avatar-wrapper">
              <img class="avatar-icon" :src="aiAvatarHeaderUrl" alt="AI助手" draggable="false" />
              <div class="status-dot"></div>
            </div>
            <div class="title-text">
              <span class="title-name">AI 智能助手</span>
              <span class="title-status">在线</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="header-icon-btn" title="清除记忆" @click.stop="clearMemory">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            <button class="header-icon-btn" title="最小化" @click.stop="toggleChat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="chat-messages" ref="messagesContainer">
          <div class="message" :class="msg.role === 'ai' ? 'ai-message' : 'user-message'" v-for="msg in messages" :key="msg.id">
            <div class="message-avatar" v-if="msg.role === 'ai'">
              <img :src="aiAvatarMsgUrl" alt="AI助手" draggable="false" />
            </div>
            <div class="message-avatar" v-else>
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#e8eef5"/>
                <circle cx="16" cy="14" r="5" fill="#667eea"/>
                <path d="M8 26 Q16 30 24 26" stroke="#667eea" stroke-width="2" stroke-linecap="round" fill="none"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessageContent(msg.content)"></div>
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
              <span class="loading-text">正在生成...</span>
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
              :disabled="isStreaming"
            />
            <button
              v-if="!isStreaming"
              class="send-btn"
              @click="sendMessage"
              :disabled="!inputText.trim()"
              title="发送"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
            <button
              v-else
              class="send-btn stop-send-btn"
              @click="stopGeneration"
              title="停止生成"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiChat } from '../composables/useAiChat'

const isOpen = ref(false)
const rootRef = ref(null)
const panelRef = ref(null)
const isDragging = ref(false)
const unreadCount = ref(0)
const messagesContainer = ref(null)
let resizeMode = null // 仅右下角手柄: 'corner'

if (window.__aiFloatButtonMounted__) {
  throw new Error('AIFloatButton should only be mounted once')
}
window.__aiFloatButtonMounted__ = true

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const {
  messages,
  inputText,
  isLoading,
  isStreaming,
  formatMessage: formatMessageContent,
  formatTime,
  setAlive,
  initIdentityTracking,
  loadChatHistory,
  sendMessage: sendChatMessage,
  stopGeneration,
  clearMemory: clearChatMemory
} = useAiChat({
  onAfterChunk: () => scrollToBottom(),
  onRiskBlocked: ({ message }) => {
    ElMessage.warning(message || '检测到敏感内容，已拦截并记录')
  }
})

const aiAvatarUrl = ref('/static/AI_1.png')
const aiAvatarHeaderUrl = ref('/static/AI_2.png')
const aiAvatarMsgUrl = ref('/static/AI_3.png')

const position = ref({
  x: window.innerWidth - 100,
  y: window.innerHeight - 160
})

const startX = ref(0)
const startY = ref(0)
const startPosX = ref(0)
const startPosY = ref(0)
const hasMoved = ref(false)

const BTN_SIZE = 72
const PANEL_GAP = 12
const VIEW_PADDING = 10
const MIN_PANEL_WIDTH = 300
const MIN_PANEL_HEIGHT = 320
const DEFAULT_PANEL_WIDTH = 420
const DEFAULT_PANEL_HEIGHT = 520

const panelWidth = ref(DEFAULT_PANEL_WIDTH)
const panelHeight = ref(DEFAULT_PANEL_HEIGHT)
const isResizing = ref(false)
const startWidth = ref(0)
const startHeight = ref(0)
const viewport = ref({
  width: window.innerWidth,
  height: window.innerHeight
})

const quickActions = ref([
  { text: '就业分析' },
  { text: '趋势预测' },
  { text: '专业建议' },
  { text: '年度报告' }
])

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/** 最大可拉伸尺寸：接近视口，不再把高度死锁在默认高度 */
const getMaxPanelSize = () => ({
  width: Math.max(MIN_PANEL_WIDTH, viewport.value.width - VIEW_PADDING * 2),
  height: Math.max(MIN_PANEL_HEIGHT, viewport.value.height - VIEW_PADDING * 2)
})

const fitPanelToViewport = () => {
  const max = getMaxPanelSize()
  panelWidth.value = clamp(panelWidth.value, MIN_PANEL_WIDTH, max.width)
  panelHeight.value = clamp(panelHeight.value, MIN_PANEL_HEIGHT, max.height)
}

const clampButtonPosition = () => {
  const maxX = viewport.value.width - BTN_SIZE - VIEW_PADDING
  const maxY = viewport.value.height - BTN_SIZE - VIEW_PADDING
  position.value = {
    x: clamp(position.value.x, VIEW_PADDING, Math.max(VIEW_PADDING, maxX)),
    y: clamp(position.value.y, VIEW_PADDING, Math.max(VIEW_PADDING, maxY))
  }
}

const getPanelPosition = () => {
  const vw = viewport.value.width
  const vh = viewport.value.height
  const max = getMaxPanelSize()
  const w = clamp(panelWidth.value, MIN_PANEL_WIDTH, max.width)
  const h = clamp(panelHeight.value, MIN_PANEL_HEIGHT, max.height)
  const btnX = position.value.x
  const btnY = position.value.y

  let left = btnX + BTN_SIZE - w
  left = clamp(left, VIEW_PADDING, Math.max(VIEW_PADDING, vw - w - VIEW_PADDING))

  const spaceAbove = Math.max(0, btnY - PANEL_GAP - VIEW_PADDING)
  const spaceBelow = Math.max(0, vh - (btnY + BTN_SIZE + PANEL_GAP) - VIEW_PADDING)
  const placeAbove = spaceAbove >= spaceBelow

  let top
  if (placeAbove) {
    top = btnY - h - PANEL_GAP
    if (top < VIEW_PADDING) top = VIEW_PADDING
  } else {
    top = btnY + BTN_SIZE + PANEL_GAP
    if (top + h > vh - VIEW_PADDING) {
      top = Math.max(VIEW_PADDING, vh - VIEW_PADDING - h)
    }
  }

  return {
    left,
    top: clamp(top, VIEW_PADDING, Math.max(VIEW_PADDING, vh - h - VIEW_PADDING)),
    width: w,
    height: h
  }
}

const containerStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`
}))

const panelStyle = computed(() => {
  const { left, top, width, height } = getPanelPosition()
  return {
    width: `${width}px`,
    height: `${height}px`,
    left: `${left}px`,
    top: `${top}px`
  }
})

const toggleChat = () => {
  if (isDragging.value || hasMoved.value) {
    hasMoved.value = false
    return
  }
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    viewport.value = { width: window.innerWidth, height: window.innerHeight }
    clampButtonPosition()
    fitPanelToViewport()
    unreadCount.value = 0
    loadChatHistory()
    scrollToBottom()
  }
}

const closeChat = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

/** 点击聊天框与悬浮按钮以外区域时收起 */
const onDocumentPointerDown = (e) => {
  if (!isOpen.value || isDragging.value || isResizing.value) return
  const target = e.target
  if (!(target instanceof Node)) return
  if (panelRef.value?.contains(target)) return
  if (rootRef.value?.contains(target)) return
  // Element Plus 弹层（如风控提示）不收起
  if (target.closest?.('.el-overlay, .el-message-box, .el-message, .el-popper')) return
  closeChat()
}

watch(isOpen, (open) => {
  if (open) {
    // 等当前点击事件冒泡结束再挂载，避免刚打开就被同一次点击关掉
    nextTick(() => {
      document.addEventListener('mousedown', onDocumentPointerDown, true)
      document.addEventListener('touchstart', onDocumentPointerDown, true)
    })
  } else {
    document.removeEventListener('mousedown', onDocumentPointerDown, true)
    document.removeEventListener('touchstart', onDocumentPointerDown, true)
  }
})

const startDrag = (e) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  const event = e.touches ? e.touches[0] : e
  startX.value = event.clientX
  startY.value = event.clientY
  startPosX.value = position.value.x
  startPosY.value = position.value.y
  
  document.body.style.userSelect = 'none'
  
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
  
  const maxX = viewport.value.width - BTN_SIZE - VIEW_PADDING
  const maxY = viewport.value.height - BTN_SIZE - VIEW_PADDING

  position.value = {
    x: clamp(startPosX.value + deltaX, VIEW_PADDING, Math.max(VIEW_PADDING, maxX)),
    y: clamp(startPosY.value + deltaY, VIEW_PADDING, Math.max(VIEW_PADDING, maxY))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.body.style.userSelect = ''
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
  let newX = position.value.x
  let newY = position.value.y

  if (newX < snapThreshold) {
    newX = VIEW_PADDING
  } else if (viewport.value.width - newX - BTN_SIZE < snapThreshold) {
    newX = viewport.value.width - BTN_SIZE - VIEW_PADDING
  }

  if (newY < snapThreshold) {
    newY = VIEW_PADDING
  } else if (viewport.value.height - newY - BTN_SIZE < snapThreshold) {
    newY = viewport.value.height - BTN_SIZE - VIEW_PADDING
  }

  position.value = { x: newX, y: newY }
  clampButtonPosition()
}

const startResize = (e) => {
  e.preventDefault()
  e.stopPropagation()
  if (!panelRef.value) return

  isResizing.value = true
  resizeMode = 'corner'
  const event = e.touches ? e.touches[0] : e
  startX.value = event.clientX
  startY.value = event.clientY

  // 以当前实际渲染尺寸为起点，避免高度拖不动的死区
  const rect = panelRef.value.getBoundingClientRect()
  startWidth.value = rect.width
  startHeight.value = rect.height
  panelWidth.value = rect.width
  panelHeight.value = rect.height

  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('mouseleave', stopResize)
  document.addEventListener('touchmove', onResize, { passive: false })
  document.addEventListener('touchend', stopResize)
}

const onResize = (e) => {
  if (!isResizing.value || resizeMode !== 'corner') return
  e.preventDefault?.()

  const event = e.touches ? e.touches[0] : e
  const deltaX = event.clientX - startX.value
  const deltaY = event.clientY - startY.value
  const max = getMaxPanelSize()

  panelWidth.value = clamp(startWidth.value + deltaX, MIN_PANEL_WIDTH, max.width)
  panelHeight.value = clamp(startHeight.value + deltaY, MIN_PANEL_HEIGHT, max.height)
}

const stopResize = () => {
  isResizing.value = false
  resizeMode = null
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mouseleave', stopResize)
  document.removeEventListener('touchmove', onResize)
  document.removeEventListener('touchend', stopResize)
  savePanelSize()
}

const savePanelSize = () => {
  localStorage.setItem('aiFloatPanelSize', JSON.stringify({
    width: panelWidth.value,
    height: panelHeight.value
  }))
}

const savePosition = () => {
  localStorage.setItem('aiFloatPosition', JSON.stringify(position.value))
}

const loadPosition = () => {
  const saved = localStorage.getItem('aiFloatPosition')
  if (saved) {
    try {
      const savedPos = JSON.parse(saved)
      position.value = {
        x: savedPos.x ?? position.value.x,
        y: savedPos.y ?? position.value.y
      }
    } catch (e) {
      console.error('加载位置失败:', e)
    }
  }
  const savedSize = localStorage.getItem('aiFloatPanelSize')
  if (savedSize) {
    try {
      const size = JSON.parse(savedSize)
      if (size.width) panelWidth.value = size.width
      if (size.height) panelHeight.value = size.height
    } catch (e) {
      // ignore
    }
  }
  clampButtonPosition()
  fitPanelToViewport()
}

const sendMessage = async () => {
  if (!inputText.value.trim() || isStreaming.value) return
  const text = inputText.value
  inputText.value = ''
  scrollToBottom()
  await sendChatMessage(text)
  scrollToBottom()
}

const sendQuickAction = (text) => {
  if (isStreaming.value) return
  inputText.value = text
  sendMessage()
}

const clearMemory = async () => {
  try {
    await clearChatMemory()
    scrollToBottom()
  } catch (error) {
    console.error('清除记忆失败:', error)
  }
}

const handleResize = () => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  clampButtonPosition()
  fitPanelToViewport()
}

onMounted(() => {
  setAlive(true)
  initIdentityTracking()
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  loadPosition()
  loadChatHistory()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  setAlive(false)
  stopGeneration()
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mouseleave', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  document.removeEventListener('mousedown', onDocumentPointerDown, true)
  document.removeEventListener('touchstart', onDocumentPointerDown, true)
  window.__aiFloatButtonMounted__ = false
})
</script>

<style scoped>
.ai-float-container {
  position: fixed;
  z-index: 9999;
  cursor: grab;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-user-select: none;
}

.ai-float-container:active {
  cursor: grabbing;
}

.ai-float-container.dragging {
  transition: none;
}

.ai-float-btn {
  width: 72px;
  height: 72px;
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
  width: 62px;
  height: 62px;
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
  width: 38px;
  height: 38px;
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
  width: 80px;
  height: 80px;
  margin: -4px;
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
  overflow: hidden;
  position: fixed;
  max-width: calc(100vw - 20px);
  max-height: calc(100vh - 20px);
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
  user-select: none;
  -webkit-user-select: none;
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

.header-icon-btn {
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

.header-icon-btn:hover {
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
  flex: 0 0 auto;
  width: 100%;
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
  flex: 0 1 auto;
  max-width: 78%;
  width: fit-content;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  align-self: flex-start;
}

.user-message .message-content {
  align-self: flex-end;
  align-items: flex-end;
}

.message-text {
  display: block;
  width: fit-content;
  max-width: 100%;
  height: fit-content;
  padding: 14px 18px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-text :deep(p) {
  margin: 0 0 8px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(h3),
.message-text :deep(h4) {
  margin: 10px 0 6px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.message-text :deep(h3:first-child),
.message-text :deep(h4:first-child) {
  margin-top: 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 6px 0 10px;
  padding-left: 20px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(strong) {
  font-weight: 600;
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

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-text {
  font-size: 13px;
  color: #6b7280;
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

.stop-send-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stop-send-btn:hover {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
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
  bottom: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
  touch-action: none;
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