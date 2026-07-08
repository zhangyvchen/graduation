<!-- src/views/LearningProfile.vue -->
<template>
  <div class="learning-page">
    <div class="year-selector">
      <el-select v-model="selectedYear" placeholder="选择年份" @change="onYearChange">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
      <el-button type="primary" @click="refreshData" :loading="loading" style="margin-left: 12px;">
        刷新数据
      </el-button>
    </div>

    <div class="charts-grid">
      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>平均绩点分布</span>
        </template>
        <div ref="gpaChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>图书馆借阅统计</span>
        </template>
        <div ref="libraryChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>实验室参与度</span>
        </template>
        <div ref="labChart" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getLearningByYear } from '../api/learning'
import { getDestinationYears } from '../api/destination'

const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)

const gpaChart = ref(null)
const libraryChart = ref(null)
const labChart = ref(null)

let gpaInstance = null
let libraryInstance = null
let labInstance = null

// ========== 数据状态 ==========
const statsData = ref({
  gpaData: [],
  libraryData: [],
  labData: []
})

// ========== 获取年份列表 ==========
const loadYears = async () => {
  try {
    const res = await getDestinationYears()
    if (res.code === 200 && res.data) {
      years.value = res.data
      if (years.value.length > 0 && !selectedYear.value) {
        selectedYear.value = years.value[0]
      }
    }
  } catch (error) {
    console.error('获取年份列表失败:', error)
    years.value = [2024, 2023, 2022, 2021]
    if (!selectedYear.value) {
      selectedYear.value = years.value[0]
    }
  }
}

// ========== 加载统计数据 ==========
const loadStats = async (year) => {
  try {
    const res = await getLearningByYear(year)
    if (res.code === 200 && res.data) {
      statsData.value = res.data
      return res.data
    }
  } catch (error) {
    console.error('获取学习统计数据失败:', error)
  }
  return null
}

// ========== 刷新数据 ==========
const refreshData = async () => {
  if (loading.value || !selectedYear.value) return

  loading.value = true
  try {
    await loadStats(selectedYear.value)
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

const onYearChange = () => {
  refreshData()
}

// ========== 渲染所有图表 ==========
const renderCharts = () => {
  renderGpaChart()
  renderLibraryChart()
  renderLabChart()
}

// ========== GPA 分布图表 ==========
const renderGpaChart = () => {
  if (!gpaChart.value) return
  if (!gpaInstance) {
    gpaInstance = echarts.init(gpaChart.value)
  }

  const data = statsData.value.gpaData || []
  const labels = ['<2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0']

  if (!data || data.length === 0 || data.every(v => v === 0)) {
    gpaInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{ type: 'bar', data: [] }]
    })
    return
  }

  gpaInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `<strong>${p.name}</strong><br/>人数：<strong>${p.value}</strong>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: data,
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ])
      },
      label: { show: true, position: 'top' }
    }]
  })

  gpaInstance.resize()
}

// ========== 图书馆借阅图表 ==========
const renderLibraryChart = () => {
  if (!libraryChart.value) return
  if (!libraryInstance) {
    libraryInstance = echarts.init(libraryChart.value)
  }

  const data = statsData.value.libraryData || []
  const labels = ['大一', '大二', '大三', '大四']

  if (!data || data.length === 0 || data.every(v => v === 0)) {
    libraryInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{ type: 'line', data: [] }]
    })
    return
  }

  libraryInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `<strong>${p.name}</strong><br/>借阅人数：<strong>${p.value}</strong>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: labels, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#4facfe' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(79, 172, 254, 0.3)' },
          { offset: 1, color: 'rgba(79, 172, 254, 0.05)' }
        ])
      },
      itemStyle: { color: '#4facfe' },
      label: { show: true, position: 'top' }
    }]
  })

  libraryInstance.resize()
}

// ========== 实验室参与度图表 ==========
const renderLabChart = () => {
  if (!labChart.value) return
  if (!labInstance) {
    labInstance = echarts.init(labChart.value)
  }

  const data = statsData.value.labData || []

  if (!data || data.length === 0) {
    labInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      series: [{ type: 'pie', data: [] }]
    })
    return
  }

  const colors = ['#43e97b', '#fa709a']

  labInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `<strong>${params.name}</strong><br/>人数：<strong>${params.value}</strong><br/>占比：<strong>${params.percent}%</strong>`
      }
    },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.map((item, index) => ({
        ...item,
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  })

  labInstance.resize()
}

// ========== 窗口自适应 ==========
const handleResize = () => {
  if (gpaInstance) gpaInstance.resize()
  if (libraryInstance) libraryInstance.resize()
  if (labInstance) labInstance.resize()
}

// ========== 生命周期 ==========
onMounted(async () => {
  await loadYears()
  await refreshData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (gpaInstance) { gpaInstance.dispose(); gpaInstance = null }
  if (libraryInstance) { libraryInstance.dispose(); libraryInstance = null }
  if (labInstance) { labInstance.dispose(); labInstance = null }
})
</script>

<style scoped>
.learning-page {
  padding: 0;
}

.year-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
}

.chart {
  height: 300px;
}

@media (max-width: 992px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
