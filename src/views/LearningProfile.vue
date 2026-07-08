<!-- src/views/LearningProfile.vue -->
<template>
  <div class="learning-page">
    <!-- 新增：数据故事 -->
    <DataStory :text="storyText" @regenerate="refreshStory" />

    <!-- 新增：弹幕层 -->
    <DanmakuLayer />

    <!-- 原有内容 -->
    <div class="page-header">
      <h2>📚 学习画像</h2>
      <div class="filter-bar">
        <el-select v-model="selectedYear" placeholder="选择年份" @change="onYearChange">
          <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
        </el-select>
        <el-select v-model="selectedCollege" placeholder="选择学院" clearable @change="onCollegeChange">
          <el-option label="全部学院" value="" />
          <el-option v-for="college in colleges" :key="college" :label="college" :value="college" />
        </el-select>
      </div>
    </div>

    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.averageGpa || 3.28 }}</div>
          <div class="stat-label">平均绩点</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">📖</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgBorrow || 18.5 }}</div>
          <div class="stat-label">人均借阅(本)</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">🔬</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.labParticipation || 32 }}%</div>
          <div class="stat-label">实验室参与率</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">🏅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.competitionCount || 156 }}</div>
          <div class="stat-label">竞赛获奖总数</div>
        </div>
      </el-card>
    </div>

    <div class="charts-grid">
      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>📊 平均绩点分布</span>
          <el-tag size="small" type="info">GPA区间</el-tag>
        </template>
        <div ref="gpaChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>📖 图书馆借阅统计</span>
          <el-tag size="small" type="info">各年级对比</el-tag>
        </template>
        <div ref="libraryChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>🔬 实验室参与情况</span>
          <el-tag size="small" type="info">各学院对比</el-tag>
        </template>
        <div ref="labChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>🏅 竞赛获奖分布</span>
          <el-tag size="small" type="info">按级别</el-tag>
        </template>
        <div ref="competitionChartRef" class="chart"></div>
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
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)

const gpaChart = ref(null)
const libraryChart = ref(null)
const labChart = ref(null)

let gpaInstance = null
let libraryInstance = null
let labInstance = null

// 新增：故事文本
const storyText = ref('')

const stats = ref({
  averageGpa: 3.28,
  avgBorrow: 18.5,
  labParticipation: 32,
  competitionCount: 156
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
  } catch (e) {
    // 使用模拟数据
  }
  // 数据加载完成后生成故事
  storyText.value = generateStory(learningData.value, 'learning')
  nextTick(() => updateCharts())
}

// 刷新故事
const refreshStory = () => {
  storyText.value = generateStory(learningData.value, 'learning')
}

const onYearChange = () => loadData()
const onCollegeChange = () => loadData()

const initCharts = () => {
  if (gpaChartRef.value) gpaChart = echarts.init(gpaChartRef.value)
  if (libraryChartRef.value) libraryChart = echarts.init(libraryChartRef.value)
  if (labChartRef.value) labChart = echarts.init(labChartRef.value)
  if (competitionChartRef.value) competitionChart = echarts.init(competitionChartRef.value)
  updateCharts()
}

const updateCharts = () => {
  // 1. GPA分布 - 柱状图
  if (gpaChart) {
    const data = learningData.value.gpa
    gpaChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>人数：{c}人' },
      grid: { left: '8%', right: '5%', bottom: '12%', top: '8%' },
      xAxis: { type: 'category', data: data.map(d => d.range) },
      yAxis: { type: 'value', name: '人数' },
      series: [{
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params) => {
            const colors = ['#f5576c', '#f093fb', '#4facfe', '#43e97b', '#667eea']
            return colors[params.dataIndex] || '#667eea'
          }
        },
        barWidth: '55%',
        label: { show: true, position: 'top', formatter: '{c}人' }
      }]
    })
    gpaChart.resize()
  }

  // 2. 图书馆借阅 - 折线图
  if (libraryChart) {
    const data = learningData.value.library
    libraryChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>人均借阅：{c}本' },
      grid: { left: '8%', right: '5%', bottom: '12%', top: '8%' },
      xAxis: { type: 'category', data: data.map(d => d.grade) },
      yAxis: { type: 'value', name: '人均借阅(本)' },
      series: [{
        type: 'line',
        data: data.map(d => d.count),
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { width: 3, color: '#667eea' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.02)' }
          ])
        },
        itemStyle: { color: '#667eea' },
        label: { show: true, formatter: '{c}本' }
      }]
    })
    libraryChart.resize()
  }

  // 3. 实验室参与 - 横向条形图
  if (labChart) {
    const data = learningData.value.lab
    const sorted = [...data].sort((a, b) => b.rate - a.rate)
    labChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>参与率：{c}%' },
      grid: { left: '20%', right: '8%', bottom: '8%', top: '8%' },
      xAxis: { type: 'value', max: 70, name: '参与率(%)' },
      yAxis: { type: 'category', data: sorted.map(d => d.college) },
      series: [{
        type: 'bar',
        data: sorted.map(d => d.rate),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#43e97b' },
            { offset: 1, color: '#4facfe' }
          ])
        },
        barWidth: '50%',
        label: { show: true, position: 'right', formatter: '{c}%' }
      }]
    })
    labChart.resize()
  }

  // 4. 竞赛获奖 - 饼图
  if (competitionChart) {
    const d = learningData.value.competition
    competitionChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}项 ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8 },
        label: { formatter: '{b}\n{c}项', fontSize: 12 },
        data: [
          { value: d.international, name: '国际级', itemStyle: { color: '#e74c3c' } },
          { value: d.national, name: '国家级', itemStyle: { color: '#f39c12' } },
          { value: d.provincial, name: '省级', itemStyle: { color: '#3498db' } },
          { value: d.school, name: '校级', itemStyle: { color: '#2ecc71' } }
        ]
      }]
    })
    competitionChart.resize()
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
.learning-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { color: #333; margin: 0; }
.filter-bar { display: flex; gap: 12px; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.stat-icon { font-size: 36px; }
.stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
.stat-label { font-size: 13px; color: #999; }

.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.chart-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.chart-card :deep(.el-card__header) { display: flex; justify-content: space-between; align-items: center; border-bottom: none; padding-bottom: 0; }
.chart { height: 300px; width: 100%; }

@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) { .stats-row { grid-template-columns: 1fr; } }
</style>
