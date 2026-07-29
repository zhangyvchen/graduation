<template>
  <div class="page-container fade-in-up">
    <DataStory :text="storyText" @regenerate="refreshStory" />
    <DanmakuLayer />

    <div class="page-header">
      <div class="title-group">
        <h2 class="page-title">学习画像</h2>
        <div class="page-subtitle">学业表现与综合素质画像</div>
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

    <!-- 学习力雷达 + 核心指标 -->
    <div class="learning-hero fade-in-up stagger-1">
      <div class="radar-card">
        <div class="radar-header">
          <span class="radar-title">学习力雷达</span>
          <span class="radar-subtitle">五维学业画像</span>
        </div>
        <div ref="radarChartRef" class="radar-chart"></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card stat-1" v-for="(stat, i) in statCards" :key="i" :class="'stagger-' + (i+2)">
          <div class="stat-icon-wrap">
            <el-icon class="stat-icon"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            <el-icon><CaretTop v-if="stat.trend > 0" /><CaretBottom v-else /></el-icon>
            {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <el-card class="chart-card hover-lift fade-in-up stagger-1" v-loading="loading">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">GPA分布曲线</span>
            <span class="chart-tag tag-indigo">面积图</span>
          </div>
        </template>
        <div ref="gpaChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card hover-lift fade-in-up stagger-2" v-loading="loading">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">图书馆借阅分布</span>
            <span class="chart-tag tag-teal">柱状图</span>
          </div>
        </template>
        <div ref="libraryChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card hover-lift fade-in-up stagger-3">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">实验室参与对比</span>
            <span class="chart-tag tag-emerald">双向条形图</span>
          </div>
        </template>
        <div ref="labChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card hover-lift fade-in-up stagger-4">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">竞赛获奖层级</span>
            <span class="chart-tag tag-amber">金字塔</span>
          </div>
        </template>
        <div ref="competitionChart" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { TrendCharts, Collection, School, Trophy, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { getLearningByYear, getLearningYears } from '../api/learning'
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const radarChartRef = ref(null)
const gpaChart = ref(null)
const libraryChart = ref(null)
const labChart = ref(null)
const competitionChart = ref(null)

let radarInstance = null
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
  labData: [],
  competitionData: [],
  competitionTotal: 0
})

const statCards = computed(() => [
  { label: '平均绩点', value: stats.value.averageGpa || 0, icon: TrendCharts, trend: 0, color: '#4f46e5' },
  { label: '人均借阅', value: (stats.value.avgBorrow || 0) + '本', icon: Collection, trend: 0, color: '#0d9488' },
  { label: '实验室参与率', value: (stats.value.labParticipation || 0) + '%', icon: School, trend: 0, color: '#059669' },
  { label: '竞赛获奖数', value: stats.value.competitionCount || 0, icon: Trophy, trend: 0, color: '#d97706' }
])

const refreshStory = () => {
  // 将 statsData 转换为 storyGenerator 期望的格式
  const formatted = {
    gpa: (statsData.value.gpaData || []).map((v, i) => ({
      range: ['<2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0'][i] || '',
      count: v
    })),
    library: (statsData.value.libraryData || []).map((v, i) => ({
      range: ['0-10本', '11-20本', '21-30本', '>30本'][i] || '',
      count: v
    })),
    lab: statsData.value.labData || [],
    competition: {
      international: 0,
      national: 0,
      provincial: 0,
      school: statsData.value.competitionTotal || 0
    }
  }
  storyText.value = generateStory(formatted, 'learning')
}

const onYearChange = () => refreshData()
const onCollegeChange = () => refreshData()

const loadYears = async () => {
  try {
    const res = await getLearningYears()
    if (res.code === 200 && res.data && res.data.length > 0) {
      years.value = res.data
      if (!selectedYear.value) {
        selectedYear.value = years.value[0]
      }
    } else {
      throw new Error('无数据')
    }
  } catch (error) {
    console.error('获取学习画像年份列表失败:', error)
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
    refreshStory()
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  renderRadarChart()
  renderGpaChart()
  renderLibraryChart()
  renderLabChart()
  renderCompetitionChart()
}

// 学习力雷达图
const renderRadarChart = () => {
  if (!radarChartRef.value) return
  if (!radarInstance) radarInstance = echarts.init(radarChartRef.value)

  const d = statsData.value
  const gpaData = d.gpaData || []
  const libData = d.libraryData || []
  const labData = d.labData || []

  // 计算各维度得分（0-100）
  const gpaScore = gpaData.length > 0
    ? Math.round(gpaData.filter((_, i) => i >= 2).reduce((s, v) => s + v, 0) / gpaData.reduce((s, v) => s + v, 0) * 100)
    : 0

  const libScore = libData.length > 0
    ? Math.round(libData.filter((_, i) => i >= 1).reduce((s, v) => s + v, 0) / libData.reduce((s, v) => s + v, 0) * 100)
    : 0

  let labScore = 0
  if (labData.length >= 2) {
    const total = labData.reduce((s, item) => s + (item.value || 0), 0)
    const participated = labData.find(item => (item.name || '').includes('参与'))?.value || 0
    labScore = total > 0 ? Math.round(participated / total * 100) : 0
  }

  const compScore = stats.value.competitionCount > 0 ? Math.min(100, Math.round(stats.value.competitionCount / 2)) : 0
  const readScore = libData.length > 0 ? Math.round(libData[libData.length - 1] / libData.reduce((s, v) => s + v, 0) * 100 + 30) : 0

  radarInstance.setOption({
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [
        { name: '学业成绩', max: 100 },
        { name: '阅读广度', max: 100 },
        { name: '科研实践', max: 100 },
        { name: '竞赛能力', max: 100 },
        { name: '深度阅读', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#475569', fontSize: 12, fontWeight: 500 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(79, 70, 229, 0.02)', 'rgba(79, 70, 229, 0.04)', 'rgba(79, 70, 229, 0.06)', 'rgba(79, 70, 229, 0.08)']
        }
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [gpaScore, libScore, labScore, compScore, readScore],
        name: '学习力指数',
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
            { offset: 0, color: 'rgba(79, 70, 229, 0.15)' },
            { offset: 1, color: 'rgba(13, 148, 136, 0.25)' }
          ])
        },
        lineStyle: {
          width: 2,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#4f46e5' },
            { offset: 1, color: '#0d9488' }
          ])
        },
        itemStyle: { color: '#4f46e5' },
        symbol: 'circle',
        symbolSize: 8
      }]
    }]
  })
  radarInstance.resize()
}

const renderGpaChart = () => {
  if (!gpaChart.value) return
  if (!gpaInstance) gpaInstance = echarts.init(gpaChart.value)

  const data = statsData.value.gpaData || []
  const labels = ['<2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0']

  if (data.length === 0) {
    gpaInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { fontSize: 16, color: '#94a3b8' } },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [0, 0, 0, 0, 0] }]
    })
    return
  }

  gpaInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: '#4f46e5', type: 'dashed' } }, formatter: (p) => `<strong>${p[0].name}</strong><br/>人数：<strong>${p[0].value}</strong>` },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [{
      type: 'line',
      data: data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      lineStyle: {
        width: 3,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#4f46e5' },
          { offset: 1, color: '#818cf8' }
        ])
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(79, 70, 229, 0.25)' },
          { offset: 0.5, color: 'rgba(79, 70, 229, 0.1)' },
          { offset: 1, color: 'rgba(79, 70, 229, 0.02)' }
        ])
      },
      itemStyle: { color: '#4f46e5', borderColor: '#fff', borderWidth: 2 },
      label: { show: true, position: 'top', color: '#475569', fontSize: 11, fontWeight: 600, formatter: '{c}人' }
    }]
  }, true)
  gpaInstance.resize()
}

const renderLibraryChart = () => {
  if (!libraryChart.value) return
  if (!libraryInstance) libraryInstance = echarts.init(libraryChart.value)

  const data = statsData.value.libraryData || []
  const labels = ['0-10本', '11-20本', '21-30本', '>30本']

  if (data.length === 0) {
    libraryInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { fontSize: 16, color: '#94a3b8' } },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [0, 0, 0, 0] }]
    })
    return
  }

  libraryInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<strong>${p[0].name}</strong><br/>人数：<strong>${p[0].value}</strong>` },
    grid: { left: '8%', right: '6%', bottom: '8%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: true,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 12, interval: 0 }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: data.map((v, i) => ({
        value: v,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: ['#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'][i] || '#0d9488' },
            { offset: 1, color: ['#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6'][i] || '#2dd4bf' }
          ])
        }
      })),
      barWidth: '50%',
      label: { show: true, position: 'top', color: '#475569', fontSize: 11, fontWeight: 600, formatter: '{c}人' }
    }]
  }, true)
  libraryInstance.resize()
}

const renderLabChart = () => {
  if (!labChart.value) return
  if (!labInstance) labInstance = echarts.init(labChart.value)

  const data = statsData.value.labData || []

  if (data.length === 0) {
    labInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { fontSize: 16, color: '#94a3b8' } },
      series: [{ type: 'pie', radius: ['70%', '80%'], silent: true, data: [{ value: 1, name: '', itemStyle: { color: '#e2e8f0' } }] }]
    })
    return
  }

  // 用双向条形图展示参与/未参与对比
  const participated = data.find(item => (item.name || '').includes('参与'))?.value || 0
  const notParticipated = data.find(item => !(item.name || '').includes('参与'))?.value || 0
  const total = participated + notParticipated
  const participatedPercent = total > 0 ? Math.round(participated / total * 100) : 0
  const notPercent = 100 - participatedPercent

  labInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        const val = Math.abs(p.value)
        return `<strong>${p.seriesName}</strong><br/>${val} 人 (${p.seriesName.includes('参与') && !p.seriesName.includes('未') ? participatedPercent : notPercent}%)`
      }
    },
    grid: { left: '15%', right: '15%', bottom: '15%', top: '18%', containLabel: true },
    xAxis: {
      type: 'value',
      max: Math.max(participated, notParticipated) * 1.15,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: ['实验室参与情况'],
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
        name: '已参与',
        type: 'bar',
        stack: 'total',
        barWidth: 40,
        data: [participated],
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#10b981' },
            { offset: 1, color: '#34d399' }
          ])
        },
        label: {
          show: participated > 0,
          position: 'right',
          color: '#059669',
          fontSize: 12,
          fontWeight: 600,
          formatter: `{b|${participated}人}\n{a|${participatedPercent}%}`,
          rich: {
            b: { color: '#059669', fontSize: 13, fontWeight: 700, lineHeight: 18 },
            a: { color: '#64748b', fontSize: 11, lineHeight: 16 }
          }
        }
      },
      {
        name: '未参与',
        type: 'bar',
        stack: 'total',
        data: [-notParticipated],
        itemStyle: {
          borderRadius: [8, 0, 0, 8],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#e2e8f0' },
            { offset: 1, color: '#cbd5e1' }
          ])
        },
        label: {
          show: notParticipated > 0,
          position: 'left',
          color: '#64748b',
          fontSize: 12,
          fontWeight: 600,
          formatter: `{b|${notParticipated}人}\n{a|${notPercent}%}`,
          rich: {
            b: { color: '#64748b', fontSize: 13, fontWeight: 700, lineHeight: 18 },
            a: { color: '#94a3b8', fontSize: 11, lineHeight: 16 }
          }
        }
      }
    ]
  }, true)
  labInstance.resize()
}

const renderCompetitionChart = () => {
  if (!competitionChart.value) return
  if (!competitionInstance) competitionInstance = echarts.init(competitionChart.value)

  const compData = statsData.value.competitionData || []
  const total = statsData.value.competitionTotal || 0

  if (compData.length > 0) {
    // 金字塔图（漏斗图倒序展示层级）
    const sorted = [...compData].sort((a, b) => (b.value || 0) - (a.value || 0))
    const colors = ['#4f46e5', '#7c3aed', '#d97706', '#0d9488', '#e11d48']

    competitionInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: {
        bottom: 0,
        left: 'center',
        textStyle: { color: '#64748b', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12
      },
      series: [{
        type: 'funnel',
        left: '15%',
        top: 30,
        bottom: 60,
        width: '70%',
        minSize: '35%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
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
        data: sorted.map((item, i) => ({
          value: item.value || 0,
          name: item.name || '',
          itemStyle: { color: colors[i % colors.length] }
        }))
      }]
    }, true)
  } else {
    // 用环形进度展示总数
    competitionInstance.setOption({
      series: [{
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: Math.max(total * 2, 100),
        radius: '75%',
        center: ['50%', '50%'],
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          width: 24,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#d97706' },
              { offset: 1, color: '#f59e0b' }
            ])
          }
        },
        axisLine: { lineStyle: { width: 24, color: [[1, '#f1f5f9']] } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, 0],
          fontSize: 32,
          fontWeight: 700,
          formatter: '{total|' + total + '}\n{sub|总获奖人次}',
          rich: {
            total: { fontSize: 32, fontWeight: 700, color: '#1e293b', lineHeight: 40 },
            sub: { fontSize: 12, color: '#94a3b8', fontWeight: 400, lineHeight: 20 }
          }
        },
        data: [{ value: total }]
      }]
    }, true)
  }
  competitionInstance.resize()
}

const handleResize = () => {
  radarInstance?.resize()
  gpaInstance?.resize()
  libraryInstance?.resize()
  labInstance?.resize()
  competitionInstance?.resize()
}

onMounted(async () => {
  await loadYears()
  await refreshData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ;[radarInstance, gpaInstance, libraryInstance, labInstance, competitionInstance].forEach(c => c?.dispose())
})
</script>

<style scoped>
.title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 学习力 Hero 区 */
.learning-hero {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  margin-bottom: 28px;
}

.radar-card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
}

.radar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4f46e5 0%, #0d9488 100%);
}

.radar-header {
  margin-bottom: 8px;
}

.radar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
  display: block;
}

.radar-subtitle {
  font-size: 12px;
  color: var(--text-3);
}

.radar-chart {
  width: 100%;
  height: 260px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-1 .stat-icon-wrap {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(79, 70, 229, 0.08) 100%);
  color: #4f46e5;
}

.stat-card:nth-child(2) .stat-icon-wrap {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.15) 0%, rgba(13, 148, 136, 0.08) 100%);
  color: #0d9488;
}

.stat-card:nth-child(3) .stat-icon-wrap {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%);
  color: #059669;
}

.stat-card:nth-child(4) .stat-icon-wrap {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%);
  color: #d97706;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  position: absolute;
  top: 16px;
  right: 16px;
}

.stat-trend.up {
  color: #059669;
}

.stat-trend.down {
  color: #e11d48;
}

.stat-trend .el-icon {
  font-size: 12px;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-card {
  overflow: hidden;
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

.chart-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.tag-indigo {
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}

.tag-teal {
  background: rgba(13, 148, 136, 0.1);
  color: #0d9488;
}

.tag-emerald {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.tag-amber {
  background: rgba(217, 119, 6, 0.1);
  color: #d97706;
}

.chart {
  height: 300px;
  width: 100%;
}

@media (max-width: 1024px) {
  .learning-hero {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
