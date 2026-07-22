<template>
  <div
    ref="rootRef"
    class="ai-float-container"
    :class="{ dragging: isDragging }"
    :style="containerStyle"
  >
    <div class="ai-float-btn" :class="{ active: isOpen, dragging: isDragging }">
      <div class="btn-ring"></div>
      <div class="btn-inner">
        <img class="ai-icon" :src="aiAvatarUrl" alt="AI助手" draggable="false" />
      </div>
      <span class="ai-badge" v-if="unreadCount > 0">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
      <div class="btn-overlay" @mousedown="startDrag" @touchstart="startDrag" @click="toggleChat"></div>
    </div>

    <transition name="chat-panel">
      <div v-if="isOpen" class="ai-chat-panel ai-chat-scope" :style="panelStyle" ref="panelRef">
        <div class="chat-header" @mousedown.stop="startDrag" @touchstart.stop="startDrag">
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
            <button class="header-icon-btn" title="新对话" @click.stop="handleNewChat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
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

        <AiChatShell
          ref="shellRef"
          :messages="messages"
          :is-loading="isLoading"
          :is-streaming="isStreaming"
          :suggestions="emptySuggestions"
          empty-hi="hi ~"
          :empty-title="emptyTitle"
          :empty-desc="emptyDesc"
          :ai-avatar-url="aiAvatarMsgUrl"
          :user-avatar-url="userAvatarUrl"
          @suggest="onSuggest"
          @regenerate="onRegenerate"
        />

        <AiChatComposer
          v-model="inputText"
          v-model:selected-model="selectedModelProxy"
          :pending-images="pendingImages"
          :is-streaming="isStreaming"
          :vision-enabled="visionEnabled"
          :model-options="modelOptions"
          :placeholder="visionEnabled ? '说说你想了解的，或上传图片…' : '说说你想了解的…'"
          @send="sendMessage"
          @stop="stopGeneration"
          @pick-images="onFloatPickImages"
          @remove-image="removePendingImage"
        />

        <div class="resize-handle" @mousedown="startResize" @touchstart="startResize"></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiChat } from '../composables/useAiChat'
import AiChatShell from './AiChatShell.vue'
import AiChatComposer from './AiChatComposer.vue'
import { useAuth } from '../stores/auth'
import {
  AI_CHAT_AVATAR,
  AI_CHAT_HEADER_AVATAR,
  resolveUserChatAvatar
} from '../utils/chatAvatars'

const isOpen = ref(false)
const rootRef = ref(null)
const panelRef = ref(null)
const shellRef = ref(null)
const isDragging = ref(false)
const unreadCount = ref(0)
let resizeMode = null

if (window.__aiFloatButtonMounted__) {
  throw new Error('AIFloatButton should only be mounted once')
}
window.__aiFloatButtonMounted__ = true

const scrollToBottom = () => {
  shellRef.value?.scrollToBottom?.()
}

const {
  messages,
  inputText,
  isLoading,
  isStreaming,
  identity,
  pendingImages,
  modelOptions,
  selectedModel,
  visionEnabled,
  setSelectedModel,
  resolveVisionModelId,
  setAlive,
  initIdentityTracking,
  loadChatHistory,
  createSession,
  sendMessage: sendChatMessage,
  regenerateLast,
  addImages,
  removePendingImage,
  stopGeneration,
  clearMemory: clearChatMemory
} = useAiChat({
  onAfterChunk: () => scrollToBottom(),
  onError: () => ElMessage.error('AI 对话失败，请稍后重试'),
  onRiskBlocked: ({ message }) => {
    ElMessage.warning(message || '检测到敏感内容，已拦截并记录')
  },
  onStreamEnd: () => {
    if (!isOpen.value) {
      unreadCount.value = Math.min(99, unreadCount.value + 1)
    }
  }
})

const selectedModelProxy = computed({
  get: () => selectedModel.value,
  set: (v) => setSelectedModel(v)
})

const ADMIN_QUICK_ACTIONS = [
  { label: '就业分析', prompt: '请根据本届毕业数据做就业分析，给出关键结论与建议。' },
  { label: '趋势预测', prompt: '请结合近年数据做趋势预测，说明可能变化与关注点。' },
  { label: '专业建议', prompt: '请从学院专业对比角度给出管理建议。' },
  { label: '年度报告', prompt: '请帮我梳理一份本届毕业数据年度报告提纲与要点。' }
]

const CHART_SUFFIX =
  ' 回答时请先给出简洁文字结论，再附带一个完整的 ```echarts 图表（数据必须来自上下文，禁止编造）。'

const STUDENT_QUICK_ACTIONS = [
  {
    label: '解读我的画像',
    forceVision: true,
    prompt: '请结合我的个人毕业数据，解读一下我的毕业数据画像，总结关键亮点与特点。' + CHART_SUFFIX
  },
  {
    label: '优势和短板',
    forceVision: true,
    prompt: '请根据我的个人数据，分析我的优势和短板各有哪些，并给出可改进的具体方向。' + CHART_SUFFIX
  },
  {
    label: '就业升学决策',
    forceVision: true,
    prompt: '请基于我的个人去向与学习画像，对比「直接就业」和「继续升学」两条路径：分别说明适配度、主要风险、以及我下一步最该做的 3 件具体事。要求分条、可执行，少鸡汤，不要编造我数据中没有的公司或薪资。' + CHART_SUFFIX
  },
  {
    label: '同窗对比',
    forceVision: true,
    prompt: '请结合数据说明我和同专业、同班同学相比怎么样，只谈均值、排名和百分位等匿名指标，不要涉及其他同学的姓名或学号等隐私。' + CHART_SUFFIX
  }
]

const GUEST_QUICK_ACTIONS = [
  { label: '就业概况', prompt: '请介绍一下本校毕业生就业与升学的总体情况。' },
  { label: '如何使用', prompt: '请介绍你能帮我做什么，以及登录学生账号后有哪些个性化能力。' }
]

const quickActions = computed(() => {
  const role = identity.value?.userRole
  if (role === 'admin') return ADMIN_QUICK_ACTIONS
  if (role === 'student') return STUDENT_QUICK_ACTIONS
  return GUEST_QUICK_ACTIONS
})

const emptySuggestions = computed(() => quickActions.value)
const emptyTitle = computed(() => {
  const role = identity.value?.userRole
  if (role === 'student') return '我是你的毕业数据助手'
  if (role === 'admin') return '我是毕业数据助手'
  return '我是毕业数据助手'
})
const emptyDesc = computed(() => {
  const role = identity.value?.userRole
  if (role === 'student') return '想解读画像、对比同窗，或问问去向，直接告诉我就好'
  if (role === 'admin') return '就业、趋势、专业对比，点下面建议或直接提问'
  return '遇到问题、想了解什么，直接告诉我就好'
})

const onFloatPickImages = async (files) => {
  await addImages(files)
}

const onSuggest = (item) => sendQuickAction(item)
const onRegenerate = async () => {
  await regenerateLast()
  scrollToBottom()
}

const aiAvatarUrl = ref(AI_CHAT_AVATAR)
const aiAvatarHeaderUrl = ref(AI_CHAT_HEADER_AVATAR)
const aiAvatarMsgUrl = ref(AI_CHAT_AVATAR)

const { state: authState } = useAuth()
const userAvatarUrl = computed(() => resolveUserChatAvatar(authState))

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
const MIN_PANEL_WIDTH = 320
const MIN_PANEL_HEIGHT = 400
const DEFAULT_PANEL_WIDTH = 400
const DEFAULT_PANEL_HEIGHT = 560
/** 历史默认尺寸，打开时自动迁移到当前默认 */
const LEGACY_SIZES = new Set([
  '420x520',
  '440x640'
])

const panelWidth = ref(DEFAULT_PANEL_WIDTH)
const panelHeight = ref(DEFAULT_PANEL_HEIGHT)
const isResizing = ref(false)
const startWidth = ref(0)
const startHeight = ref(0)
const viewport = ref({
  width: window.innerWidth,
  height: window.innerHeight
})

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

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
    nextTick(() => scrollToBottom())
  }
}

const closeChat = () => {
  if (!isOpen.value) return
  isOpen.value = false
}

const onDocumentPointerDown = (e) => {
  if (!isOpen.value || isDragging.value || isResizing.value) return
  const target = e.target
  if (!(target instanceof Node)) return
  if (panelRef.value?.contains(target)) return
  if (rootRef.value?.contains(target)) return
  if (target.closest?.('.el-overlay, .el-message-box, .el-message, .el-popper')) return
  closeChat()
}

/** 指针在悬浮窗内滚轮时，不带动背后页面滚动 */
let wheelTarget = null
const onPanelWheel = (e) => {
  e.stopPropagation()
  const el = shellRef.value?.shellRef
  if (!(el instanceof HTMLElement)) {
    e.preventDefault()
    return
  }
  const { scrollTop, scrollHeight, clientHeight } = el
  const maxScroll = scrollHeight - clientHeight
  const atTop = scrollTop <= 0
  const atBottom = scrollTop >= maxScroll - 1
  if (maxScroll <= 0 || (e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
    e.preventDefault()
  }
}

watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      document.addEventListener('mousedown', onDocumentPointerDown, true)
      document.addEventListener('touchstart', onDocumentPointerDown, true)
      wheelTarget = panelRef.value
      wheelTarget?.addEventListener('wheel', onPanelWheel, { passive: false })
    })
  } else {
    document.removeEventListener('mousedown', onDocumentPointerDown, true)
    document.removeEventListener('touchstart', onDocumentPointerDown, true)
    wheelTarget?.removeEventListener('wheel', onPanelWheel)
    wheelTarget = null
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
  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) hasMoved.value = true
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
  if (newX < snapThreshold) newX = VIEW_PADDING
  else if (viewport.value.width - newX - BTN_SIZE < snapThreshold) {
    newX = viewport.value.width - BTN_SIZE - VIEW_PADDING
  }
  if (newY < snapThreshold) newY = VIEW_PADDING
  else if (viewport.value.height - newY - BTN_SIZE < snapThreshold) {
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
      const key = `${size.width}x${size.height}`
      if (LEGACY_SIZES.has(key)) {
        panelWidth.value = DEFAULT_PANEL_WIDTH
        panelHeight.value = DEFAULT_PANEL_HEIGHT
      } else {
        if (size.width) panelWidth.value = size.width
        if (size.height) panelHeight.value = size.height
      }
    } catch (_) {
      /* ignore */
    }
  }
  clampButtonPosition()
  fitPanelToViewport()
}

const sendMessage = async () => {
  if (isStreaming.value) return
  if (!inputText.value.trim() && !pendingImages.value.length) return
  const text = inputText.value
  inputText.value = ''
  scrollToBottom()
  await sendChatMessage(text)
  scrollToBottom()
}

const sendQuickAction = async (action) => {
  if (isStreaming.value || !action?.prompt) return
  const options = {}
  if (action.forceVision) {
    options.model = resolveVisionModelId()
  }
  scrollToBottom()
  await sendChatMessage(action.prompt, undefined, options)
  scrollToBottom()
}

const clearMemory = async () => {
  try {
    await clearChatMemory()
    scrollToBottom()
  } catch (error) {
    console.error('清除记忆失败:', error)
  }
}

const handleNewChat = async () => {
  try {
    await createSession('新对话')
    ElMessage.success('已新建对话')
    scrollToBottom()
  } catch (error) {
    console.error('新建对话失败:', error)
    ElMessage.error('新建对话失败')
  }
}

const handleResize = () => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  clampButtonPosition()
  fitPanelToViewport()
}

onMounted(async () => {
  setAlive(true)
  await initIdentityTracking()
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  loadPosition()
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
  wheelTarget?.removeEventListener('wheel', onPanelWheel)
  wheelTarget = null
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
  background: #2563eb;
  animation: ring-pulse 2s infinite;
  opacity: 0.4;
}

@keyframes ring-pulse {
  0% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

.btn-inner {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.28);
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
  inset: 0;
  z-index: 2;
  border-radius: 50%;
}

.ai-float-btn.active .btn-inner {
  transform: scale(0.92);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.ai-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #e57373;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  z-index: 3;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.ai-chat-panel {
  position: fixed;
  z-index: 10010;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse 90% 60% at 10% -10%, rgba(147, 197, 253, 0.35), transparent 55%),
    radial-gradient(ellipse 70% 50% at 100% 0%, rgba(199, 210, 254, 0.28), transparent 50%),
    linear-gradient(180deg, #eef3fb 0%, #f4f6fb 45%, #eef1f7 100%);
  border-radius: 22px;
  border: none;
  box-shadow: 0 20px 50px rgba(37, 99, 235, 0.16), 0 2px 10px rgba(17, 24, 39, 0.06);
  overflow: hidden;
  overflow-x: hidden;
  overscroll-behavior: contain;
  cursor: default;
  max-width: calc(100vw - 20px);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px 14px;
  background: transparent;
  border-bottom: none;
  cursor: grab;
  flex-shrink: 0;
}

.header-icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ai-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.header-icon-btn:hover {
  background: var(--ai-accent-soft);
  color: var(--ai-accent);
  transform: translateY(-1px);
}

.avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: none;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.status-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #62c462;
  border: 2px solid #fff;
}

.title-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-ink, #1a1d24);
}

.title-status {
  font-size: 11px;
  color: var(--ai-muted, #6b7280);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-chat-panel :deep(.ai-chat-shell) {
  background: transparent;
}

.ai-chat-panel :deep(.ai-chat-composer) {
  background: transparent;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  background:
    linear-gradient(135deg, transparent 50%, var(--ai-border) 50%, var(--ai-border) 60%, transparent 60%),
    linear-gradient(135deg, transparent 70%, var(--ai-muted) 70%, var(--ai-muted) 80%, transparent 80%);
  opacity: 0.7;
}

.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}
</style>
