<template>
  <div class="home-page">
    <div class="year-selector">
      <el-select v-model="selectedYear" placeholder="选择年份">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
    </div>
    
    <div class="overview-cards">
      <el-card class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ overview.totalGraduates }}</div>
          <div class="stat-label">总毕业生数</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon">💼</div>
        <div class="stat-info">
          <div class="stat-value">{{ overview.employmentRate }}%</div>
          <div class="stat-label">就业率</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <div class="stat-value">{{ overview.enrollmentRate }}%</div>
          <div class="stat-label">升学率</div>
        </div>
      </el-card>
    </div>

    <el-row :gutter="20" style="margin-top: 24px;">
      <el-col :span="12">
        <el-card>
          <template #header>就业/升学比例</template>
          <div ref="pieChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>历年趋势</template>
          <div ref="trendChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { getOverview } from '../api/graduationData'
import * as echarts from 'echarts'
import { ref, onMounted, watch, nextTick } from 'vue'

const years = [2024, 2023, 2022, 2021]
const selectedYear = ref(2024)
const overview = ref({
  totalGraduates: 0,
  employmentRate: 0,
  enrollmentRate: 0
})
const pieChartRef = ref(null)
const trendChartRef = ref(null)
let pieChart = null
let trendChart = null
const allYearData = ref([])

onMounted(async () => {
  await loadOverview()
  await loadAllYears()
  nextTick(() => initCharts())
})

const loadOverview = async () => {
  const res = await getOverview(selectedYear.value)
  if (res.code === 200 && res.data) {
    overview.value = res.data
  }
}

const loadAllYears = async () => {
  const data = []
  for (const year of years) {
    const res = await getOverview(year)
    if (res.code === 200 && res.data) data.push(res.data)
  }
  allYearData.value = data
}

watch(selectedYear, async () => {
  await loadOverview()
  updatePieChart()
})

const initCharts = () => {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    updatePieChart()
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    updateTrendChart()
  }
}

const updatePieChart = () => {
  if (!pieChart) return
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['45%', '70%'],
      data: [
        { value: overview.value.employmentRate || 0, name: '就业率' },
        { value: overview.value.enrollmentRate || 0, name: '升学率' },
        { value: Math.max(0, 100 - (overview.value.employmentRate||0) - (overview.value.enrollmentRate||0)), name: '其他' }
      ],
      label: { formatter: '{b}: {c}%' }
    }]
  })
}

const updateTrendChart = () => {
  if (!trendChart || allYearData.value.length === 0) return
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['就业率', '升学率', '毕业生数(十人)'] },
    xAxis: { type: 'category', data: allYearData.value.map(d => d.year + '届') },
    yAxis: { type: 'value', max: 100 },
    series: [
      { name: '就业率', type: 'line', data: allYearData.value.map(d => d.employmentRate||0), smooth: true },
      { name: '升学率', type: 'line', data: allYearData.value.map(d => d.enrollmentRate||0), smooth: true },
      { name: '毕业生数(十人)', type: 'bar', data: allYearData.value.map(d => (d.totalGraduates||0)/10) }
    ]
  })
}
</script>

<style scoped>
.home-page {
  padding: 0;
}
.year-selector {
  margin-bottom: 24px;
}
.year-selector :deep(.el-select) {
  width: 200px;
}
.overview-cards {
  display: flex; gap: 24px;
}
.stat-card {
  flex: 1; background: rgba(255,255,255,0.95);
  border-radius: 12px; padding: 20px;
  display: flex; align-items: center; gap: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.stat-icon {
  font-size: 48px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
}
.stat-label {
  font-size: 14px;
  color: #999;
}
</style>
