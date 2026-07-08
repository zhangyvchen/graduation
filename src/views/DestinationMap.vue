<template>
  <div class="destination-page">
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
      <el-card class="chart-card full-width">
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { Loading } from '@element-plus/icons-vue'
import { getDestinationByYear } from '../api/destination'

const years = [2024, 2023, 2022, 2021]
const selectedYear = ref(2024)
const selectedCollege = ref('')
const colleges = ref(['软件工程学院', '计算机科学学院', '信息管理学院', '人工智能学院', '网络工程学院'])

const heatmapChartRef = ref(null)
const schoolChartRef = ref(null)
const industryChartRef = ref(null)

let heatmapChart = null
let schoolChart = null
let industryChart = null
const mapLoaded = ref(false)

const destData = ref({
  heatmap: [],
  schools: [],
  industry: []
})

// ===== 数据加载 =====
const loadData = async () => {
  try {
    const res = await getDestinationByYear(selectedYear.value)
    if (res.code === 200 && res.data) {
      destData.value = res.data
    } else {
      // 模拟数据
      destData.value = {
        heatmap: [
          { name: '北京市', value: 180 }, { name: '上海市', value: 160 },
          { name: '广东省', value: 320 }, { name: '浙江省', value: 210 },
          { name: '江苏省', value: 195 }, { name: '四川省', value: 145 },
          { name: '湖北省', value: 130 }, { name: '湖南省', value: 95 },
          { name: '福建省', value: 85 }, { name: '山东省', value: 75 },
          { name: '河南省', value: 65 }, { name: '河北省', value: 55 },
          { name: '安徽省', value: 50 }, { name: '辽宁省', value: 45 },
          { name: '陕西省', value: 40 }, { name: '重庆市', value: 38 },
          { name: '天津市', value: 35 }, { name: '云南省', value: 30 },
          { name: '贵州省', value: 25 }, { name: '广西壮族自治区', value: 22 }
        ],
        schools: [
          { name: '清华大学', count: 18 }, { name: '北京大学', count: 15 },
          { name: '浙江大学', count: 14 }, { name: '复旦大学', count: 12 },
          { name: '上海交通大学', count: 11 }, { name: '南京大学', count: 10 },
          { name: '中国科学技术大学', count: 9 }, { name: '华中科技大学', count: 8 },
          { name: '武汉大学', count: 8 }, { name: '中山大学', count: 7 },
          { name: '四川大学', count: 7 }, { name: '哈尔滨工业大学', count: 6 },
          { name: '西安交通大学', count: 6 }, { name: '北京航空航天大学', count: 5 },
          { name: '同济大学', count: 5 }, { name: '南开大学', count: 4 },
          { name: '厦门大学', count: 4 }, { name: '东南大学', count: 4 },
          { name: '天津大学', count: 3 }, { name: '山东大学', count: 3 }
        ],
        industry: [
          { name: '互联网/IT', value: 35 },
          { name: '金融/银行', value: 22 },
          { name: '制造业', value: 16 },
          { name: '教育/培训', value: 12 },
          { name: '公共管理', value: 8 },
          { name: '医疗健康', value: 5 },
          { name: '其他', value: 2 }
        ]
      }
    }
  } catch (e) {
    console.warn('API调用失败，使用模拟数据', e)
    // 同上模拟数据...
  }
}

// ===== 加载中国地图 =====
const loadChinaMap = async () => {
  try {
    // 使用阿里云 DataV 的中国地图数据（无需安装）
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    if (!response.ok) throw new Error('网络请求失败')
    const chinaMap = await response.json()
    echarts.registerMap('china', chinaMap)
    mapLoaded.value = true
    console.log('✅ 中国地图加载成功')
  } catch (e) {
    console.warn('中国地图加载失败，使用备用方案', e)
    mapLoaded.value = true // 仍然渲染，但使用简化图表
  }
}

// ===== 初始化图表 =====
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
  updateCharts()
}

// ===== 更新图表 =====
const updateCharts = () => {
  updateHeatmap()
  updateSchools()
  updateIndustry()
}

// ----- 1. 中国地图热力图 -----
const updateHeatmap = () => {
  if (!heatmapChart) return

  const data = destData.value.heatmap
  const maxValue = Math.max(...data.map(d => d.value), 1)

  // 如果地图已加载，使用中国地图
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
        text: ['高', '低'],
        calculable: true,
        inRange: { color: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#2e7d32'] }
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [104, 35],
        itemStyle: {
          areaColor: '#e8ecf1',
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: { areaColor: '#667eea' }
        }
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
    })
  } else {
    // 备用方案：柱状图显示各省数据
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
    })
  }
  heatmapChart.resize()
}

// ----- 2. 升学院校 Top20 -----
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
  })
  schoolChart.resize()
}

// ----- 3. 行业分布饼图 -----
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
  })
  industryChart.resize()
}

// ===== 事件处理 =====
const onYearChange = () => {
  loadData()
  // 延迟更新图表，等数据加载完成
  setTimeout(() => updateCharts(), 300)
}
const onCollegeChange = onYearChange

// ===== 生命周期 =====
onMounted(async () => {
  // 先加载地图
  await loadChinaMap()
  // 再加载数据
  await loadData()
  // 最后初始化图表
  nextTick(() => {
    initCharts()
    // 延迟渲染确保DOM准备好
    setTimeout(() => updateCharts(), 200)
  })

  // 窗口resize自适应
  window.addEventListener('resize', () => {
    [heatmapChart, schoolChart, industryChart].forEach(c => c?.resize())
  })
})

watch(selectedYear, onYearChange)
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