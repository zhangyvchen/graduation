<template>
  <div
    class="chat-message-row ai-msg-enter"
    :class="[
      isAi ? 'is-ai' : 'is-user',
      isOffice ? 'is-office' : 'is-chat'
    ]"
  >
    <div v-if="!isOffice" class="row-avatar" aria-hidden="true">
      <img v-if="isAi" :src="aiAvatarUrl" alt="" draggable="false" />
      <img v-else-if="userAvatarUrl" :src="userAvatarUrl" alt="" draggable="false" />
      <svg v-else viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#e8eef5" />
        <circle cx="16" cy="14" r="5" fill="var(--ai-accent, #2563eb)" />
        <path
          d="M8 26 Q16 30 24 26"
          stroke="var(--ai-accent, #2563eb)"
          stroke-width="2"
          stroke-linecap="round"
          fill="none"
        />
      </svg>
    </div>

    <div class="row-body">
      <div v-if="isOffice && message.time" class="row-label">
        <span class="row-time">{{ message.time }}</span>
      </div>

      <div class="row-bubble" :class="{ 'has-streaming': streaming }">
        <ChatRichBody
          :content="message.content"
          :images="message.images"
          :streaming="streaming"
        />
        <span v-if="streaming" class="ai-streaming-cursor" aria-hidden="true" />
      </div>

      <div class="row-meta">
        <span v-if="!isOffice" class="row-time">{{ message.time || '' }}</span>
        <div v-if="showActions" class="row-actions">
          <button type="button" class="action-btn" title="复制纯文本" @click="emit('copy', message)">
            <svg class="action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            <span class="action-label">复制纯文本</span>
          </button>
          <button
            v-if="canRegenerate"
            type="button"
            class="action-btn"
            title="重新生成"
            :disabled="busy"
            @click="emit('regenerate', message)"
          >
            <svg class="action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.6-6.3" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
            <span class="action-label">重新生成</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ChatRichBody from './ChatRichBody.vue'

const props = defineProps({
  message: { type: Object, required: true },
  streaming: { type: Boolean, default: false },
  isLastAi: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  aiAvatarUrl: { type: String, default: '/static/AI_3.png' },
  userAvatarUrl: { type: String, default: '' },
  /** chat=悬浮气泡；office=管理端文档流 */
  variant: { type: String, default: 'chat' }
})

const emit = defineEmits(['copy', 'regenerate'])

const isAi = computed(() => props.message?.role === 'ai')
const isOffice = computed(() => props.variant === 'office')
const showActions = computed(() => {
  if (props.streaming || props.busy) return false
  const content = props.message?.content
  return !!(content && String(content).trim())
})
const canRegenerate = computed(() => isAi.value && props.isLastAi)
</script>

<style scoped>
.chat-message-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
}

.chat-message-row.is-user.is-chat {
  flex-direction: row-reverse;
}

.row-avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: var(--ai-surface-muted, #f1f3f6);
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.06);
}

.row-avatar img,
.row-avatar svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.row-body {
  max-width: min(78%, 640px);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.is-user.is-chat .row-body {
  align-items: flex-end;
}

.row-bubble {
  position: relative;
  padding: 10px 14px;
  border-radius: var(--ai-radius-sm, 12px);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: var(--ai-shadow-soft);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: text;
  -webkit-user-select: text;
}

.is-ai.is-chat .row-bubble {
  background: var(--ai-bot-bubble, rgba(255, 255, 255, 0.78));
  color: var(--ai-bot-ink, #111827);
  border: none;
  border-top-left-radius: 4px;
  backdrop-filter: blur(8px);
}

.is-user.is-chat .row-bubble {
  background: var(--ai-user-bubble, #2563eb);
  color: var(--ai-user-ink, #fff);
  border: none;
  border-top-right-radius: 4px;
}

.chat-message-row.is-chat:hover .row-bubble {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(17, 24, 39, 0.08);
}

.row-bubble :deep(.message-text) {
  padding: 0;
  background: transparent !important;
  border: none !important;
  color: inherit;
}

.row-bubble :deep(.message-text a) {
  color: inherit;
  text-decoration: underline;
}

.is-user.is-chat .row-bubble :deep(.chart-block) {
  background: rgba(255, 255, 255, 0.12);
  border: none;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 18px;
  opacity: 0.85;
}

.is-user.is-chat .row-meta {
  flex-direction: row-reverse;
}

.row-time {
  font-size: 11px;
  color: var(--ai-muted, #6b7280);
}

.row-actions {
  display: flex;
  gap: 2px;
  opacity: 1;
}

.action-btn {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 11px;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.15s ease, color 0.15s ease;
}

.action-icon {
  flex-shrink: 0;
  display: block;
}

.action-label {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  transition: max-width 0.18s ease, opacity 0.15s ease;
}

.action-btn:hover:not(:disabled) .action-label,
.action-btn:focus-visible .action-label {
  max-width: 6.5em;
  opacity: 1;
}

.action-btn:hover:not(:disabled) {
  background: var(--ai-accent-soft, rgba(37, 99, 235, 0.12));
  color: var(--ai-accent, #2563eb);
  transform: none;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* —— 管理端办公流：左右分边 + 易复制 —— */
.chat-message-row.is-office.is-user {
  flex-direction: row-reverse;
}

.chat-message-row.is-office {
  gap: 0;
  padding: 4px 0 14px;
}

.chat-message-row.is-office .row-body {
  max-width: min(72%, 680px);
  width: auto;
  gap: 6px;
}

.chat-message-row.is-office.is-ai .row-body {
  align-items: flex-start;
}

.chat-message-row.is-office.is-user .row-body {
  align-items: flex-end;
}

.row-label {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.is-office.is-user .row-label {
  flex-direction: row-reverse;
}

.is-office .row-bubble {
  padding: 2px 0;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  font-size: 14.5px;
  line-height: 1.7;
}

.is-office.is-ai .row-bubble {
  background: transparent;
  color: #111827;
  border: none;
}

.is-office.is-user .row-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  border-top-right-radius: 4px;
  background: #f0f5ff;
  color: #1e3a5f;
  border: 1px solid #dbe7ff;
}

.chat-message-row.is-office:hover .row-bubble {
  transform: none;
  box-shadow: none;
}

.is-office .row-bubble :deep(.message-text),
.is-office .row-bubble :deep(.chart-block) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.is-office .row-meta {
  opacity: 1;
  min-height: 22px;
}

.is-office.is-user .row-meta {
  flex-direction: row-reverse;
}

.is-office .row-actions {
  opacity: 1;
}

.is-office .action-btn {
  font-size: 12px;
  padding: 4px 6px;
  background: transparent;
  border: none;
  color: #9ca3af;
  border-radius: 6px;
}

.is-office .action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #2563eb;
  border-color: transparent;
  transform: none;
}
</style>
