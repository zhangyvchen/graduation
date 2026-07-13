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
          <span>🏫 升学院校 Top20</span>
          <el-tag size="small" type="info">按人数排名</el-tag>
        </template>
        <div ref="schoolChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <span>📊 行业分布</span>
          <el-tag size="small" type="info">就业行业占比</el-tag>
        </template>
        <div ref="industryChartRef" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>📈 历年趋势</span>
        </template>
        <div ref="trendChartRef" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { Loading } from '@element-plus/icons-vue'
import { getDestinationByYear, getProvinceStats, getIndustryStats, getDestinationYears, getYearStats } from '../api/destination'
import DataStory from '../components/DataStory.vue'
import DanmakuLayer from '../components/DanmakuLayer.vue'
import { generateStory } from '../utils/storyGenerator'

const years = ref([])
const selectedYear = ref(null)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const heatmapChartRef = ref(null)
const schoolChartRef = ref(null)
const industryChartRef = ref(null)
const trendChartRef = ref(null)

let heatmapChart = null
let schoolChart = null
let industryChart = null
let trendChart = null
const mapLoaded = ref(false)

const storyText = ref('')
const loading = ref(false)
const destData = ref({ heatmap: [], schools: [], industry: [] })

const MOCK_PROVINCES = [
  { name: '广东省', value: 385 }, { name: '浙江省', value: 268 }, { name: '江苏省', value: 245 },
  { name: '北京市', value: 212 }, { name: '上海市', value: 198 }, { name: '四川省', value: 156 },
  { name: '湖北省', value: 142 }, { name: '山东省', value: 138 }, { name: '福建省', value: 125 },
  { name: '湖南省', value: 112 }, { name: '河南省', value: 98 }, { name: '安徽省', value: 85 },
  { name: '重庆市', value: 78 }, { name: '陕西省', value: 72 }, { name: '河北省', value: 65 }
]
const MOCK_SCHOOLS = [
  { name: '北京大学', count: 28 }, { name: '清华大学', count: 25 },
  { name: '浙江大学', count: 22 }, { name: '上海交通大学', count: 20 },
  { name: '复旦大学', count: 18 }, { name: '南京大学', count: 16 },
  { name: '华中科技大学', count: 15 }, { name: '武汉大学', count: 14 },
  { name: '中山大学', count: 13 }, { name: '西安交通大学', count: 12 },
  { name: '哈尔滨工业大学', count: 11 }, { name: '北京航空航天大学', count: 10 },
  { name: '同济大学', count: 9 }, { name: '南开大学', count: 8 },
  { name: '天津大学', count: 7 }, { name: '厦门大学', count: 6 },
  { name: '东南大学', count: 5 }, { name: '华南理工大学', count: 5 },
  { name: '大连理工大学', count: 4 }, { name: '电子科技大学', count: 4 }
]
const MOCK_INDUSTRY = [
  { name: '互联网/IT', value: 28.5 }, { name: '教育/科研', value: 18.2 },
  { name: '金融/银行', value: 15.6 }, { name: '制造业', value: 12.3 },
  { name: '政府/事业单位', value: 10.8 }, { name: '医疗/健康', value: 7.5 },
  { name: '其他', value: 7.1 }
]

function isDataEmpty(heatmap, schools, industry) {
  return heatmap.length === 0 && schools.length === 0 && industry.length === 0
}

const normalizeProvinceName = (name) => {
  if (!name) return name
  const suffixes = ['省', '市', '自治区', '特别行政区']
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) return name
  }
  if (name === '内蒙古') return '内蒙古自治区'
  if (name === '广西') return '广西壮族自治区'
  if (name === '西藏') return '西藏自治区'
  if (name === '宁夏') return '宁夏回族自治区'
  if (name === '新疆') return '新疆维吾尔自治区'
  return name + '省'
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
    const schoolMap = new Map()
    let schools = []
    if (rawRes.code === 200 && Array.isArray(rawRes.data)) {
      rawRes.data.forEach(item => {
        if (item.schoolName) {
          schoolMap.set(item.schoolName, (schoolMap.get(item.schoolName) || 0) + 1)
        }
      })
    }
    if (schoolMap.size > 0) {
      schools = Array.from(schoolMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
    }
    console.log(' 升学院校数据:', schools)

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

    if (isDataEmpty(heatmap, schools, industry)) {
      console.log('去向地图数据库为空，使用模拟数据')
      heatmap = MOCK_PROVINCES
      schools = MOCK_SCHOOLS
      industry = MOCK_INDUSTRY
    }

    destData.value = { heatmap, schools, industry }
  } catch (e) {
    console.warn('API调用失败，使用模拟数据', e)
    destData.value = {
      heatmap: MOCK_PROVINCES,
      schools: MOCK_SCHOOLS,
      industry: MOCK_INDUSTRY
    }
  }

  storyText.value = generateStory(destData.value, 'destination')
  loading.value = false

  await nextTick()
  updateCharts()
  loadTrendChart()
}

const loadTrendChart = async () => {
  try {
    const res = await getYearStats()
    console.log('历年趋势数据:', res)
    if (res.code === 200 && res.data) {
      const { years: yearList, counts } = res.data
      if (trendChart && yearList && yearList.length > 0) {
        trendChart.setOption({
          tooltip: { trigger: 'axis' },
          grid: { left: '12%', right: '8%', bottom: '12%', top: '8%' },
          xAxis: { type: 'category', data: yearList.map(y => y + '届') },
          yAxis: { type: 'value', name: '人数' },
          series: [{
            type: 'line',
            data: counts,
            smooth: true,
            itemStyle: { color: '#667eea' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(102,126,234,0.4)' },
                { offset: 1, color: 'rgba(102,126,234,0.05)' }
              ])
            }
          }]
        })
        trendChart.resize()
      }
    }
  } catch (e) {
    console.warn('加载趋势数据失败', e)
  }
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
  if (schoolChartRef.value) {
    schoolChart = echarts.init(schoolChartRef.value)
  }
  if (industryChartRef.value) {
    industryChart = echarts.init(industryChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
}

const updateCharts = () => {
  updateHeatmap()
  updateSchools()
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

const updateSchools = () => {
  if (!schoolChart) return
  const data = destData.value.schools.slice(0, 20)
  const sorted = [...data].sort((a, b) => b.count - a.count)
  schoolChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>录取人数：{c}人' },
    grid: { left: '25%', right: '8%', bottom: '8%', top: '8%' },
    xAxis: { type: 'value', name: '人数' },
    yAxis: { type: 'category', data: sorted.map(d => d.name) },
    series: [{
      type: 'bar',
      data: sorted.map(d => d.count),
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#f093fb' }
        ])
      },
      barWidth: '55%',
      label: { show: true, position: 'right', formatter: '{c}人' }
    }]
  }, true)
  schoolChart.resize()
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
    [heatmapChart, schoolChart, industryChart, trendChart].forEach(c => c?.resize())
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
