<!-- src/views/GrowthTrajectory.vue -->
<template>
  <div class="page-container fade-in-up">
    <DataStory :text="storyText" @regenerate="refreshStory" />
    <DanmakuLayer />

    <div class="page-header">
      <div class="title-wrap">
        <h1 class="page-title">成长轨迹</h1>
        <p class="page-subtitle">荣誉、奖学金、干部、入党多维成长数据</p>
      </div>
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

    <!-- 成长指数概览 -->
    <div class="growth-overview fade-in-up stagger-1">
      <div class="gauge-card">
        <div class="gauge-title">综合成长指数</div>
        <div ref="gaugeChartRef" class="gauge-chart"></div>
        <div class="gauge-subtitle">本届学生整体发展水平</div>
      </div>
      <div class="metrics-grid">
        <div class="metric-item" v-for="(m, i) in metrics" :key="i" :class="'stagger-' + (i+2)">
          <div class="metric-value" :style="{ color: m.color }">{{ m.value }}</div>
          <div class="metric-label">{{ m.label }}</div>
          <div class="metric-bar">
            <div class="metric-bar-fill" :style="{ width: m.percent + '%', background: m.color }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <el-card class="chart-card hover-lift fade-in-up stagger-1">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">荣誉奖项分布</span>
            <div class="chart-badge badge-indigo">按级别</div>
          </div>
        </template>
        <div ref="honorChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card hover-lift fade-in-up stagger-2">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">奖学金学院雷达</span>
            <div class="chart-badge badge-teal">多维对比</div>
          </div>
        </template>
        <div ref="scholarshipChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card hover-lift fade-in-up stagger-3">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">学生干部结构</span>
            <div class="chart-badge badge-amber">岗位层级</div>
          </div>
        </template>
        <div ref="cadreChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card hover-lift fade-in-up stagger-4">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">入党成长漏斗</span>
            <div class="chart-badge badge-rose">晋升路径</div>
          </div>
        </template>
        <div ref="partyChartRef" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getGrowthByYear, getGrowthYears } from '../api/growth'
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = ref([])
const selectedYear = ref(null)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const gaugeChartRef = ref(null)
const honorChartRef = ref(null)
const scholarshipChartRef = ref(null)
const cadreChartRef = ref(null)
const partyChartRef = ref(null)

let gaugeChart = null
let honorChart = null
let scholarshipChart = null
let cadreChart = null
let partyChart = null

const storyText = ref('')
const loading = ref(false)

const growthData = ref({
  honor: { national: 0, provincial: 0, school: 0, college: 0 },
  scholarship: [],
  cadre: { president: 0, minister: 0, monitor: 0, secretary: 0 },
  party: { partyMember: 0, probationary: 0, activist: 0, mass: 0 }
})

const hasHonorData = computed(() => {
  const h = growthData.value.honor
  return h.national > 0 || h.provincial > 0 || h.school > 0 || h.college > 0
})
const hasScholarshipData = computed(() => growthData.value.scholarship.length > 0)
const hasCadreData = computed(() => {
  const c = growthData.value.cadre
  return c.president > 0 || c.minister > 0 || c.monitor > 0 || c.secretary > 0
})
const hasPartyData = computed(() => {
  const p = growthData.value.party
  return p.partyMember > 0 || p.probationary > 0 || p.activist > 0 || p.mass > 0
})

// 计算指标卡数据
const metrics = computed(() => {
  const d = growthData.value
  const honorTotal = d.honor.national + d.honor.provincial + d.honor.school + d.honor.college
  const cadreTotal = d.cadre.president + d.cadre.minister + d.cadre.monitor + d.cadre.secretary
  const partyTotal = d.party.partyMember + d.party.probationary + d.party.activist + d.party.mass
  const partyAdvanced = partyTotal > 0 ? ((d.party.partyMember + d.party.probationary + d.party.activist) / partyTotal * 100) : 0

  // 从奖学金数据计算平均获得率
  let avgScholarship = 0
  if (d.scholarship.length > 0 && 'rate' in d.scholarship[0]) {
    avgScholarship = d.scholarship.reduce((s, item) => s + item.rate, 0) / d.scholarship.length
  } else if (d.scholarship.length >= 2) {
    const has = d.scholarship[0]?.value || 0
    const total = has + (d.scholarship[1]?.value || 0)
    avgScholarship = total > 0 ? (has / total * 100) : 0
  }

  return [
    { label: '荣誉奖项总数', value: honorTotal, percent: Math.min(100, honorTotal / 5), color: '#4f46e5' },
    { label: '奖学金获得率', value: avgScholarship.toFixed(1) + '%', percent: Math.min(100, avgScholarship * 2), color: '#0d9488' },
    { label: '学生干部人数', value: cadreTotal, percent: Math.min(100, cadreTotal / 3), color: '#d97706' },
    { label: '党员及积极分子占比', value: partyAdvanced.toFixed(1) + '%', percent: partyAdvanced, color: '#e11d48' }
  ]
})

// 综合成长指数（0-100）
const growthIndex = computed(() => {
  const m = metrics.value
  const avg = m.reduce((s, item) => s + item.percent, 0) / m.length
  return Math.round(Math.min(100, Math.max(0, avg)))
})

const loadData = async () => {
  if (!selectedYear.value) return
  loading.value = true
  try {
    const res = await getGrowthByYear(selectedYear.value)
    if (res.code === 200 && res.data) {
      const d = res.data
      const h = d.honorData || [0, 0, 0, 0]
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
        if ((item.name||'').includes('党员') && !(item.name||'').includes('预备')) p.partyMember += v
        else if ((item.name||'').includes('预备党员')) p.probationary += v
        else if ((item.name||'').includes('积极')) p.activist += v
        else p.mass += v
      })
      const s = []
      if (d.scholarshipData && d.scholarshipData.length > 0) {
        d.scholarshipData.forEach(item => {
          s.push({
            name: item.name || item.college || '',
            value: Number(item.value || item.count || item.rate || 0)
          })
        })
      }
      growthData.value = {
        honor: {
          national: h[2] || 0,
          provincial: h[1] || 0,
          school: h[0] || 0,
          college: h[3] || 0
        },
        scholarship: s,
        cadre: c,
        party: p
      }
    }
  } catch (e) {
    console.warn('成长轨迹API调用失败', e)
  }
  try { storyText.value = generateStory(growthData.value, 'growth') } catch (e) {}
  loading.value = false
  nextTick(() => updateCharts())
}

const refreshStory = () => {
  storyText.value = generateStory(growthData.value, 'growth')
}

const onYearChange = () => loadData()
const onCollegeChange = () => loadData()
const loadYears = async () => {
  try {
    const res = await getGrowthYears()
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
  if (gaugeChartRef.value) gaugeChart = echarts.init(gaugeChartRef.value)
  if (honorChartRef.value) honorChart = echarts.init(honorChartRef.value)
  if (scholarshipChartRef.value) scholarshipChart = echarts.init(scholarshipChartRef.value)
  if (cadreChartRef.value) cadreChart = echarts.init(cadreChartRef.value)
  if (partyChartRef.value) partyChart = echarts.init(partyChartRef.value)
  updateCharts()
}

const updateCharts = () => {
  updateGauge()
  updateHonorChart()
  updateScholarshipChart()
  updateCadreChart()
  updatePartyChart()
}

// 仪表盘
const updateGauge = () => {
  if (!gaugeChart) return
  const value = growthIndex.value
  gaugeChart.setOption({
    series: [{
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      splitNumber: 5,
      radius: '92%',
      center: ['50%', '62%'],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#4f46e5' },
          { offset: 0.5, color: '#0d9488' },
          { offset: 1, color: '#d97706' }
        ])
      },
      progress: { show: true, width: 14, roundCap: true },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 14, color: [[1, '#e2e8f0']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '-5%'],
        fontSize: 42,
        fontWeight: 700,
        formatter: '{value}',
        color: '#1e293b'
      },
      data: [{ value }]
    }]
  })
  gaugeChart.resize()
}

// 荣誉奖项 - 渐变柱状图
const updateHonorChart = () => {
  if (!honorChart) return
  const d = growthData.value.honor
  honorChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<strong>${p[0].name}</strong><br/>获奖：<strong>${p[0].value}</strong> 项` },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['国家级', '省级', '校级', '院级'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '获奖项数',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: [
        { value: d.national, itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#818cf8' }, { offset: 1, color: '#4f46e5' }]) } },
        { value: d.provincial, itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#2dd4bf' }, { offset: 1, color: '#0d9488' }]) } },
        { value: d.school, itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#fbbf24' }, { offset: 1, color: '#d97706' }]) } },
        { value: d.college, itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#fb7185' }, { offset: 1, color: '#e11d48' }]) } }
      ],
      barWidth: '45%',
      label: { show: true, position: 'top', color: '#475569', fontSize: 12, fontWeight: 600 }
    }]
  })
  honorChart.resize()
}

// 奖学金 - 雷达图
const updateScholarshipChart = () => {
  if (!scholarshipChart) return
  const data = growthData.value.scholarship
  const isCollegeData = data.length > 0 && 'rate' in data[0]

  if (isCollegeData && data.length >= 3) {
    const colleges = data.map(d => d.college)
    const rates = data.map(d => d.rate)
    const maxRate = Math.max(...rates) * 1.2

    scholarshipChart.setOption({
      tooltip: { trigger: 'item' },
      radar: {
        indicator: colleges.map(c => ({ name: c, max: maxRate })),
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#475569', fontSize: 11 },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        splitArea: { areaStyle: { color: ['rgba(79, 70, 229, 0.02)', 'rgba(79, 70, 229, 0.05)'] } },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: rates,
          name: '获得率(%)',
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: 'rgba(13, 148, 136, 0.1)' },
              { offset: 1, color: 'rgba(13, 148, 136, 0.3)' }
            ])
          },
          lineStyle: { color: '#0d9488', width: 2 },
          itemStyle: { color: '#0d9488' },
          symbol: 'circle',
          symbolSize: 6
        }]
      }]
    })
  } else {
    // 备用：用饼图
    scholarshipChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%', fontSize: 11 },
        data: data.slice(0, 2).map((item, i) => ({
          value: item.value || 0,
          name: item.name || '',
          itemStyle: { color: i === 0 ? '#4f46e5' : '#e2e8f0' }
        }))
      }]
    })
  }
  scholarshipChart.resize()
}

// 学生干部 - 堆叠横向柱状图
const updateCadreChart = () => {
  if (!cadreChart) return
  const d = growthData.value.cadre
  const total = d.president + d.minister + d.monitor + d.secretary

  cadreChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let str = `<strong>岗位层级</strong><br/>`
        params.forEach(p => {
          str += `${p.marker} ${p.seriesName}：<strong>${p.value}</strong> 人<br/>`
        })
        return str
      }
    },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '人数',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: ['学生干部结构'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }
    },
    legend: {
      bottom: 0,
      left: 'center',
      textStyle: { color: '#64748b', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [
      {
        name: '主席/会长',
        type: 'bar',
        stack: 'total',
        barWidth: 32,
        data: [d.president],
        itemStyle: { borderRadius: [0, 0, 0, 0], color: '#4f46e5' },
        label: { show: d.president > 0, position: 'inside', color: '#fff', fontSize: 11, fontWeight: 600, formatter: (p) => p.value > 0 ? p.value + '' : '' }
      },
      {
        name: '部长',
        type: 'bar',
        stack: 'total',
        data: [d.minister],
        itemStyle: { color: '#0d9488' },
        label: { show: d.minister > 0, position: 'inside', color: '#fff', fontSize: 11, fontWeight: 600, formatter: (p) => p.value > 0 ? p.value + '' : '' }
      },
      {
        name: '班长',
        type: 'bar',
        stack: 'total',
        data: [d.monitor],
        itemStyle: { color: '#d97706' },
        label: { show: d.monitor > 0, position: 'inside', color: '#fff', fontSize: 11, fontWeight: 600, formatter: (p) => p.value > 0 ? p.value + '' : '' }
      },
      {
        name: '团支书',
        type: 'bar',
        stack: 'total',
        data: [d.secretary],
        itemStyle: { borderRadius: [0, 6, 6, 0], color: '#e11d48' },
        label: { show: d.secretary > 0, position: 'inside', color: '#fff', fontSize: 11, fontWeight: 600, formatter: (p) => p.value > 0 ? p.value + '' : '' }
      }
    ]
  })
  cadreChart.resize()
}

// 入党 - 漏斗图
const updatePartyChart = () => {
  if (!partyChart) return
  const d = growthData.value.party
  const total = d.partyMember + d.probationary + d.activist + d.mass

  // 漏斗从大到小：群众 → 积极分子 → 预备党员 → 党员
  const funnelData = [
    { value: d.mass, name: '群众' },
    { value: d.activist, name: '入党积极分子' },
    { value: d.probationary, name: '预备党员' },
    { value: d.partyMember, name: '中共党员' }
  ].sort((a, b) => b.value - a.value)

  const colors = ['#e2e8f0', '#38bdf8', '#0d9488', '#4f46e5']

  partyChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p) => `<strong>${p.name}</strong><br/>人数：<strong>${p.value}</strong> 人<br/>占比：<strong>${p.percent}%</strong>`
    },
    legend: {
      bottom: 0,
      left: 'center',
      textStyle: { color: '#64748b', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 40,
      bottom: 60,
      width: '80%',
      min: 0,
      max: total,
      minSize: '30%',
      maxSize: '100%',
      sort: 'descending',
      gap: 3,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}\n{c}人',
        color: '#fff',
        fontSize: 11,
        fontWeight: 600
      },
      labelLine: { show: false },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 4
      },
      data: funnelData.map((item, i) => ({
        ...item,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  })
  partyChart.resize()
}

onMounted(async () => {
  await loadYears()
  await loadData()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ;[gaugeChart, honorChart, scholarshipChart, cadreChart, partyChart].forEach(c => c?.dispose())
})

const handleResize = () => {
  gaugeChart?.resize()
  honorChart?.resize()
  scholarshipChart?.resize()
  cadreChart?.resize()
  partyChart?.resize()
}

watch(selectedYear, onYearChange)
</script>

<style scoped>
.page-header .title-wrap {
  display: flex;
  flex-direction: column;
}

/* 成长指数概览 */
.growth-overview {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  margin-bottom: 28px;
}

.gauge-card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.gauge-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4f46e5 0%, #0d9488 50%, #d97706 100%);
}

.gauge-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 4px;
}

.gauge-chart {
  width: 100%;
  height: 180px;
}

.gauge-subtitle {
  font-size: 12px;
  color: var(--text-3);
  margin-top: -10px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metric-item {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
}

.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.metric-label {
  font-size: 13px;
  color: var(--text-2);
  font-weight: 500;
}

.metric-bar {
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s var(--ease-out);
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
  overflow: hidden;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
}

.chart-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.badge-indigo {
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}

.badge-teal {
  background: rgba(13, 148, 136, 0.1);
  color: #0d9488;
}

.badge-amber {
  background: rgba(217, 119, 6, 0.1);
  color: #d97706;
}

.badge-rose {
  background: rgba(225, 29, 72, 0.1);
  color: #e11d48;
}

.chart {
  height: 300px;
  width: 100%;
}

@media (max-width: 1024px) {
  .growth-overview {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
