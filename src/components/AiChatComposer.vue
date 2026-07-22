<template>
  <div class="ai-chat-composer" :class="{ 'is-floating': floating }">
    <div v-if="pendingImages?.length" class="pending-images">
      <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-item">
        <img :src="img.previewUrl" alt="" />
        <button type="button" class="pending-remove" @click="emit('remove-image', idx)">×</button>
      </div>
    </div>

    <div class="composer-card">
      <el-input
        class="composer-input"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 4 }"
        :model-value="modelValue"
        :placeholder="placeholder"
        :disabled="isStreaming"
        resize="none"
        @update:model-value="emit('update:modelValue', $event)"
        @keydown.enter.exact.prevent="emit('send')"
      />

      <div class="composer-toolbar">
        <div class="toolbar-left">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            hidden
            @change="onPick"
          />
          <button
            type="button"
            class="tool-btn"
            :title="visionEnabled ? '上传图片' : '当前模型不支持识图'"
            :disabled="isStreaming || !visionEnabled || (pendingImages?.length || 0) >= 4"
            @click="fileInputRef?.click()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <el-select
            v-if="showModelSelect"
            :model-value="selectedModel"
            size="small"
            class="model-select"
            :disabled="isStreaming"
            placeholder="模型"
            teleported
            :popper-options="{ strategy: 'fixed' }"
            popper-class="ai-model-popper"
            @change="emit('update:selectedModel', $event)"
          >
            <el-option
              v-for="m in modelOptions"
              :key="m.id"
              :label="m.label"
              :value="m.id"
            >
              <span>{{ m.label }}</span>
              <span class="opt-meta">{{ m.vision ? '识图' : '文本' }}</span>
            </el-option>
          </el-select>
        </div>

        <button
          v-if="!isStreaming"
          type="button"
          class="send-round"
          :disabled="!canSend"
          title="发送"
          @click="emit('send')"
        >
          <svg
            class="send-plane"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
          </svg>
        </button>
        <button
          v-else
          type="button"
          class="send-round is-stop"
          title="停止生成"
          @click="emit('stop')"
        >
          <span class="stop-square" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p class="composer-footnote">由 AI 助手提供服务，回答仅供参考</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  pendingImages: { type: Array, default: () => [] },
  isStreaming: { type: Boolean, default: false },
  visionEnabled: { type: Boolean, default: false },
  modelOptions: { type: Array, default: () => [] },
  selectedModel: { type: String, default: '' },
  showModelSelect: { type: Boolean, default: true },
  placeholder: { type: String, default: '说说你想了解的…' },
  /** 管理端满屏：输入区悬浮留白 */
  floating: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:modelValue',
  'update:selectedModel',
  'send',
  'stop',
  'pick-images',
  'remove-image'
])

const fileInputRef = ref(null)

const canSend = computed(
  () => !!(props.modelValue?.trim() || props.pendingImages?.length)
)

function onPick(e) {
  const files = e.target?.files
  if (files?.length) emit('pick-images', files)
  e.target.value = ''
}
</script>

<style scoped>
.ai-chat-composer {
  flex-shrink: 0;
  padding: 8px 14px 10px;
  background: transparent;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.ai-chat-composer.is-floating {
  padding: 8px 28px 20px;
}

.ai-chat-composer.is-floating .composer-card {
  background: #fff;
  border-radius: 20px;
  box-shadow:
    0 1px 2px rgba(17, 24, 39, 0.04),
    0 10px 28px rgba(17, 24, 39, 0.08);
}

.ai-chat-composer.is-floating .composer-card:focus-within {
  background: #fff;
  box-shadow:
    0 1px 2px rgba(17, 24, 39, 0.04),
    0 14px 32px rgba(17, 24, 39, 0.1);
}

.ai-chat-composer.is-floating .composer-footnote {
  color: #c0c4cc;
}

.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 2px;
}

.pending-item {
  position: relative;
  width: 56px;
  height: 56px;
}

.pending-item img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
  border: none;
  box-shadow: var(--ai-shadow-soft);
}

.pending-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: #e57373;
  color: #fff;
  cursor: pointer;
  line-height: 18px;
  font-size: 12px;
  padding: 0;
}

.composer-card {
  background: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 18px;
  box-shadow: var(--ai-shadow-soft);
  padding: 10px 12px 8px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: box-shadow 0.18s ease, background 0.18s ease;
}

.composer-card:focus-within {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.14);
}

.composer-input :deep(.el-textarea__inner) {
  box-shadow: none !important;
  border: none !important;
  background: transparent;
  padding: 4px 4px 8px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--ai-ink);
  resize: none;
}

.composer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.tool-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.08);
  color: #5b6472;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.tool-btn:hover:not(:disabled) {
  background: var(--ai-accent-soft);
  color: var(--ai-accent);
  transform: scale(1.06);
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.model-select {
  max-width: 160px;
  min-width: 0;
}

.model-select :deep(.el-select__wrapper) {
  box-shadow: none !important;
  background: transparent;
  min-height: 28px;
  padding: 0 8px;
}

.model-select :deep(.el-select__selected-item) {
  font-size: 12px;
  color: var(--ai-muted);
}

.opt-meta {
  float: right;
  color: var(--ai-muted);
  font-size: 12px;
  margin-left: 12px;
}

.send-round {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: var(--ai-accent);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 0;
  padding: 0;
  transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

/* 去基线空隙；旋转后略偏右上做光学居中 */
.send-round .send-plane {
  display: block;
  width: 15px;
  height: 15px;
  transform: translate(0.5px, -0.5px) rotate(-48deg);
  transform-origin: 50% 50%;
}

.send-round:hover:not(:disabled) {
  background: var(--ai-accent-hover);
  transform: scale(1.04);
}

.send-round:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.send-round.is-stop {
  background: var(--ai-accent);
  color: #fff;
  box-shadow: none;
  animation: none;
}

.send-round.is-stop:hover:not(:disabled) {
  background: var(--ai-accent-hover);
  transform: scale(1.04);
}

.stop-square {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 1.5px;
  background: #fff;
}

.composer-footnote {
  margin: 8px 0 0;
  text-align: center;
  font-size: 11px;
  color: #b0b6c0;
  line-height: 1.3;
}
</style>
