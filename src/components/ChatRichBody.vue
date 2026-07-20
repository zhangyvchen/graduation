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
    <template v-for="(part, idx) in parts" :key="`${idx}-${part.type}`">
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
  images: { type: Array, default: () => [] }
})

const parts = computed(() => splitAiContent(props.content))
const chartEls = ref([])
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
    const c = instances.pop()
    try { c?.dispose() } catch (_) { /* ignore */ }
  }
}

async function renderCharts() {
  await nextTick()
  await nextTick()
  disposeAll()
  const els = Array.isArray(chartEls.value) ? chartEls.value : (chartEls.value ? [chartEls.value] : [])
  const chartParts = parts.value.filter(p => p.type === 'chart')
  chartParts.forEach((part, i) => {
    const el = els[i]
    if (!el || !part.option) return
    try {
      const chart = echarts.init(el)
      chart.setOption(part.option, true)
      instances.push(chart)
    } catch (e) {
      console.warn('ECharts 渲染失败', e)
    }
  })
}

watch(() => props.content, () => renderCharts(), { flush: 'post' })
watch(parts, () => renderCharts(), { flush: 'post' })
onMounted(() => renderCharts())
onBeforeUnmount(() => disposeAll())
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
  border: 1px solid #e4e7ed;
}
.chart-block {
  width: 100%;
  min-width: 240px;
  height: 280px;
  margin: 10px 0;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #eef0f3;
}
.message-text :deep(h3),
.message-text :deep(h4) {
  margin: 8px 0 4px;
  font-size: 15px;
}
.message-text :deep(p) {
  margin: 4px 0;
  line-height: 1.6;
}
.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 4px 0 4px 18px;
}
.message-text :deep(code) {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
