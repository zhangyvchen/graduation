<template>
  <div class="destination-page">
    <DataStory :text="storyText" @regenerate="refreshStory" />
    <DanmakuLayer />

    <div class="page-header">
      <h2>🗺️ 去向地图</h2>
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
      <el-card class="chart-card full-width" :loading="loading">
        <template #header>
          <span>📍 就业省份热力图</span>
          <el-tag size="small" type="info">颜色越深 = 人数越多</el-tag>
        </template>
        <div v-if="mapLoaded" ref="heatmapChartRef" class="chart large"></div>
        <div v-else class="chart-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>地图加载中...</span>
        </div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>🏗️ 毕业去向城市 Top10</span>
          <el-tag size="small" type="info">按人数排名</el-tag>
        </template>
        <div ref="cityChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>📊 行业分布</span>
          <el-tag size="small" type="info">就业行业占比</el-tag>
        </template>
        <div ref="industryChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>🏢 入职公司 Top5</span>
          <el-tag size="small" type="info">入职公司排名</el-tag>
        </template>
        <div ref="companyTop5ChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>💰 薪资分布</span>
          <el-tag size="small" type="info">薪资范围占比</el-tag>
        </template>
        <div ref="salaryChartRef" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { Loading } from '@element-plus/icons-vue'
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

const MOCK_PROVINCES = [
  { name: '广东省', value: 385 }, { name: '浙江省', value: 268 }, { name: '江苏省', value: 245 },
  { name: '北京市', value: 212 }, { name: '上海市', value: 198 }, { name: '四川省', value: 156 },
  { name: '湖北省', value: 142 }, { name: '山东省', value: 138 }, { name: '福建省', value: 125 },
  { name: '湖南省', value: 112 }, { name: '河南省', value: 98 }, { name: '安徽省', value: 85 },
  { name: '重庆市', value: 78 }, { name: '陕西省', value: 72 }, { name: '河北省', value: 65 }
]
const MOCK_CITIES = [
  { name: '北京', count: 45 }, { name: '上海', count: 38 },
  { name: '深圳', count: 32 }, { name: '杭州', count: 28 },
  { name: '广州', count: 25 }, { name: '成都', count: 22 },
  { name: '南京', count: 20 }, { name: '武汉', count: 18 },
  { name: '西安', count: 15 }, { name: '长沙', count: 12 }
]
const MOCK_SALARY = [
  { name: '3000以下', value: 5 }, { name: '3000-5000', value: 12 },
  { name: '5000-8000', value: 28 }, { name: '8000-12000', value: 30 },
  { name: '12000-20000', value: 18 }, { name: '20000以上', value: 7 }
]
const MOCK_COMPANIES_TOP5 = [
  { name: '腾讯科技', count: 35 }, { name: '阿里巴巴', count: 30 },
  { name: '字节跳动', count: 26 }, { name: '华为技术', count: 22 },
  { name: '美团', count: 18 }
]
const MOCK_INDUSTRY = [
  { name: '互联网/IT', value: 28.5 }, { name: '教育/科研', value: 18.2 },
  { name: '金融/银行', value: 15.6 }, { name: '制造业', value: 12.3 },
  { name: '政府/事业单位', value: 10.8 }, { name: '医疗/健康', value: 7.5 },
  { name: '其他', value: 7.1 }
]

function isDataEmpty(heatmap, cities, industry, salaryDist, companies) {
  return heatmap.length === 0 && cities.length === 0 && industry.length === 0 && salaryDist.length === 0 && companies.length === 0
}

const normalizeProvinceName = (name) => {
  if (name === null || name === undefined) return name
  const trimmed = String(name).trim()
  if (!trimmed) return trimmed

  // 已有合法后缀的省份（数据库里直接存了全称），原样返回
  const suffixes = ['省', '市', '自治区', '特别行政区', '县', '旗']
  for (const suffix of suffixes) {
    if (trimmed.endsWith(suffix)) return trimmed
  }

  // 4 个直辖市
  if (trimmed === '北京' || trimmed === '天津' || trimmed === '上海' || trimmed === '重庆') {
    return trimmed + '市'
  }

  // 5 个自治区
  if (trimmed === '内蒙古') return '内蒙古自治区'
  if (trimmed === '广西') return '广西壮族自治区'
  if (trimmed === '西藏') return '西藏自治区'
  if (trimmed === '宁夏') return '宁夏回族自治区'
  if (trimmed === '新疆') return '新疆维吾尔自治区'

  // 2 个特别行政区
  if (trimmed === '香港' || trimmed === '港') return '香港特别行政区'
  if (trimmed === '澳门' || trimmed === '澳') return '澳门特别行政区'

  // 台湾
  if (trimmed === '台湾' || trimmed === '台') return '台湾省'

  // 其他省份统一加"省"
  return trimmed + '省'
}

const loadYears = async () => {
  try {
    const res = await getDestinationYears()
    console.log('年份列表API响应:', res)
    if (res.code === 200 && res.data && res.data.length > 0) {
      years.value = res.data
      selectedYear.value = res.data[0]
      console.log('✅ 从数据库获取年份列表:', res.data, '默认选中:', selectedYear.value)
    } else {
      throw new Error('无数据')
    }
  } catch (error) {
    console.warn('获取年份列表失败，使用默认年份', error)
    years.value = [2024, 2023, 2022, 2021]
    selectedYear.value = years.value[0]
  }
}

const loadData = async () => {
  if (!selectedYear.value) {
    console.warn('未选择年份，跳过数据加载')
    return
  }
  loading.value = true
  try {
    const year = selectedYear.value
    console.log('📊 开始加载数据，年份:', year)

    const provinceRes = await getProvinceStats(year)
    console.log('省份统计响应:', provinceRes)
    let heatmap = []
    if (provinceRes.code === 200 && provinceRes.data) {
      const pData = provinceRes.data
      ;(pData.provinces || []).forEach((name, i) => {
        const normalizedName = normalizeProvinceName(name)
        heatmap.push({ name: normalizedName, value: (pData.counts || [])[i] || 0 })
      })
    }
    console.log('📍 省份热力图数据:', heatmap)

    const rawRes = await getDestinationByYear(year)
    console.log('去向明细响应:', rawRes)

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
    console.log('城市数据:', cities)

    // Salary distribution
    let salaryDist = []
    if (rawRes.code === 200 && Array.isArray(rawRes.data)) {
      const buckets = { '　以下': 0, '3000-5000': 0, '5000-8000': 0, '8000-12000': 0, '12000-20000': 0, '以上': 0 }
      rawRes.data.forEach(item => {
        const s = item.salary
        if (s === null || s === undefined) return
        if (s < 3000) buckets['　以下']++
        else if (s < 5000) buckets['3000-5000']++
        else if (s < 8000) buckets['5000-8000']++
        else if (s < 12000) buckets['8000-12000']++
        else if (s < 20000) buckets['12000-20000']++
        else buckets['以上']++
      })
      const total = Object.values(buckets).reduce((a, b) => a + b, 0)
      if (total > 0) {
        salaryDist = Object.entries(buckets)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value: Math.round(value / total * 1000) / 10 }))
      }
    }
    console.log('薪资分布:', salaryDist)

    // 入职公司 Top5 for horizontal bar chart（按 company_name 分组）
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
    console.log('入职公司 Top5:', companies)

    const industryRes = await getIndustryStats(year)
    console.log('行业统计响应:', industryRes)
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
    console.log('📊 行业分布数据:', industry)

    if (isDataEmpty(heatmap, cities, industry, salaryDist, companies)) {
      console.log('去向地图数据库为空，使用模拟数据')
      heatmap = MOCK_PROVINCES
      cities = MOCK_CITIES
      industry = MOCK_INDUSTRY
      salaryDist = MOCK_SALARY
      companies = MOCK_COMPANIES_TOP5
    }

    destData.value = { heatmap, cities, industry, salaryDist, companies }
  } catch (e) {
    console.warn('API调用失败，使用模拟数据', e)
    destData.value = {
      heatmap: MOCK_PROVINCES,
      cities: MOCK_CITIES,
      industry: MOCK_INDUSTRY,
      salaryDist: MOCK_SALARY,
      companies: MOCK_COMPANIES_TOP5
    }
  }

  storyText.value = generateStory(destData.value, 'destination')
  loading.value = false

  await nextTick()
  updateCharts()
  updateSalaryChart()
  updateCompanyTop5()
}

const updateSalaryChart = () => {
  if (!salaryChart) return
  const data = destData.value.salaryDist
  if (data.length === 0) return
  const colors = ['#ff6b6b', '#ffa502', '#ffd43b', '#69db7c', '#339af0', '#845ef7']
  salaryChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6 },
      label: { formatter: '{b}\n{d}%', fontSize: 12 },
      data: data.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  }, true)
  salaryChart.resize()
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
    console.log('✅ 中国地图加载成功')
  } catch (e) {
    console.warn('中国地图加载失败，使用备用方案', e)
    mapLoaded.value = true
  }
}

const initCharts = () => {
  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
  }
  if (cityChartRef.value) {
    cityChart = echarts.init(cityChartRef.value)
  }
  if (industryChartRef.value) {
    industryChart = echarts.init(industryChartRef.value)
  }
  if (salaryChartRef.value) {
    salaryChart = echarts.init(salaryChartRef.value)
  }
  if (companyTop5ChartRef.value) {
    companyTop5Chart = echarts.init(companyTop5ChartRef.value)
  }
}

const updateCharts = () => {
  updateHeatmap()
  updateCities()
  updateIndustry()
}

const updateHeatmap = () => {
  if (!heatmapChart) return
  const data = destData.value.heatmap
  console.log('🔥 更新热力图，数据:', data)

  if (data.length === 0) {
    console.warn('⚠️ 热力图数据为空')
    return
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)

  if (mapLoaded.value && echarts.getMap('china')) {
    console.log('✅ 使用中国地图渲染热力图')

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
        text: ['高', '低'],
        calculable: true,
        inRange: { color: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#2e7d32'] }
      },
      series: [{
        name: '就业人数',
        type: 'map',
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [104, 35],
        data: data,
        label: {
          show: true,
          fontSize: 10,
          color: '#333'
        },
        itemStyle: {
          areaColor: '#e8ecf1',
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: { areaColor: '#667eea' },
          label: { color: '#fff', fontWeight: 'bold' }
        }
      }]
    }, true)
  } else {
    console.log('⚠️ 地图未加载，使用柱状图备用方案')
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 15)
    heatmapChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>就业人数：{c}人' },
      grid: { left: '15%', right: '8%', bottom: '12%', top: '8%' },
      xAxis: { type: 'category', data: sorted.map(d => d.name), axisLabel: { rotate: 45 } },
      yAxis: { type: 'value', name: '人数' },
      series: [{
        type: 'bar',
        data: sorted.map(d => d.value),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#43e97b' }
          ])
        },
        barWidth: '50%',
        label: { show: true, position: 'top', formatter: '{c}人' }
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
    tooltip: { trigger: 'axis', formatter: '{b}<br/>人数：{c}人' },
    grid: { left: '15%', right: '8%', bottom: '12%', top: '8%' },
    xAxis: { type: 'category', data: sorted.map(d => d.name), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      type: 'bar',
      data: sorted.map(d => d.count),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#43e97b' },
          { offset: 1, color: '#38f9d7' }
        ])
      },
      barWidth: '55%',
      label: { show: true, position: 'top', formatter: '{c}人' }
    }]
  }, true)
  cityChart.resize()
}

const updateCompanyTop5 = () => {
  if (!companyTop5Chart) return
  const data = destData.value.companies
  if (data.length === 0) return
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']
  companyTop5Chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>人数：{c}人' },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '人数',
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { color: '#333', fontSize: 13, fontWeight: 500 }
    },
    series: [{
      type: 'bar',
      barWidth: '55%',
      data: data.map((d, i) => ({
        value: d.count,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: colors[i % colors.length] },
            { offset: 1, color: colors[(i + 1) % colors.length] }
          ]),
          borderRadius: [0, 6, 6, 0]
        }
      })),
      label: { show: true, position: 'right', formatter: '{c}人', color: '#333', fontWeight: 600 }
    }]
  }, true)
  companyTop5Chart.resize()
}

const updateIndustry = () => {
  if (!industryChart) return
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a']
  industryChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8 },
      label: { formatter: '{b}\n{d}%', fontSize: 12 },
      data: destData.value.industry.map((d, i) => ({
        ...d,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  }, true)
  industryChart.resize()
}

const onYearChange = () => loadData()
const onCollegeChange = () => loadData()

onMounted(async () => {
  await loadChinaMap()
  await loadYears()

  if (mapLoaded.value) {
    initCharts()
    await loadData()
  } else {
    console.warn('⚠️ 地图加载失败，延迟初始化')
    setTimeout(async () => {
      initCharts()
      await loadData()
    }, 1000)
  }

  window.addEventListener('resize', () => {
    [heatmapChart, cityChart, industryChart, salaryChart, companyTop5Chart].forEach(c => c?.resize())
  })
})

watch(selectedYear, () => {
  if (selectedYear.value) {
    loadData()
  }
})
</script>

<style scoped>
.destination-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { color: #333; margin: 0; }
.filter-bar { display: flex; gap: 12px; }

.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.chart-card.full-width { grid-column: span 2; }
.chart-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.chart-card :deep(.el-card__header) { display: flex; justify-content: space-between; align-items: center; border-bottom: none; padding-bottom: 0; }

.chart { height: 320px; width: 100%; }
.chart.large { height: 420px; }

.chart-loading {
  height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #999;
  font-size: 14px;
}
.chart-loading .el-icon { font-size: 36px; color: #667eea; }

@media (max-width: 1024px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.full-width { grid-column: span 1; }
  .chart.large { height: 320px; }
}
</style>
