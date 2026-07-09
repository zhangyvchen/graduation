<!-- src/views/LearningProfile.vue -->
<template>
  <div class="learning-page">
    <DataStory :text="storyText" @regenerate="refreshStory" />
    <DanmakuLayer />

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
        <div ref="gpaChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>📖 图书馆借阅统计</span>
          <el-tag size="small" type="info">借阅量区间</el-tag>
        </template>
        <div ref="libraryChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>🔬 实验室参与情况</span>
          <el-tag size="small" type="info">参与/未参与</el-tag>
        </template>
        <div ref="labChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>🏅 竞赛获奖统计</span>
          <el-tag size="small" type="info">获奖总览</el-tag>
        </template>
        <div ref="competitionChart" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getLearningByYear } from '../api/learning'
import { getDestinationYears } from '../api/destination'
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const gpaChart = ref(null)
const libraryChart = ref(null)
const labChart = ref(null)
const competitionChart = ref(null)

let gpaInstance = null
let libraryInstance = null
let labInstance = null
let competitionInstance = null

const storyText = ref('')

const stats = ref({
  averageGpa: 3.28,
  avgBorrow: 18.5,
  labParticipation: 32,
  competitionCount: 156
})

const statsData = ref({
  gpaData: [],
  libraryData: [],
  labData: []
})

const refreshStory = () => {
  storyText.value = generateStory(statsData.value, 'learning')
}

const onYearChange = () => refreshData()
const onCollegeChange = () => refreshData()

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

const loadStats = async (year) => {
  try {
    const res = await getLearningByYear(year)
    if (res.code === 200 && res.data) {
      statsData.value = res.data
      stats.value.competitionCount = res.data.competitionTotal || 0
      return res.data
    }
  } catch (error) {
    console.error('获取学习统计数据失败:', error)
  }
  return null
}

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

const renderCharts = () => {
  renderGpaChart()
  renderLibraryChart()
  renderLabChart()
  renderCompetitionChart()
}

const renderGpaChart = () => {
  if (!gpaChart.value) return
  if (!gpaInstance) gpaInstance = echarts.init(gpaChart.value)

  const data = statsData.value.gpaData || []
  const labels = ['<2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0']

  gpaInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<strong>${p[0].name}</strong><br/>人数：<strong>${p[0].value}</strong>` },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      type: 'line', data: data, smooth: true,
      symbol: 'circle', symbolSize: 10,
      lineStyle: { width: 3, color: '#667eea' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset:0,color:'rgba(102,126,234,0.3)'},{offset:1,color:'rgba(102,126,234,0.02)'}]) },
      itemStyle: { color: '#667eea' },
      label: { show: true, position: 'top', formatter: '{c}人' }
    }]
  })
  gpaInstance.resize()
}

const renderLibraryChart = () => {
  if (!libraryChart.value) return
  if (!libraryInstance) libraryInstance = echarts.init(libraryChart.value)

  const data = statsData.value.libraryData || []
  const labels = ['0-10本', '11-20本', '21-30本', '>30本']

  libraryInstance.setOption({
    tooltip: { trigger: 'axis', formatter: (p) => `<strong>${p[0].name}</strong><br/>人数：<strong>${p[0].value}</strong>` },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: labels, boundaryGap: false },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      type: 'bar', data: data, barWidth: '50%',
      itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset:0,color:'#4facfe'},{offset:1,color:'#00f2fe'}]) },
      label: { show: true, position: 'top', formatter: '{c}人' }
    }]
  })
  libraryInstance.resize()
}

const renderLabChart = () => {
  if (!labChart.value) return
  if (!labInstance) labInstance = echarts.init(labChart.value)

  const data = statsData.value.labData || []
  const colors = ['#43e97b', '#fa709a']

  labInstance.setOption({
    tooltip: { trigger: 'item', formatter: (p) => `<strong>${p.name}</strong><br/>人数：<strong>${p.value}</strong><br/>占比：<strong>${p.percent}%</strong>` },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.map((item, index) => ({ ...item, itemStyle: { color: colors[index % colors.length] } }))
    }]
  })
  labInstance.resize()
}

const renderCompetitionChart = () => {
  if (!competitionChart.value) return
  if (!competitionInstance) competitionInstance = echarts.init(competitionChart.value)

  const compData = statsData.value.competitionData || []

  if (compData.length > 0) {
    const colors = ['#e74c3c', '#f39c12', '#3498db', '#95a5a6', '#667eea']
    competitionInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8 },
        label: { formatter: '{b}\n{d}%', fontSize: 12 },
        data: compData.map((item, i) => ({
          value: item.value || 0,
          name: item.name || '',
          itemStyle: { color: colors[i % colors.length] }
        }))
      }]
    })
  } else {
    const total = statsData.value.competitionTotal || 0
    competitionInstance.setOption({
      title: {
        text: `总获奖: ${total}人`,
        left: 'center',
        top: 'center',
        textStyle: { fontSize: 20, color: '#667eea', fontWeight: 'bold' }
      },
      series: [{
        type: 'pie',
        radius: ['70%', '80%'],
        silent: true,
        data: [{ value: 1, name: '', itemStyle: { color: '#e8ecf1' } }]
      }]
    })
  }
  competitionInstance.resize()
}
const handleResize = () => {
  if (gpaInstance) gpaInstance.resize()
  if (libraryInstance) libraryInstance.resize()
  if (labInstance) labInstance.resize()
  if (competitionInstance) competitionInstance.resize()
}

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
  if (competitionInstance) { competitionInstance.dispose(); competitionInstance = null }
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
