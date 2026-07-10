<template>
  <div class="statistics-page">
    <header class="content-header">
      <h2>数据统计</h2>
      <el-select v-model="selectedYear" placeholder="选择年份" style="width: 150px">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
    </header>
    
    <div class="stats-overview">
      <el-card class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.totalGraduates }}</div>
          <div class="stat-label">总毕业生数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">💼</div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.employmentRate }}%</div>
          <div class="stat-label">就业率</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.enrollmentRate }}%</div>
          <div class="stat-label">升学率</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.averageSalary }}K</div>
          <div class="stat-label">平均薪资</div>
        </div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span>就业去向分布</span>
        </template>
        <div ref="employmentChart" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>专业就业率对比</span>
        </template>
        <div ref="majorChart" class="chart-container"></div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card-full">
        <template #header>
          <span>历年就业率趋势</span>
        </template>
        <div ref="trendChart" class="chart-container-full"></div>
      </el-card>
    </div>
    
    <div class="stats-detail">
      <el-card>
        <template #header>
          <span>就业单位类型分布</span>
        </template>
        <el-table :data="companyTypeData" border>
          <el-table-column prop="type" label="单位类型" />
          <el-table-column prop="count" label="人数" />
          <el-table-column prop="percentage" label="占比(%)" />
          <el-table-column prop="trend" label="同比">
            <template #default="scope">
              <span :class="scope.row.trend > 0 ? 'trend-up' : 'trend-down'">
                {{ scope.row.trend > 0 ? '+' : '' }}{{ scope.row.trend }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getStatisticsByYear, getStatisticsOverview, getStatisticsTrend, getCompanyTypes, getMajorRates, getEmploymentDistribution } from '../api/batch'

const years = ref([2024])
const selectedYear = ref(2024)

const statistics = ref({
  totalGraduates: 0,
  employmentRate: 0,
  enrollmentRate: 0,
  averageSalary: 0
})

const companyTypeData = ref([])
const majorRateData = ref([])
const employmentDistributionData = ref([])
const trendData = ref({
  years: [],
  employmentRates: [],
  enrollmentRates: []
})

const employmentChart = ref(null)
const majorChart = ref(null)
const trendChart = ref(null)

const fetchYears = async () => {
  try {
    const res = await getStatisticsOverview()
    if (res.code === 200) {
      years.value = res.data.map(item => item.year)
      if (years.value.length > 0 && !years.value.includes(selectedYear.value)) {
        selectedYear.value = years.value[0]
      }
    }
  } catch (error) {
    console.error('获取年份数据失败', error)
  }
}

const fetchStatistics = async () => {
  try {
    const res = await getStatisticsByYear(selectedYear.value)
    if (res.code === 200) {
      statistics.value = {
        totalGraduates: res.data.totalGraduates || 0,
        employmentRate: res.data.employmentRate || 0,
        enrollmentRate: res.data.enrollmentRate || 0,
        averageSalary: res.data.averageSalary ? res.data.averageSalary / 1000 : 0
      }
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

const fetchCompanyTypes = async () => {
  try {
    const res = await getCompanyTypes()
    if (res.code === 200) {
      companyTypeData.value = res.data
    }
  } catch (error) {
    console.error('获取单位类型数据失败', error)
    companyTypeData.value = [
      { type: '互联网企业', count: 450, percentage: 37.5, trend: 5.2 },
      { type: '国有企业', count: 280, percentage: 23.3, trend: 3.1 },
      { type: '事业单位', count: 180, percentage: 15.0, trend: -2.3 },
      { type: '外资企业', count: 150, percentage: 12.5, trend: 1.8 },
      { type: '自主创业', count: 80, percentage: 6.7, trend: 8.5 },
      { type: '其他', count: 60, percentage: 5.0, trend: 0.5 }
    ]
  }
}

const fetchMajorRates = async () => {
  try {
    const res = await getMajorRates()
    if (res.code === 200) {
      majorRateData.value = res.data
    }
  } catch (error) {
    console.error('获取专业就业率数据失败', error)
    majorRateData.value = [
      { major: '软件工程', employmentRate: 97.2 },
      { major: '计算机科学', employmentRate: 95.8 },
      { major: '信息管理', employmentRate: 93.5 },
      { major: '人工智能', employmentRate: 98.1 },
      { major: '网络工程', employmentRate: 94.3 }
    ]
  }
}

const fetchEmploymentDistribution = async () => {
  try {
    const res = await getEmploymentDistribution(selectedYear.value)
    if (res.code === 200) {
      employmentDistributionData.value = res.data
    }
  } catch (error) {
    console.error('获取就业分布数据失败', error)
    employmentDistributionData.value = [
      { value: 540, name: '已就业' },
      { value: 420, name: '升学' },
      { value: 150, name: '待就业' },
      { value: 90, name: '自主创业' }
    ]
  }
}

const fetchTrend = async () => {
  try {
    const res = await getStatisticsTrend()
    if (res.code === 200) {
      trendData.value = {
        years: res.data.years.map(y => y + '届'),
        employmentRates: res.data.employmentRates,
        enrollmentRates: res.data.enrollmentRates
      }
    }
  } catch (error) {
    console.error('获取趋势数据失败', error)
    trendData.value = {
      years: ['2020届', '2021届', '2022届', '2023届', '2024届'],
      employmentRates: [90.2, 92.1, 93.8, 94.2, 95.5],
      enrollmentRates: [25.3, 28.3, 30.5, 32.8, 35.2]
    }
  }
}

const initCharts = () => {
  if (employmentChart.value) {
    const chart = echarts.init(employmentChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '就业去向',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10 },
        data: employmentDistributionData.value,
        color: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
      }]
    })
  }
  
  if (majorChart.value) {
    const chart = echarts.init(majorChart.value)
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: majorRateData.value.map(item => item.major) },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [{
        name: '就业率',
        type: 'bar',
        data: majorRateData.value.map(item => item.employmentRate),
        barWidth: '50%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        color: '#667eea'
      }]
    })
  }
  
  if (trendChart.value) {
    const chart = echarts.init(trendChart.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['就业率', '升学率'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: trendData.value.years },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [
        {
          name: '就业率',
          type: 'line',
          data: trendData.value.employmentRates,
          smooth: true,
          color: '#667eea'
        },
        {
          name: '升学率',
          type: 'line',
          data: trendData.value.enrollmentRates,
          smooth: true,
          color: '#764ba2'
        }
      ]
    })
  }
}

const updateCharts = () => {
  nextTick(() => {
    initCharts()
  })
}

const fetchAllData = async () => {
  await Promise.all([
    fetchYears(),
    fetchStatistics(),
    fetchCompanyTypes(),
    fetchMajorRates(),
    fetchEmploymentDistribution(),
    fetchTrend()
  ])
  nextTick(() => {
    initCharts()
  })
}

watch(selectedYear, async () => {
  await Promise.all([
    fetchStatistics(),
    fetchEmploymentDistribution()
  ])
  updateCharts()
})

onMounted(() => {
  fetchAllData()
})
</script>

<style scoped>
.statistics-page {
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-header h2 {
  color: #333;
}

.stats-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
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

.charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
}

.chart-card-full {
  width: 100%;
}

.chart-container {
  height: 300px;
}

.chart-container-full {
  height: 350px;
}

.stats-detail {
  margin-top: 20px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}
</style>
