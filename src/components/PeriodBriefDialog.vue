<template>
  <el-dialog
    v-model="visible"
    :title="brief?.title || '一键简报'"
    width="920px"
    top="4vh"
    destroy-on-close
    class="period-brief-dialog"
    @closed="onClosed"
  >
    <div class="brief-toolbar">
      <el-radio-group v-model="periodType" size="small" :disabled="loading">
        <el-radio-button label="weekly">周报</el-radio-button>
        <el-radio-button label="monthly">月报</el-radio-button>
      </el-radio-group>
      <el-select v-model="year" placeholder="届次" style="width: 120px" :disabled="loading">
        <el-option v-for="y in years" :key="y" :label="y + '届'" :value="y" />
      </el-select>
      <el-input
        v-model="department"
        clearable
        placeholder="学院（可选）"
        style="width: 160px"
        :disabled="loading"
      />
      <el-button type="primary" :loading="loading" @click="generate">生成简报</el-button>
      <el-button
        type="success"
        :disabled="!brief || loading"
        :loading="exporting"
        @click="downloadPdf"
      >
        下载 PDF
      </el-button>
    </div>

    <div v-loading="loading" class="brief-body">
      <div v-if="brief" ref="exportRef" class="brief-export">
        <header class="brief-head">
          <h2>{{ brief.title }}</h2>
          <p>{{ brief.periodLabel }} · 生成于 {{ brief.generatedAt }}</p>
          <p v-if="brief.department" class="muted">筛选学院：{{ brief.department }}</p>
          <p class="muted note">{{ brief.note }}</p>
        </header>

        <section class="metrics">
          <div class="metric" v-for="item in metricCards" :key="item.label">
            <div class="metric-value">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
        </section>

        <section class="summary-block">
          <h3>AI 摘要</h3>
          <div class="summary-text" v-html="summaryHtml" />
        </section>

        <section class="charts-grid">
          <div
            v-for="(chart, idx) in brief.charts || []"
            :key="chart.id || idx"
            class="chart-card"
          >
            <div class="chart-title">{{ chart.title }}</div>
            <div :ref="el => setChartEl(el, idx)" class="chart-el" />
          </div>
        </section>
      </div>
      <el-empty v-else description="选择周报/月报与届次后点击生成" />
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { generatePeriodBrief } from '../api/admin'
import { formatAIContent } from '../utils/formatAIContent'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultYear: { type: Number, default: () => new Date().getFullYear() },
  initialPeriodType: { type: String, default: 'weekly' }
})
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const years = [2022, 2023, 2024, 2025, 2026]
const periodType = ref('weekly')
const year = ref(props.defaultYear)
const department = ref('')
const loading = ref(false)
const exporting = ref(false)
const brief = ref(null)
const exportRef = ref(null)
const chartEls = []
const chartInstances = []

watch(() => props.defaultYear, (y) => {
  if (y) year.value = y
})

watch(visible, (open) => {
  if (open) {
    year.value = props.defaultYear
    periodType.value = props.initialPeriodType === 'monthly' ? 'monthly' : 'weekly'
  }
})

const summaryHtml = computed(() => formatAIContent(brief.value?.summary || ''))

const metricCards = computed(() => {
  const m = brief.value?.metrics || {}
  return [
    { label: '毕业生总数', value: m.totalGraduates ?? '-' },
    { label: '就业率', value: formatPct(m.employmentRate) },
    { label: '升学率', value: formatPct(m.enrollmentRate) },
    { label: '平均薪资', value: formatSalary(m.averageSalary) },
    { label: '已就业', value: m.employedCount ?? '-' },
    { label: '升学人数', value: m.enrolledCount ?? '-' }
  ]
})

function formatPct(v) {
  if (v == null || v === '') return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return (n > 1 && n <= 100 ? n : n <= 1 ? n * 100 : n).toFixed(2) + '%'
}

function formatSalary(v) {
  if (v == null || v === '') return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return n.toLocaleString('zh-CN') + ' 元'
}

function setChartEl(el, idx) {
  if (el) chartEls[idx] = el
}

function disposeCharts() {
  while (chartInstances.length) {
    try { chartInstances.pop()?.dispose() } catch (_) { /* ignore */ }
  }
}

async function renderCharts() {
  await nextTick()
  await nextTick()
  disposeCharts()
  const charts = brief.value?.charts || []
  charts.forEach((chart, i) => {
    const el = chartEls[i]
    if (!el || !chart.option) return
    try {
      const inst = echarts.init(el)
      inst.setOption(chart.option, true)
      chartInstances.push(inst)
    } catch (e) {
      console.warn('简报图表渲染失败', e)
    }
  })
}

async function generate() {
  loading.value = true
  brief.value = null
  disposeCharts()
  try {
    const res = await generatePeriodBrief({
      year: year.value,
      periodType: periodType.value,
      department: department.value || undefined
    })
    if (res.code === 200) {
      brief.value = res.data
      await renderCharts()
      ElMessage.success('简报已生成')
    } else {
      ElMessage.error(res.message || '生成失败')
    }
  } catch (e) {
    ElMessage.error(e?.message || '生成失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function downloadPdf() {
  if (!exportRef.value || !brief.value) return
  exporting.value = true
  try {
    await nextTick()
    // 导出前强制图表重绘，避免空白
    chartInstances.forEach(c => c?.resize())
    const canvas = await html2canvas(exportRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 16
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 8
    pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 16
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 8
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 16
    }
    const name = `${brief.value.title || '简报'}_${brief.value.periodLabel || ''}.pdf`.replace(/[\\/:*?"<>|]/g, '_')
    pdf.save(name)
    ElMessage.success('PDF 已下载')
  } catch (e) {
    console.error(e)
    ElMessage.error('导出 PDF 失败')
  } finally {
    exporting.value = false
  }
}

function onClosed() {
  disposeCharts()
  brief.value = null
}
</script>

<style scoped>
.brief-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}
.brief-body {
  min-height: 360px;
  max-height: 68vh;
  overflow: auto;
}
.brief-export {
  background: #fff;
  padding: 8px 4px 16px;
}
.brief-head h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #1f2d3d;
}
.brief-head p {
  margin: 2px 0;
  font-size: 13px;
  color: #606266;
}
.muted { color: #909399 !important; }
.note { font-size: 12px !important; }
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 16px 0;
}
.metric {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
}
.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}
.metric-label {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
.summary-block h3,
.chart-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: #303133;
}
.summary-text {
  line-height: 1.7;
  font-size: 14px;
  color: #303133;
  white-space: normal;
}
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}
.chart-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px;
  background: #fafbfc;
}
.chart-el {
  width: 100%;
  height: 240px;
}
@media (max-width: 768px) {
  .metrics,
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
