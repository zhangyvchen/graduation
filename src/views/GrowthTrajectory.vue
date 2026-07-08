<!-- src/views/GrowthTrajectory.vue -->
<template>
  <div class="growth-page">
    <!-- 新增：数据故事 -->
    <DataStory :text="storyText" @regenerate="refreshStory" />

    <!-- 新增：弹幕层 -->
    <DanmakuLayer />

    <!-- 原有内容 -->
    <div class="page-header">
      <h2>📈 成长轨迹</h2>
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

    <div class="charts-grid">
      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>🏆 荣誉奖项分布</span>
          <el-tag size="small" type="info">按级别</el-tag>
        </template>
        <div ref="honorChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>💰 奖学金获得率</span>
          <el-tag size="small" type="info">各学院对比</el-tag>
        </template>
        <div ref="scholarshipChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>👔 学生干部任职分布</span>
          <el-tag size="small" type="info">岗位结构</el-tag>
        </template>
        <div ref="cadreChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>🚩 入党情况分布</span>
          <el-tag size="small" type="info">政治面貌</el-tag>
        </template>
        <div ref="partyChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>学生干部分布</span>
        </template>
        <div ref="cadreChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>政治面貌分布</span>
        </template>
        <div ref="partyChart" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getGrowthByYear } from '../api/growth'
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = [2024, 2023, 2022, 2021]
const selectedYear = ref(2024)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const honorChartRef = ref(null)
const scholarshipChartRef = ref(null)
const cadreChartRef = ref(null)
const partyChartRef = ref(null)

let honorChart = null
let scholarshipChart = null
let cadreChart = null
let partyChart = null

// 新增：故事文本
const storyText = ref('')

const growthData = ref({
  honor: { national: 0, provincial: 0, school: 0, college: 0 },
  scholarship: [],
  cadre: { president: 0, minister: 0, monitor: 0, secretary: 0 },
  party: { partyMember: 0, probationary: 0, activist: 0, mass: 0 }
})

const loadData = async () => {
  try {
    const res = await getGrowthByYear(selectedYear.value)
    if (res.code === 200 && res.data) {
      growthData.value = res.data
    } else {
      // 使用模拟数据
      growthData.value = {
        honor: { national: 28, provincial: 56, school: 120, college: 85 },
        scholarship: [
          { college: '软件工程', rate: 38.5 },
          { college: '计算机科学', rate: 42.3 },
          { college: '信息管理', rate: 35.2 },
          { college: '人工智能', rate: 45.8 },
          { college: '网络工程', rate: 32.6 }
        ],
        cadre: { president: 12, minister: 48, monitor: 65, secretary: 38 },
        party: { partyMember: 180, probationary: 95, activist: 210, mass: 715 }
      }
    }
  } catch (e) {
    // 使用模拟数据
    growthData.value = {
      honor: { national: 28, provincial: 56, school: 120, college: 85 },
      scholarship: [
        { college: '软件工程', rate: 38.5 },
        { college: '计算机科学', rate: 42.3 },
        { college: '信息管理', rate: 35.2 },
        { college: '人工智能', rate: 45.8 },
        { college: '网络工程', rate: 32.6 }
      ],
      cadre: { president: 12, minister: 48, monitor: 65, secretary: 38 },
      party: { partyMember: 180, probationary: 95, activist: 210, mass: 715 }
    }
  }
  // 数据加载完成后生成故事
  storyText.value = generateStory(growthData.value, 'growth')
  nextTick(() => updateCharts())
}

// 刷新故事
const refreshStory = () => {
  storyText.value = generateStory(growthData.value, 'growth')
}

const onYearChange = () => loadData()
const onCollegeChange = () => loadData()

const initCharts = () => {
  if (honorChartRef.value) honorChart = echarts.init(honorChartRef.value)
  if (scholarshipChartRef.value) scholarshipChart = echarts.init(scholarshipChartRef.value)
  if (cadreChartRef.value) cadreChart = echarts.init(cadreChartRef.value)
  if (partyChartRef.value) partyChart = echarts.init(partyChartRef.value)
  updateCharts()
}

const updateCharts = () => {
  // 1. 荣誉奖项分布 - 柱状图
  if (honorChart) {
    const d = growthData.value.honor
    honorChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '8%', right: '5%', bottom: '12%', top: '8%' },
      xAxis: { type: 'category', data: ['国家级', '省级', '校级', '院级'] },
      yAxis: { type: 'value', name: '获奖人数' },
      series: [{
        type: 'bar',
        data: [d.national, d.provincial, d.school, d.college],
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
        },
        barWidth: '50%'
      }]
    })
    honorChart.resize()
  }

  // 2. 奖学金获得率 - 横向条形图
  if (scholarshipChart) {
    const data = growthData.value.scholarship
    const sorted = [...data].sort((a, b) => b.rate - a.rate)
    scholarshipChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>获得率：{c}%' },
      grid: { left: '20%', right: '8%', bottom: '8%', top: '8%' },
      xAxis: { type: 'value', max: 60, name: '获得率(%)' },
      yAxis: { type: 'category', data: sorted.map(d => d.college) },
      series: [{
        type: 'bar',
        data: sorted.map(d => d.rate),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        },
        barWidth: '50%',
        label: { show: true, position: 'right', formatter: '{c}%' }
      }]
    })
    scholarshipChart.resize()
  }

  // 3. 学生干部任职 - 饼图
  if (cadreChart) {
    const d = growthData.value.cadre
    cadreChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8 },
        label: { formatter: '{b}\n{c}人', fontSize: 12 },
        data: [
          { value: d.president, name: '主席/会长', itemStyle: { color: '#667eea' } },
          { value: d.minister, name: '部长', itemStyle: { color: '#764ba2' } },
          { value: d.monitor, name: '班长', itemStyle: { color: '#f093fb' } },
          { value: d.secretary, name: '团支书', itemStyle: { color: '#f5576c' } }
        ]
      }]
    })
    cadreChart.resize()
  }

  // 4. 入党情况 - 饼图
  if (partyChart) {
    const d = growthData.value.party
    partyChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8 },
        label: { formatter: '{b}\n{d}%', fontSize: 12 },
        data: [
          { value: d.partyMember, name: '中共党员', itemStyle: { color: '#e74c3c' } },
          { value: d.probationary, name: '预备党员', itemStyle: { color: '#f39c12' } },
          { value: d.activist, name: '入党积极分子', itemStyle: { color: '#3498db' } },
          { value: d.mass, name: '群众', itemStyle: { color: '#95a5a6' } }
        ]
      }]
    })
    partyChart.resize()
  }
}

onMounted(() => {
  loadData()
  nextTick(() => initCharts())
  window.addEventListener('resize', () => {
    [honorChart, scholarshipChart, cadreChart, partyChart].forEach(c => c?.resize())
  })
})

watch(selectedYear, onYearChange)
</script>

<style scoped>
.growth-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { color: #333; margin: 0; }
.filter-bar { display: flex; gap: 12px; }
.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.chart-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.chart-card :deep(.el-card__header) { display: flex; justify-content: space-between; align-items: center; border-bottom: none; padding-bottom: 0; }
.chart { height: 300px; width: 100%; }
@media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
</style>
