<!-- src/views/DestinationMap.vue -->
<template>
  <div class="destination-page">
    <div class="year-selector">
      <el-select v-model="selectedYear" placeholder="选择年份" @change="onYearChange">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
      <el-button type="primary" @click="refreshData" :loading="loading" style="margin-left: 12px;">
        刷新数据
      </el-button>
    </div>

    <div class="charts-grid">
      <el-card class="chart-card full-width" :loading="loading">
        <template #header>
          <span>就业省份分布</span>
          <el-tag size="small" type="info">共 {{ totalCount }} 条数据</el-tag>
        </template>
        <div ref="provinceChart" class="chart large"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>行业分布</span>
        </template>
        <div ref="industryChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>历年趋势</span>
        </template>
        <div ref="trendChart" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import {
  getProvinceStats,
  getIndustryStats,
  getYearStats,
  getDestinationYears,
  getDestinationTotalCount
} from '../api/destination'

const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)
const totalCount = ref(0)

const provinceChart = ref(null)
const industryChart = ref(null)
const trendChart = ref(null)

let provinceInstance = null
let industryInstance = null
let trendInstance = null

// ========== 数据状态 ==========
const provinceData = ref({ provinces: [], counts: [] })
const industryData = ref([])
const trendData = ref({ years: [], counts: [] })

// ========== 获取年份列表 ==========
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
    // 降级：使用默认年份
    years.value = [2024, 2023, 2022, 2021]
    if (!selectedYear.value) {
      selectedYear.value = years.value[0]
    }
  }
}

// ========== 加载总数据量 ==========
const loadTotalCount = async () => {
  try {
    const res = await getDestinationTotalCount()
    if (res.code === 200) {
      totalCount.value = res.data
    }
  } catch (error) {
    console.error('获取总数据量失败:', error)
  }
}

// ========== 加载省份数据 ==========
const loadProvinceData = async (year) => {
  try {
    const res = await getProvinceStats(year)
    if (res.code === 200 && res.data) {
      provinceData.value = res.data
      return res.data
    }
  } catch (error) {
    console.error('获取省份数据失败:', error)
  }
  return null
}

// ========== 加载行业数据 ==========
const loadIndustryData = async (year) => {
  try {
    const res = await getIndustryStats(year)
    if (res.code === 200 && res.data) {
      industryData.value = res.data.industryData || []
      return res.data
    }
  } catch (error) {
    console.error('获取行业数据失败:', error)
  }
  return null
}

// ========== 加载趋势数据 ==========
const loadTrendData = async () => {
  try {
    const res = await getYearStats()
    if (res.code === 200 && res.data) {
      trendData.value = res.data
      return res.data
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
  return null
}

// ========== 刷新所有数据 ==========
const refreshData = async () => {
  if (loading.value) return

  loading.value = true
  try {
    await Promise.all([
      loadTotalCount(),
      loadProvinceData(selectedYear.value),
      loadIndustryData(selectedYear.value),
      loadTrendData()
    ])
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

// ========== 年份变更 ==========
const onYearChange = () => {
  refreshData()
}

// ========== 渲染图表 ==========
const renderCharts = () => {
  renderProvinceChart()
  renderIndustryChart()
  renderTrendChart()
}

// ========== 省份图表 ==========
const renderProvinceChart = () => {
  if (!provinceChart.value) return

  if (!provinceInstance) {
    provinceInstance = echarts.init(provinceChart.value)
  }

  const { provinces, counts } = provinceData.value

  // 如果数据为空，显示空状态
  if (!provinces || provinces.length === 0) {
    provinceInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{ type: 'bar', data: [] }]
    })
    return
  }

  provinceInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `<strong>${p.name}</strong><br/>人数：<strong>${p.value}</strong>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: provinces,
      axisLabel: { rotate: 45, interval: 0 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}' }
    },
    series: [{
      type: 'bar',
      data: counts,
      barWidth: '45%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ])
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params) => params.value
      }
    }]
  })

  provinceInstance.resize()
}

// ========== 行业图表 ==========
const renderIndustryChart = () => {
  if (!industryChart.value) return

  if (!industryInstance) {
    industryInstance = echarts.init(industryChart.value)
  }

  const data = industryData.value

  if (!data || data.length === 0) {
    industryInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      series: [{ type: 'pie', data: [] }]
    })
    return
  }

  // 颜色方案
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#fee140']

  industryInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `<strong>${params.name}</strong><br/>人数：<strong>${params.value}</strong><br/>占比：<strong>${params.percent}%</strong>`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: {
        show: true,
        formatter: '{b}\n{d}%'
      },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      data: data.map((item, index) => ({
        ...item,
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  })

  industryInstance.resize()
}

// ========== 趋势图表 ==========
const renderTrendChart = () => {
  if (!trendChart.value) return

  if (!trendInstance) {
    trendInstance = echarts.init(trendChart.value)
  }

  const { years: yearLabels, counts } = trendData.value

  if (!yearLabels || yearLabels.length === 0) {
    trendInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{ type: 'line', data: [] }]
    })
    return
  }

  trendInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `<strong>${p.name}届</strong><br/>人数：<strong>${p.value}</strong>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: yearLabels.map(y => y + '届'),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}' }
    },
    series: [{
      type: 'line',
      data: counts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: '#667eea'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
        ])
      },
      itemStyle: {
        color: '#667eea'
      },
      label: {
        show: true,
        formatter: (params) => params.value
      }
    }]
  })

  trendInstance.resize()
}

// ========== 窗口自适应 ==========
const handleResize = () => {
  if (provinceInstance) provinceInstance.resize()
  if (industryInstance) industryInstance.resize()
  if (trendInstance) trendInstance.resize()
}

// ========== 监听年份变化 ==========
watch(selectedYear, (newVal) => {
  if (newVal) {
    refreshData()
  }
})

// ========== 生命周期 ==========
onMounted(async () => {
  await loadYears()
  await refreshData()

  window.addEventListener('resize', handleResize)
})

// 组件卸载时销毁图表实例
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (provinceInstance) { provinceInstance.dispose(); provinceInstance = null }
  if (industryInstance) { industryInstance.dispose(); industryInstance = null }
  if (trendInstance) { trendInstance.dispose(); trendInstance = null }
})
</script>

<style scoped>
.destination-page {
  padding: 0;
}

.year-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
}

.chart {
  height: 300px;
}

.chart.large {
  height: 400px;
}

.full-width {
  grid-column: span 2;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>