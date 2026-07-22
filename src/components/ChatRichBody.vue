<template>
  <div class="chat-rich-body">
    <div v-if="images?.length" class="msg-images">
      <img
        v-for="(img, idx) in images"
        :key="idx"
        :src="img.previewUrl || toDataUrl(img)"
        class="msg-image"
        alt="上传图片"
      />
    </div>
    <template v-for="(part, idx) in displayParts" :key="`${idx}-${part.type}`">
      <div
        v-if="part.type === 'text' && part.content?.trim()"
        class="message-text"
        v-html="formatTextPart(part.content)"
      />
      <div
        v-else-if="part.type === 'chart'"
        class="chart-block"
        :data-chart-idx="idx"
        ref="chartEls"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { formatTextPart, splitAiContent } from '../utils/aiContentParts'

const props = defineProps({
  content: { type: String, default: '' },
  images: { type: Array, default: () => [] },
  /** 流式中：文本可更新，图表等流结束后再渲染 */
  streaming: { type: Boolean, default: false }
})

const rawParts = computed(() => splitAiContent(props.content))

/** 流式时把图表块收成提示文案，避免每 chunk 刷 ECharts */
const displayParts = computed(() => {
  const parts = rawParts.value
  if (!props.streaming) return parts
  return parts.map((p) => {
    if (p.type !== 'chart') return p
    return {
      type: 'text',
      content: p.option
        ? '（图表生成中，完成后将展示…）'
        : (p.content || '（图表数据未完整生成…）')
    }
  })
})

const chartEls = ref([])
/** @type {{ el: HTMLElement, chart: import('echarts').ECharts }[]} */
const instances = []

function toDataUrl(img) {
  if (!img) return ''
  if (img.previewUrl) return img.previewUrl
  if (img.base64?.startsWith('data:')) return img.base64
  const mime = img.mimeType || 'image/jpeg'
  return `data:${mime};base64,${img.base64 || ''}`
}

function disposeAll() {
  while (instances.length) {
    const item = instances.pop()
    try {
      item?.chart?.dispose()
    } catch (_) {
      /* ignore */
    }
  }
}

function resizeAll() {
  instances.forEach((item) => {
    try {
      item.chart?.resize()
    } catch (_) {
      /* ignore */
    }
  })
}

async function renderCharts() {
  if (props.streaming) return
  await nextTick()
  await nextTick()
  const els = Array.isArray(chartEls.value)
    ? chartEls.value.filter(Boolean)
    : chartEls.value
      ? [chartEls.value]
      : []
  const chartParts = rawParts.value.filter((p) => p.type === 'chart' && p.option)

  if (instances.length !== chartParts.length || instances.some((it, i) => it.el !== els[i])) {
    disposeAll()
  }

  chartParts.forEach((part, i) => {
    const el = els[i]
    if (!el || !part.option) return
    try {
      let chart = instances[i]?.chart
      if (!chart || instances[i]?.el !== el) {
        chart = echarts.init(el)
        instances[i] = { el, chart }
      }
      chart.setOption(part.option, true)
    } catch (e) {
      console.warn('ECharts 渲染失败', e)
    }
  })
}

watch(
  () => [props.content, props.streaming],
  () => {
    if (props.streaming) return
    renderCharts()
  },
  { flush: 'post' }
)

onMounted(() => {
  if (!props.streaming) renderCharts()
  window.addEventListener('resize', resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  disposeAll()
})

defineExpose({ resizeCharts: resizeAll })
</script>

<style scoped>
.chat-rich-body {
  width: 100%;
  min-width: 0;
}
.msg-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.msg-image {
  max-width: 160px;
  max-height: 120px;
  border-radius: 8px;
  object-fit: cover;
  border: none;
  box-shadow: var(--ai-shadow-soft, 0 4px 12px rgba(17, 24, 39, 0.04));
}
.chart-block {
  width: 100%;
  min-width: 240px;
  height: 280px;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 8px;
  border: none;
  box-shadow: var(--ai-shadow-soft, 0 4px 12px rgba(17, 24, 39, 0.04));
}
.message-text :deep(h3),
.message-text :deep(h4) {
  margin: 8px 0 4px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.message-text :deep(h3:first-child),
.message-text :deep(h4:first-child) {
  margin-top: 0;
}
.message-text :deep(p) {
  margin: 4px 0;
  line-height: 1.65;
}
.message-text :deep(p:last-child) {
  margin-bottom: 0;
}
.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 6px 0 8px;
  padding-left: 1.25em;
}
.message-text :deep(li) {
  margin: 3px 0;
}
.message-text :deep(strong) {
  font-weight: 600;
}
.message-text :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: rgba(26, 29, 36, 0.06);
  white-space: pre-wrap;
  word-break: break-word;
}
.message-text :deep(pre) {
  margin: 8px 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(26, 29, 36, 0.06);
  overflow-x: auto;
}
.message-text :deep(pre code) {
  padding: 0;
  background: transparent;
}
</style>
