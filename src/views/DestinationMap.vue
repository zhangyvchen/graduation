<template>
  <div class="page-container fade-in-up">
    <DataStory :text="storyText" @regenerate="refreshStory" />
    <DanmakuLayer />

    <header class="page-header">
      <div class="page-header-left">
        <h2 class="page-title">去向地图</h2>
        <p class="page-subtitle">毕业生的城市、行业与薪资分布</p>
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
    </header>

    <!-- 就业概览指标 -->
    <div class="dest-overview fade-in-up stagger-1">
      <div class="overview-item" v-for="(item, i) in overviewStats" :key="i" :class="'stagger-' + (i+1)">
        <div class="overview-icon" :style="{ background: item.bg }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-value">{{ item.value }}</div>
          <div class="overview-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <!-- 热力图 - 全宽 -->
      <el-card class="chart-card full-width stagger-1" v-loading="loading">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">就业省份热力图</span>
            <span class="chart-tag tag-sky">地图</span>
          </div>
        </template>
        <div v-if="mapLoaded" ref="heatmapChartRef" class="chart large"></div>
        <div v-else class="chart-loading">
          <div class="map-spinner"></div>
          <span class="loading-text">正在加载地图数据...</span>
        </div>
      </el-card>

      <!-- 城市 Top10 -->
      <el-card class="chart-card stagger-2">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">热门城市 Top10</span>
            <span class="chart-tag tag-indigo">柱状图</span>
          </div>
        </template>
        <div ref="cityChartRef" class="chart"></div>
      </el-card>

      <!-- 行业分布 - 矩形树图 -->
      <el-card class="chart-card stagger-3">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">行业分布</span>
            <span class="chart-tag tag-teal">矩形树图</span>
          </div>
        </template>
        <div ref="industryChartRef" class="chart"></div>
      </el-card>

      <!-- 薪资分布 - 直方图 -->
      <el-card class="chart-card stagger-4">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">薪资分布</span>
            <span class="chart-tag tag-amber">直方图</span>
          </div>
        </template>
        <div ref="salaryChartRef" class="chart"></div>
      </el-card>

      <!-- 入职公司 Top5 -->
      <el-card class="chart-card stagger-5">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">入职公司 Top5</span>
            <span class="chart-tag tag-rose">条形图</span>
          </div>
        </template>
        <div ref="companyTop5ChartRef" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { Location, OfficeBuilding, Money, TrendCharts } from '@element-plus/icons-vue'
import { getDestinationByYear, getProvinceStats, getIndustryStats, getDestinationYears } from '../api/destination'
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = ref([])
const selectedYear = ref(null)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const heatmapChartRef = ref(null)
const cityChartRef = ref(null)
const industryChartRef = ref(null)
const salaryChartRef = ref(null)
const companyTop5ChartRef = ref(null)

let heatmapChart = null
let cityChart = null
let industryChart = null
let salaryChart = null
let companyTop5Chart = null
const mapLoaded = ref(false)

const storyText = ref('')
const loading = ref(false)
const destData = ref({ heatmap: [], cities: [], industry: [], salaryDist: [], companies: [] })

const overviewStats = computed(() => {
  const d = destData.value
  const topCity = d.cities.length > 0 ? d.cities[0] : { name: '-', count: 0 }
  const topIndustry = d.industry.length > 0 ? d.industry[0] : { name: '-', value: 0 }

  let avgSalary = '-'
  if (d.salaryDist.length > 0) {
    const sorted = [...d.salaryDist].sort((a, b) => b.value - a.value)
    avgSalary = sorted[0]?.name || '-'
  }

  return [
    { label: '覆盖省份', value: d.heatmap.length + '个', icon: Location, bg: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
    { label: '热门城市', value: topCity.name, icon: OfficeBuilding, bg: 'linear-gradient(135deg, #4f46e5, #818cf8)' },
    { label: '主流行业', value: topIndustry.name, icon: TrendCharts, bg: 'linear-gradient(135deg, #0d9488, #2dd4bf)' },
    { label: '薪资区间', value: avgSalary, icon: Money, bg: 'linear-gradient(135deg, #d97706, #f59e0b)' }
  ]
})

const hasProvinceData = computed(() => destData.value.heatmap.length > 0)
const hasCityData = computed(() => destData.value.cities.length > 0)
const hasIndustryData = computed(() => destData.value.industry.length > 0)
const hasSalaryData = computed(() => destData.value.salaryDist.length > 0)
const hasCompanyData = computed(() => destData.value.companies.length > 0)

const normalizeProvinceName = (name) => {
  if (name === null || name === undefined) return name
  const trimmed = String(name).trim()
  if (!trimmed) return trimmed

  const suffixes = ['省', '市', '自治区', '特别行政区', '县', '旗']
  for (const suffix of suffixes) {
    if (trimmed.endsWith(suffix)) return trimmed
  }

  if (trimmed === '北京' || trimmed === '天津' || trimmed === '上海' || trimmed === '重庆') {
    return trimmed + '市'
  }

  if (trimmed === '内蒙古') return '内蒙古自治区'
  if (trimmed === '广西') return '广西壮族自治区'
  if (trimmed === '西藏') return '西藏自治区'
  if (trimmed === '宁夏') return '宁夏回族自治区'
  if (trimmed === '新疆') return '新疆维吾尔自治区'

  if (trimmed === '香港' || trimmed === '港') return '香港特别行政区'
  if (trimmed === '澳门' || trimmed === '澳') return '澳门特别行政区'

  if (trimmed === '台湾' || trimmed === '台') return '台湾省'

  return trimmed + '省'
}

const loadYears = async () => {
  try {
    const res = await getDestinationYears()
    if (res.code === 200 && res.data && res.data.length > 0) {
      years.value = res.data
      selectedYear.value = res.data[0]
    }
  } catch (error) {
    console.warn('获取年份列表失败', error)
  }
}

const loadData = async () => {
  if (!selectedYear.value) return
  loading.value = true
  try {
    const year = selectedYear.value

    const provinceRes = await getProvinceStats(year)
    let heatmap = []
    if (provinceRes.code === 200 && provinceRes.data) {
      const pData = provinceRes.data
      ;(pData.provinces || []).forEach((name, i) => {
        const normalizedName = normalizeProvinceName(name)
        heatmap.push({ name: normalizedName, value: (pData.counts || [])[i] || 0 })
      })
    }

    const rawRes = await getDestinationByYear(year)

    // City Top10
    const cityMap = new Map()
    let cities = []
    if (rawRes.code === 200 && Array.isArray(rawRes.data)) {
      rawRes.data.forEach(item => {
        if (item.city) {
          cityMap.set(item.city, (cityMap.get(item.city) || 0) + 1)
        }
      })
    }
    if (cityMap.size > 0) {
      cities = Array.from(cityMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
    }

    // Salary distribution
    let salaryDist = []
    if (rawRes.code === 200 && Array.isArray(rawRes.data)) {
      const buckets = { '3K以下': 0, '3K-5K': 0, '5K-8K': 0, '8K-12K': 0, '12K-20K': 0, '20K以上': 0 }
      rawRes.data.forEach(item => {
        const s = item.salary
        if (s === null || s === undefined) return
        if (s < 3000) buckets['3K以下']++
        else if (s < 5000) buckets['3K-5K']++
        else if (s < 8000) buckets['5K-8K']++
        else if (s < 12000) buckets['8K-12K']++
        else if (s < 20000) buckets['12K-20K']++
        else buckets['20K以上']++
      })
      const total = Object.values(buckets).reduce((a, b) => a + b, 0)
      if (total > 0) {
        salaryDist = Object.entries(buckets)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value: Math.round(value / total * 1000) / 10 }))
      }
    }

    // 入职公司 Top5
    const companyMap = new Map()
    let companies = []
    if (rawRes.code === 200 && Array.isArray(rawRes.data)) {
      rawRes.data.forEach(item => {
        if (item.companyName) {
          companyMap.set(item.companyName, (companyMap.get(item.companyName) || 0) + 1)
        }
      })
    }
    if (companyMap.size > 0) {
      companies = Array.from(companyMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
    }

    const industryRes = await getIndustryStats(year)
    let industry = []
    if (industryRes.code === 200 && industryRes.data?.industryData) {
      const rawIndustry = industryRes.data.industryData
      const total = rawIndustry.reduce((sum, item) => sum + (item.value || 0), 0)
      if (total > 0) {
        industry = rawIndustry.map(item => ({
          name: item.name,
          value: Math.round((item.value / total) * 1000) / 10
        }))
      }
    }

    destData.value = { heatmap, cities, industry, salaryDist, companies }
  } catch (e) {
    console.warn('API调用失败', e)
    destData.value = { heatmap: [], cities: [], industry: [], salaryDist: [], companies: [] }
  }

  storyText.value = generateStory(destData.value, 'destination')
  loading.value = false

  await nextTick()
  updateCharts()
}

const refreshStory = () => {
  storyText.value = generateStory(destData.value, 'destination')
}

const loadChinaMap = async () => {
  try {
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    if (!response.ok) throw new Error('网络请求失败')
    const chinaMap = await response.json()
    echarts.registerMap('china', chinaMap)
    mapLoaded.value = true
  } catch (e) {
    console.warn('中国地图加载失败，使用备用方案', e)
    mapLoaded.value = true
  }
}

const initCharts = () => {
  if (heatmapChartRef.value) heatmapChart = echarts.init(heatmapChartRef.value)
  if (cityChartRef.value) cityChart = echarts.init(cityChartRef.value)
  if (industryChartRef.value) industryChart = echarts.init(industryChartRef.value)
  if (salaryChartRef.value) salaryChart = echarts.init(salaryChartRef.value)
  if (companyTop5ChartRef.value) companyTop5Chart = echarts.init(companyTop5ChartRef.value)
}

const updateCharts = () => {
  updateHeatmap()
  updateCities()
  updateIndustry()
  updateSalaryChart()
  updateCompanyTop5()
}

const updateHeatmap = () => {
  if (!heatmapChart) return
  const data = destData.value.heatmap
  if (data.length === 0) return

  const maxValue = Math.max(...data.map(d => d.value), 1)

  if (mapLoaded.value && echarts.getMap('china')) {
    heatmapChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.name) return `${params.name}<br/>就业人数：${params.value || 0}人`
          return ''
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        bottom: '20',
        text: ['多', '少'],
        calculable: true,
        textStyle: { color: '#64748b', fontSize: 11 },
        inRange: { color: ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1'] }
      },
      series: [{
        name: '就业人数',
        type: 'map',
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [104, 35],
        data: data,
        label: { show: true, fontSize: 10, color: '#334155' },
        itemStyle: { areaColor: '#e2e8f0', borderColor: '#fff', borderWidth: 1 },
        emphasis: {
          itemStyle: { areaColor: '#d97706' },
          label: { color: '#fff', fontWeight: 'bold' }
        }
      }]
    }, true)
  } else {
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 15)
    heatmapChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>就业人数：{c}人' },
      grid: { left: '10%', right: '6%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: sorted.map(d => d.name), axisLabel: { rotate: 35, color: '#64748b', fontSize: 11 } },
      yAxis: { type: 'value', name: '人数', nameTextStyle: { color: '#94a3b8', fontSize: 11 }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
      series: [{
        type: 'bar',
        data: sorted.map(d => d.value),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0284c7' },
            { offset: 1, color: '#38bdf8' }
          ])
        },
        barWidth: '50%',
        label: { show: true, position: 'top', color: '#475569', fontSize: 11, fontWeight: 600, formatter: '{c}' }
      }]
    }, true)
  }
  heatmapChart.resize()
}

const updateCities = () => {
  if (!cityChart) return
  const data = destData.value.cities
  if (data.length === 0) return
  const sorted = [...data].sort((a, b) => b.count - a.count)
  cityChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>人数：{c}人' },
    grid: { left: '8%', right: '8%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sorted.map(d => d.name),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11, rotate: 30 }
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
      data: sorted.map(d => d.count),
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4f46e5' },
          { offset: 1, color: '#818cf8' }
        ])
      },
      barWidth: '55%',
      label: { show: true, position: 'top', color: '#475569', fontSize: 11, fontWeight: 600, formatter: '{c}' }
    }]
  }, true)
  cityChart.resize()
}

// 行业分布 - 矩形树图
const updateIndustry = () => {
  if (!industryChart) return
  const data = destData.value.industry
  if (data.length === 0) return

  const colors = ['#4f46e5', '#0d9488', '#d97706', '#e11d48', '#0284c7', '#059669', '#8b5cf6', '#64748b']

  industryChart.setOption({
    tooltip: {
      formatter: (info) => {
        if (info.dataType === 'rect') {
          return `<strong>${info.name}</strong><br/>占比：<strong>${info.value}%</strong>`
        }
        return ''
      }
    },
    series: [{
      type: 'treemap',
      width: '94%',
      height: '88%',
      top: '6%',
      left: '3%',
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: {
        show: true,
        formatter: (p) => `${p.name}\n${p.value}%`,
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        align: 'center',
        verticalAlign: 'middle'
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 3,
        gapWidth: 3
      },
      data: data.map((item, i) => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  }, true)
  industryChart.resize()
}

// 薪资分布 - 直方图
const updateSalaryChart = () => {
  if (!salaryChart) return
  const data = destData.value.salaryDist
  if (data.length === 0) return

  const values = data.map(d => d.value)
  const labels = data.map(d => d.name)
  const maxVal = Math.max(...values) * 1.15

  // 找中位数区间
  let medianIndex = 0
  let cumulative = 0
  const total = values.reduce((a, b) => a + b, 0)
  for (let i = 0; i < values.length; i++) {
    cumulative += values[i]
    if (cumulative >= total / 2) {
      medianIndex = i
      break
    }
  }

  salaryChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (p) => `<strong>${p[0].name}</strong><br/>占比：<strong>${p[0].value}%</strong>`
    },
    grid: { left: '10%', right: '8%', bottom: '18%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 0, rotate: 20 }
    },
    yAxis: {
      type: 'value',
      name: '占比(%)',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      max: maxVal,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            borderRadius: i === medianIndex ? [6, 6, 0, 0] : [4, 4, 0, 0],
            color: i === medianIndex
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#d97706' },
                  { offset: 1, color: '#f59e0b' }
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#94a3b8' },
                  { offset: 1, color: '#cbd5e1' }
                ])
          }
        })),
        barWidth: '60%',
        label: { show: true, position: 'top', color: '#475569', fontSize: 11, fontWeight: 600, formatter: '{c}%' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#d97706', type: 'dashed', width: 2 },
          label: {
            formatter: '中位数区间',
            position: 'insideEndTop',
            color: '#d97706',
            fontSize: 11,
            fontWeight: 600
          },
          data: [{ xAxis: medianIndex }]
        }
      }
    ]
  }, true)
  salaryChart.resize()
}

const updateCompanyTop5 = () => {
  if (!companyTop5Chart) return
  const data = destData.value.companies
  if (data.length === 0) return
  const colors = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3']
  companyTop5Chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>人数：{c}人' },
    grid: { left: '3%', right: '10%', bottom: '5%', top: '8%', containLabel: true },
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
      data: data.map(d => d.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#334155', fontSize: 12, fontWeight: 500 }
    },
    series: [{
      type: 'bar',
      barWidth: '55%',
      data: data.map((d, i) => ({
        value: d.count,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: colors[i % colors.length] },
            { offset: 1, color: colors[(i + 1) % colors.length] }
          ]),
          borderRadius: [0, 6, 6, 0]
        }
      })).reverse(),
      label: { show: true, position: 'right', color: '#334155', fontSize: 12, fontWeight: 600, formatter: '{c}人' }
    }]
  }, true)
  companyTop5Chart.resize()
}

const onYearChange = () => loadData()
const onCollegeChange = () => loadData()

const handleResize = () => {
  heatmapChart?.resize()
  cityChart?.resize()
  industryChart?.resize()
  salaryChart?.resize()
  companyTop5Chart?.resize()
}

onMounted(async () => {
  await loadChinaMap()
  await loadYears()

  if (mapLoaded.value) {
    initCharts()
    await loadData()
  } else {
    setTimeout(async () => {
      initCharts()
      await loadData()
    }, 1000)
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ;[heatmapChart, cityChart, industryChart, salaryChart, companyTop5Chart].forEach(c => c?.dispose())
})

watch(selectedYear, () => {
  if (selectedYear.value) loadData()
})
</script>

<style scoped>
.page-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-3);
  margin: 0;
}

/* 就业概览 */
.dest-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.overview-item {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
}

.overview-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  flex-shrink: 0;
}

.overview-info {
  flex: 1;
  min-width: 0;
}

.overview-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.overview-label {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
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
  border: 1px solid var(--border-light);
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.chart-card.full-width {
  grid-column: span 2;
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

.tag-sky { background: rgba(2, 132, 199, 0.1); color: #0284c7; }
.tag-indigo { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
.tag-teal { background: rgba(13, 148, 136, 0.1); color: #0d9488; }
.tag-amber { background: rgba(217, 119, 6, 0.1); color: #d97706; }
.tag-rose { background: rgba(225, 29, 72, 0.1); color: #e11d48; }

.chart {
  height: 300px;
  width: 100%;
}

.chart.large {
  height: 420px;
}

.chart-loading {
  height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-3);
}

.map-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--surface-3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: mapSpin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: var(--text-2);
}

@keyframes mapSpin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .dest-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.full-width {
    grid-column: span 1;
  }

  .chart.large {
    height: 320px;
  }

  .chart-loading {
    height: 320px;
  }
}

@media (max-width: 600px) {
  .dest-overview {
    grid-template-columns: 1fr;
  }
}
</style>
