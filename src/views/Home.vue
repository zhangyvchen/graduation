<template>
  <div class="home-page">
    <div class="year-selector">
      <el-select v-model="selectedYear" placeholder="选择年份" @change="onYearChange">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
      <el-button type="primary" @click="refreshData" :loading="loading" style="margin-left: 12px;">
        刷新数据
      </el-button>
    </div>

    <div class="overview-cards">
      <el-card class="stat-card" :loading="loading">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ overview.totalGraduates || 0 }}</div>
          <div class="stat-label">总毕业生数</div>
        </div>
      </el-card>

      <el-card class="stat-card" :loading="loading">
        <div class="stat-icon">💼</div>
        <div class="stat-info">
          <div class="stat-value">{{ overview.employmentRate || 0 }}%</div>
          <div class="stat-label">就业率</div>
        </div>
      </el-card>

      <el-card class="stat-card" :loading="loading">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <div class="stat-value">{{ overview.enrollmentRate || 0 }}%</div>
          <div class="stat-label">升学率</div>
        </div>
      </el-card>
    </div>

    <!-- 功能专区 -->
    <el-row :gutter="20" style="margin-top: 24px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>🔥 毕业生服务专区</span>
          </template>
          <div class="service-cards">
            <div class="service-card" @click="goToVerify">
              <div class="service-icon scan">📱</div>
              <div class="service-info">
                <div class="service-title">扫码核销</div>
                <div class="service-desc">出示个人二维码完成身份核销，查看个人分析报告</div>
              </div>
              <el-button type="primary" size="small" round>立即进入</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const auth = useAuth()

const selectedYear = ref(2024)
const years = ref([2020, 2021, 2022, 2023, 2024, 2025, 2026])
const loading = ref(false)

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
let isMounted = false

onMounted(async () => {
  isMounted = true
  await loadOverview()
  await loadAllYears()
  nextTick(() => initCharts())
})

onUnmounted(() => {
  isMounted = false
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
})

const loadOverview = async () => {
  loading.value = true
  try {
    const res = await getOverview(selectedYear.value)
    if (isMounted && res.code === 200 && res.data) {
      overview.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const loadAllYears = async () => {
  const data = []
  for (const year of years.value) {
    const res = await getOverview(year)
    if (isMounted && res.code === 200 && res.data) data.push(res.data)
  }
  allYearData.value = data
}

const onYearChange = async () => {
  await loadOverview()
  updatePieChart()
}

const refreshData = async () => {
  await loadOverview()
  await loadAllYears()
  nextTick(() => {
    updatePieChart()
    updateTrendChart()
  })
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

const goToVerify = () => {
  // 已学生登录则直接进入学生核销页，否则跳转到学生登录页并携带回调地址
  if (auth.state.isLoggedIn && auth.state.role?.toUpperCase() === 'STUDENT') {
    router.push('/student/verify')
  } else {
    router.push('/login?redirect=/student/verify')
  }
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
.service-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.service-card {
  flex: 1;
  min-width: 280px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  cursor: pointer;
  transition: all 0.3s;
}
.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}
.service-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}
.service-icon.scan {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.service-info {
  flex: 1;
}
.service-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 6px;
}
.service-desc {
  font-size: 13px;
  color: #909399;
}
</style>
