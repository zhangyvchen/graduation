<template>
  <div
    class="ai-chat-shell"
    :class="{ 'is-page': isPage, 'is-empty': isEmptyHero }"
    ref="shellRef"
  >
    <div v-if="hiddenCount > 0" class="fold-bar">
      <button type="button" class="ai-chip" @click="showAll = true">
        显示更早的 {{ hiddenCount }} 条消息
      </button>
    </div>

    <!-- 空态：panel 偏聊天；page 偏办公简洁 -->
    <div v-if="isEmptyHero" class="empty-hero" :class="{ 'is-page': isPage }">
      <div class="hero-top">
        <div class="hero-copy">
          <div v-if="emptyHi && !isPage" class="hero-hi">{{ emptyHi }}</div>
          <div class="hero-title">{{ emptyTitle }}</div>
          <p v-if="emptyDesc" class="hero-desc">{{ emptyDesc }}</p>
        </div>
        <AiMascot v-if="!isPage" :src="mascotSrc" size="md" />
      </div>

      <div v-if="pagedSuggestions.length" class="suggest-card">
        <button
          v-for="item in pagedSuggestions"
          :key="item.label || item"
          type="button"
          class="suggest-row"
          :disabled="busy"
          @click="emit('suggest', item)"
        >
          <span class="suggest-label">{{ item.label || item }}</span>
          <span class="suggest-arrow" aria-hidden="true">›</span>
        </button>
        <div v-if="suggestions.length > pageSize" class="suggest-foot">
          <button type="button" class="refresh-btn" :disabled="busy" @click="shufflePage">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0 0 20.49 15" />
            </svg>
            换一批
          </button>
        </div>
      </div>
    </div>

    <template v-else>
      <ChatMessageRow
        v-for="msg in visibleMessages"
        :key="msg.id"
        :message="msg"
        :streaming="isStreaming && isLastAiMessage(msg)"
        :is-last-ai="isLastAiMessage(msg)"
        :busy="busy"
        :variant="isPage ? 'office' : 'chat'"
        :ai-avatar-url="aiAvatarUrl"
        :user-avatar-url="userAvatarUrl"
        @copy="onCopy"
        @regenerate="emit('regenerate', $event)"
      />

      <div v-if="isLoading" class="loading-row">
        <div class="loading-bubble">
          <span class="dot" /><span class="dot" /><span class="dot" />
          <span class="loading-text">正在生成…</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ChatMessageRow from './ChatMessageRow.vue'
import AiMascot from './AiMascot.vue'
import { toPlainAiText } from '../utils/aiContentParts'

const FOLD_KEEP = 40

const props = defineProps({
  messages: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
  suggestions: { type: Array, default: () => [] },
  emptyHi: { type: String, default: 'hi ~' },
  emptyTitle: { type: String, default: '我是毕业数据助手' },
  emptyDesc: { type: String, default: '遇到问题、想了解什么，直接告诉我就好' },
  aiAvatarUrl: { type: String, default: '/static/AI_3.png' },
  /** 当前登录用户头像；游客可留空 */
  userAvatarUrl: { type: String, default: '' },
  /** 自定义空态动图，如 /static/ai-mascot.webp；空则用内置 SVG 动效 */
  mascotSrc: { type: String, default: '' },
  /** panel=悬浮助手；page=管理端满屏 */
  variant: { type: String, default: 'panel' },
  autoScroll: { type: Boolean, default: true },
  pageSize: { type: Number, default: 4 }
})

const emit = defineEmits(['suggest', 'regenerate', 'scroll', 'empty-change'])

const shellRef = ref(null)
const showAll = ref(false)
const pageOffset = ref(0)
const isPage = computed(() => props.variant === 'page')

const busy = computed(() => props.isLoading || props.isStreaming)

/** 无消息，或仅有一条欢迎语 → 视为空态 */
const isEmptyHero = computed(() => {
  if (busy.value) return false
  const list = props.messages || []
  if (!list.length) return true
  if (list.length === 1 && list[0].role === 'ai') return true
  return false
})

watch(isEmptyHero, (v) => emit('empty-change', v), { immediate: true })

const hiddenCount = computed(() => {
  if (showAll.value || isEmptyHero.value) return 0
  const n = props.messages?.length || 0
  return n > FOLD_KEEP ? n - FOLD_KEEP : 0
})

const visibleMessages = computed(() => {
  if (isEmptyHero.value) return []
  const list = props.messages || []
  if (showAll.value || list.length <= FOLD_KEEP) return list
  return list.slice(list.length - FOLD_KEEP)
})

const pagedSuggestions = computed(() => {
  const all = props.suggestions || []
  if (!all.length) return []
  const size = Math.max(1, props.pageSize)
  if (all.length <= size) return all
  const start = pageOffset.value % all.length
  const out = []
  for (let i = 0; i < size; i++) {
    out.push(all[(start + i) % all.length])
  }
  return out
})

function shufflePage() {
  const all = props.suggestions || []
  if (all.length <= props.pageSize) return
  pageOffset.value = (pageOffset.value + props.pageSize) % all.length
}

watch(
  () => props.messages?.length,
  (len, prev) => {
    if (len < (prev || 0)) showAll.value = false
  }
)

function isLastAiMessage(msg) {
  if (msg?.role !== 'ai') return false
  const list = props.messages || []
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].role === 'ai') return list[i].id === msg.id
  }
  return false
}

async function onCopy(msg) {
  const raw = msg?.content || ''
  const text = msg?.role === 'ai' ? toPlainAiText(raw) : String(raw).trim()
  if (!text) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制纯文本')
  } catch {
    ElMessage.error('复制失败')
  }
}

function scrollToBottom() {
  const el = shellRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
  emit('scroll')
}

watch(
  () => [
    props.messages?.length,
    props.messages?.[props.messages.length - 1]?.content?.length || 0,
    props.isLoading
  ],
  async () => {
    if (!props.autoScroll || isEmptyHero.value) return
    await nextTick()
    requestAnimationFrame(scrollToBottom)
  }
)

defineExpose({ scrollToBottom, shellRef, isEmptyHero })
</script>

<style scoped>
.ai-chat-shell {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: stretch;
  justify-content: flex-start;
  position: relative;
  background: transparent;
  isolation: isolate;
}

.ai-chat-shell.is-page {
  padding: 8px 40px 8px;
}

.ai-chat-shell.is-page.is-empty {
  justify-content: flex-start;
}

.empty-hero.is-page {
  width: min(100%, 760px);
  margin: 28px auto 0;
  padding: 0 0 16px;
}

.empty-hero.is-page .hero-top {
  margin-bottom: 16px;
}

.empty-hero.is-page .hero-title {
  margin: 0;
  font-size: 22px;
  font-weight: 650;
  color: #111827;
}

.empty-hero.is-page .hero-desc {
  margin-top: 8px;
  font-size: 13.5px;
  color: #6b7280;
}

.empty-hero.is-page .suggest-card {
  background: #f7f8fa;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-radius: 12px;
  border: 1px solid #eef0f3;
}

.empty-hero.is-page .suggest-row {
  padding: 12px 14px;
  font-size: 13.5px;
}

.empty-hero.is-page .suggest-row:hover:not(:disabled) {
  background: #eef2ff;
}

.ai-chat-shell::before {
  content: '';
  position: absolute;
  inset: -20% 0 auto 0;
  height: 55%;
  background: var(--ai-glow);
  animation: ai-aurora 10s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.ai-chat-shell.is-page::before {
  display: none;
}

.ai-chat-shell > * {
  position: relative;
  z-index: 1;
}

.fold-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.empty-hero {
  flex: 0 0 auto;
  margin: 0;
  padding: 8px 2px 4px;
  width: 100%;
  animation: ai-msg-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  padding: 0 2px;
}

.hero-copy {
  min-width: 0;
  flex: 1;
}

.hero-hi {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ai-ink);
  line-height: 1.15;
}

.hero-title {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 650;
  color: var(--ai-ink);
  line-height: 1.3;
}

.hero-desc {
  margin: 8px 0 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--ai-muted);
  max-width: 100%;
}

.suggest-card {
  background: rgba(255, 255, 255, 0.55);
  border-radius: 16px;
  border: none;
  box-shadow: var(--ai-shadow-soft);
  overflow: hidden;
  max-width: 100%;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.suggest-row {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  border-bottom: 1px solid rgba(17, 24, 39, 0.04);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 13.5px;
  color: var(--ai-ink);
  line-height: 1.4;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    padding-left 0.18s ease,
    transform 0.18s ease;
}

.suggest-row:last-of-type {
  border-bottom: none;
}

.suggest-row:hover:not(:disabled) {
  background: rgba(37, 99, 235, 0.1);
  color: var(--ai-accent);
  padding-left: 16px;
}

.suggest-row:hover:not(:disabled) .suggest-arrow {
  color: var(--ai-accent);
  transform: translateX(3px);
}

.suggest-row:active:not(:disabled) {
  background: rgba(37, 99, 235, 0.16);
  transform: scale(0.995);
}

.suggest-row:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.suggest-label {
  flex: 1;
  min-width: 0;
  transition: letter-spacing 0.18s ease;
}

.suggest-row:hover:not(:disabled) .suggest-label {
  letter-spacing: 0.01em;
}

.suggest-arrow {
  flex-shrink: 0;
  color: rgba(123, 132, 148, 0.7);
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
  transition: transform 0.18s ease, color 0.18s ease;
}

.suggest-foot {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 10px;
  border-top: 1px solid rgba(17, 24, 39, 0.04);
  background: rgba(255, 255, 255, 0.28);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--ai-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.refresh-btn:hover:not(:disabled) {
  color: var(--ai-accent);
  background: var(--ai-accent-soft);
  transform: translateY(-1px);
}

.refresh-btn:hover:not(:disabled) svg {
  animation: refresh-spin 0.7s ease;
}

@keyframes refresh-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(180deg); }
}

.loading-row {
  display: flex;
  padding-left: 44px;
}

.ai-chat-shell.is-page .loading-row {
  padding-left: 0;
}

.loading-bubble {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--ai-radius-sm);
  background: rgba(255, 255, 255, 0.7);
  border: none;
  color: var(--ai-muted);
  font-size: 13px;
  box-shadow: var(--ai-shadow-soft);
  backdrop-filter: blur(8px);
}

.loading-bubble .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ai-accent);
  animation: ai-bounce 1.2s infinite ease-in-out both;
}

.loading-bubble .dot:nth-child(1) { animation-delay: -0.24s; }
.loading-bubble .dot:nth-child(2) { animation-delay: -0.12s; }

@keyframes ai-bounce {
  0%, 80%, 100% { transform: scale(0.55); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
