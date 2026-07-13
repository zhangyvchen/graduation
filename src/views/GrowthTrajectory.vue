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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getGrowthByYear, getGrowthYears } from '../api/growth'
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = ref([])
const selectedYear = ref(null)
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
const loading = ref(false)

const growthData = ref({
  honor: { national: 0, provincial: 0, school: 0, college: 0 },
  scholarship: [],
  cadre: { president: 0, minister: 0, monitor: 0, secretary: 0 },
  party: { partyMember: 0, probationary: 0, activist: 0, mass: 0 }
})

// 模拟数据（当数据库为空时使用）
const MOCK_DATA = {
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

// 检查数据是否为空（所有值都是0）
function isDataEmpty(d) {
  if (!d) return true
  const honorEmpty = !d.honorData || d.honorData.every(v => v === 0)
  const cadreEmpty = !d.cadreData || d.cadreData.length === 0
  const partyEmpty = !d.partyData || d.partyData.length === 0
  return honorEmpty && cadreEmpty && partyEmpty
}

const loadData = async () => {
  if (!selectedYear.value) return
  loading.value = true
  try {
    const res = await getGrowthByYear(selectedYear.value)
    if (res.code === 200 && res.data) {
      // 数据库有数据但实际内容为空？使用模拟数据
      if (isDataEmpty(res.data)) {
        growthData.value = { ...MOCK_DATA, scholarship: [...MOCK_DATA.scholarship] }
      } else {
        // 处理真实数据
        const d = res.data
        const h = d.honorData || [0, 0, 0]
        const c = { president: 0, minister: 0, monitor: 0, secretary: 0 }
        if (d.cadreData) d.cadreData.forEach(item => {
          const v = Number(item.value) || 0
          if ((item.name||'').includes('主席')||(item.name||'').includes('会长')) c.president += v
          else if ((item.name||'').includes('部长')) c.minister += v
          else if ((item.name||'').includes('班长')) c.monitor += v
          else if ((item.name||'').includes('团支书')) c.secretary += v
          else c.monitor += v
        })
        const p = { partyMember: 0, probationary: 0, activist: 0, mass: 0 }
        if (d.partyData) d.partyData.forEach(item => {
          const v = Number(item.value) || 0
          if ((item.name||'').includes('党员')) p.partyMember += v
          else if ((item.name||'').includes('预备党员')) p.probationary += v
          else if ((item.name||'').includes('积极')) p.activist += v
          else p.mass += v
        })
        // 奖学金数据：后端返回 [{name:"获得",value:X},{name:"未获得",value:Y}]
        // 转换为饼图/进度条数据格式，而不是学院对比
        const s = []
        if (d.scholarshipData && d.scholarshipData.length >= 2) {
          const has = Number(d.scholarshipData[0].value) || 0
          const total = has + (Number(d.scholarshipData[1].value) || 0)
          if (total > 0) {
            s.push({ name: '获得奖学金', value: has })
            s.push({ name: '未获得', value: total - has })
          }
          // 当有真实奖学金数据时，保留学院模拟数据作参考
          if (has > 0) {
            s.push(...MOCK_DATA.scholarship)
          }
        }
        // 如果奖学金数据为空则用模拟数据填充
        if (s.length === 0) {
          s.push(...MOCK_DATA.scholarship)
        }
        growthData.value = {
          honor: { national: h[2]||0, provincial: h[1]||0, school: h[0]||0, college: 0 },
          scholarship: s,
          cadre: c,
          party: p
        }
      }
    } else {
      growthData.value = { ...MOCK_DATA, scholarship: [...MOCK_DATA.scholarship] }
    }
  } catch (e) {
    console.warn('成长轨迹API调用失败，使用模拟数据', e)
    growthData.value = { ...MOCK_DATA, scholarship: [...MOCK_DATA.scholarship] }
  }
  try { storyText.value = generateStory(growthData.value, 'growth') } catch (e) {}
  loading.value = false
  nextTick(() => updateCharts())
 }

// 刷新故事
const refreshStory = () => {
  storyText.value = generateStory(growthData.value, 'growth')
}

const onYearChange = () => loadData()
const onCollegeChange = () => loadData()
const loadYears = async () => {
  try {
    const res = await getGrowthYears()
    console.log('成长轨迹年份接口返回:', res)
    if (res.code === 200 && res.data && res.data.length > 0) {
      years.value = res.data
      if (!selectedYear.value) {
        selectedYear.value = years.value[0]
      }
    } else {
      throw new Error('无数据')
    }
  } catch (error) {
    console.error('获取成长轨迹年份列表失败:', error)
    years.value = [2025, 2024, 2023, 2022]
    if (!selectedYear.value) {
      selectedYear.value = years.value[0]
    }
  }
}

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
    // 判断数据格式：有rate字段的是学院对比数据，有name/value字段的是分布数据
    const isCollegeData = data.length > 0 && 'rate' in data[0]
    if (isCollegeData) {
      // 学院对比数据
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
    } else {
      // 奖学金分布数据（饼图）
      scholarshipChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
        legend: { orient: 'vertical', right: '5%', top: 'center' },
        series: [{
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8 },
          label: { formatter: '{b}\n{c}人', fontSize: 12 },
          data: data.map((item, i) => ({
            value: item.value || item.rate || 0,
            name: item.name || item.college || '',
            itemStyle: { color: ['#667eea', '#43e97b', '#764ba2', '#f093fb', '#f5576c'][i % 5] }
          }))
        }]
      })
    }
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

onMounted(async () => {
  await loadYears()
  await loadData()
  initCharts()
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
