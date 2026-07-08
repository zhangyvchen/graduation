<template>
  <div class="learning-page">
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
      <el-card class="chart-card">
        <template #header>
          <span>📊 平均绩点分布</span>
          <el-tag size="small" type="info">GPA区间</el-tag>
        </template>
        <div ref="gpaChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { getLearningByYear } from '../api/learning'

const years = [2024, 2023, 2022, 2021]
const selectedYear = ref(2024)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const gpaChartRef = ref(null)
const libraryChartRef = ref(null)
const labChartRef = ref(null)
const competitionChartRef = ref(null)

let gpaChart = null
let libraryChart = null
let labChart = null
let competitionChart = null

const stats = ref({
  averageGpa: 3.28,
  avgBorrow: 18.5,
  labParticipation: 32,
  competitionCount: 156
})

const learningData = ref({
  gpa: [
    { range: '3.5-4.0', count: 180 },
    { range: '3.0-3.5', count: 280 },
    { range: '2.5-3.0', count: 210 },
    { range: '2.0-2.5', count: 95 },
    { range: '<2.0', count: 35 }
  ],
  library: [
    { grade: '大一', count: 22 },
    { grade: '大二', count: 48 },
    { grade: '大三', count: 65 },
    { grade: '大四', count: 38 }
  ],
  lab: [
    { college: '软件工程', rate: 38 },
    { college: '计算机科学', rate: 45 },
    { college: '信息管理', rate: 28 },
    { college: '人工智能', rate: 52 },
    { college: '网络工程', rate: 22 }
  ],
  competition: {
    international: 8,
    national: 35,
    provincial: 62,
    school: 51
  }
})

const loadData = async () => {
  try {
    const res = await getLearningByYear(selectedYear.value)
    if (res.code === 200 && res.data) {
      learningData.value = res.data
      stats.value = res.data.stats || stats.value
    } else {
      // 使用模拟数据
    }
  } catch (e) {
    // 使用模拟数据
  }
  nextTick(() => updateCharts())
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

onMounted(() => {
  loadData()
  nextTick(() => initCharts())
  window.addEventListener('resize', () => {
    [gpaChart, libraryChart, labChart, competitionChart].forEach(c => c?.resize())
  })
})

watch(selectedYear, onYearChange)
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