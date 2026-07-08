<!-- src/views/GrowthTrajectory.vue -->
<template>
  <div class="growth-page">
    <div class="year-selector">
      <el-select v-model="selectedYear" placeholder="选择年份" @change="onYearChange">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
      <el-button type="primary" @click="refreshData" :loading="loading" style="margin-left: 12px;">
        刷新数据
      </el-button>
    </div>

    <div class="charts-grid">
      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>荣誉奖项分布</span>
        </template>
        <div ref="honorChart" class="chart"></div>
      </el-card>

      <el-card class="chart-card" :loading="loading">
        <template #header>
          <span>奖学金获得情况</span>
        </template>
        <div ref="scholarshipChart" class="chart"></div>
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
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getGrowthByYear } from '../api/growth'
import { getDestinationYears } from '../api/destination'

const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)

const honorChart = ref(null)
const scholarshipChart = ref(null)
const cadreChart = ref(null)
const partyChart = ref(null)

let honorInstance = null
let scholarshipInstance = null
let cadreInstance = null
let partyInstance = null

// ========== 数据状态 ==========
const statsData = ref({
  honorData: [],
  scholarshipData: [],
  cadreData: [],
  partyData: []
})

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
    years.value = [2024, 2023, 2022, 2021]
    if (!selectedYear.value) {
      selectedYear.value = years.value[0]
    }
  }
}

// ========== 加载统计数据 ==========
const loadStats = async (year) => {
  try {
    const res = await getGrowthByYear(year)
    if (res.code === 200 && res.data) {
      statsData.value = res.data
      return res.data
    }
  } catch (error) {
    console.error('获取成长统计数据失败:', error)
  }
  return null
}

// ========== 刷新数据 ==========
const refreshData = async () => {
  if (loading.value || !selectedYear.value) return

  loading.value = true
  try {
    await loadStats(selectedYear.value)
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

const onYearChange = () => {
  refreshData()
}

// ========== 渲染所有图表 ==========
const renderCharts = () => {
  renderHonorChart()
  renderScholarshipChart()
  renderCadreChart()
  renderPartyChart()
}

// ========== 荣誉奖项图表 ==========
const renderHonorChart = () => {
  if (!honorChart.value) return
  if (!honorInstance) {
    honorInstance = echarts.init(honorChart.value)
  }

  const data = statsData.value.honorData || []
  const labels = ['校级', '省级', '国家级']

  if (!data || data.length === 0 || data.every(v => v === 0)) {
    honorInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{ type: 'bar', data: [] }]
    })
    return
  }

  honorInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `<strong>${p.name}</strong><br/>人数：<strong>${p.value}</strong>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: data,
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#f093fb' },
          { offset: 1, color: '#f5576c' }
        ])
      },
      label: { show: true, position: 'top' }
    }]
  })

  honorInstance.resize()
}

// ========== 奖学金图表 ==========
const renderScholarshipChart = () => {
  if (!scholarshipChart.value) return
  if (!scholarshipInstance) {
    scholarshipInstance = echarts.init(scholarshipChart.value)
  }

  const data = statsData.value.scholarshipData || []

  if (!data || data.length === 0) {
    scholarshipInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      series: [{ type: 'pie', data: [] }]
    })
    return
  }

  const colors = ['#43e97b', '#fa709a']

  scholarshipInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `<strong>${params.name}</strong><br/>人数：<strong>${params.value}</strong><br/>占比：<strong>${params.percent}%</strong>`
      }
    },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.map((item, index) => ({
        ...item,
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  })

  scholarshipInstance.resize()
}

// ========== 学生干部图表 ==========
const renderCadreChart = () => {
  if (!cadreChart.value) return
  if (!cadreInstance) {
    cadreInstance = echarts.init(cadreChart.value)
  }

  const data = statsData.value.cadreData || []

  if (!data || data.length === 0) {
    cadreInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [{ type: 'bar', data: [] }]
    })
    return
  }

  const names = data.map(item => item.name)
  const values = data.map(item => item.value)

  cadreInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `<strong>${p.name}</strong><br/>人数：<strong>${p.value}</strong>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: names },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: values,
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4facfe' },
          { offset: 1, color: '#00f2fe' }
        ])
      },
      label: { show: true, position: 'top' }
    }]
  })

  cadreInstance.resize()
}

// ========== 政治面貌图表 ==========
const renderPartyChart = () => {
  if (!partyChart.value) return
  if (!partyInstance) {
    partyInstance = echarts.init(partyChart.value)
  }

  const data = statsData.value.partyData || []

  if (!data || data.length === 0) {
    partyInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } },
      series: [{ type: 'pie', data: [] }]
    })
    return
  }

  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b']

  partyInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `<strong>${params.name}</strong><br/>人数：<strong>${params.value}</strong><br/>占比：<strong>${params.percent}%</strong>`
      }
    },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.map((item, index) => ({
        ...item,
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  })

  partyInstance.resize()
}

// ========== 窗口自适应 ==========
const handleResize = () => {
  if (honorInstance) honorInstance.resize()
  if (scholarshipInstance) scholarshipInstance.resize()
  if (cadreInstance) cadreInstance.resize()
  if (partyInstance) partyInstance.resize()
}

// ========== 生命周期 ==========
onMounted(async () => {
  await loadYears()
  await refreshData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (honorInstance) { honorInstance.dispose(); honorInstance = null }
  if (scholarshipInstance) { scholarshipInstance.dispose(); scholarshipInstance = null }
  if (cadreInstance) { cadreInstance.dispose(); cadreInstance = null }
  if (partyInstance) { partyInstance.dispose(); partyInstance = null }
})
</script>

<style scoped>
.growth-page {
  padding: 0;
}

.year-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
}

.chart {
  height: 300px;
}

@media (max-width: 992px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
