<!-- src/views/Home.vue -->
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOverview } from '../api/graduationData'
import { getDestinationYears } from '../api/destination'

const years = ref([])
const selectedYear = ref(null)
const loading = ref(false)

const overview = ref({
  totalGraduates: 0,
  employmentRate: 0,
  enrollmentRate: 0
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

// ========== 加载概览数据 ==========
const loadOverview = async () => {
  if (!selectedYear.value) return

  try {
    const res = await getOverview(selectedYear.value)
    if (res.code === 200 && res.data) {
      overview.value = res.data
    }
  } catch (error) {
    console.error('获取概览数据失败:', error)
  }
}

// ========== 刷新数据 ==========
const refreshData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    await loadOverview()
  } finally {
    loading.value = false
  }
}

const onYearChange = () => {
  refreshData()
}

// ========== 生命周期 ==========
onMounted(async () => {
  await loadYears()
  await refreshData()
})
</script>

<style scoped>
.home-page {
  padding: 0;
}

.year-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}

.overview-cards {
  display: flex;
  gap: 30px;
  justify-content: center;
}

.stat-card {
  width: 250px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

@media (max-width: 768px) {
  .overview-cards {
    flex-direction: column;
    align-items: center;
  }
  .stat-card {
    width: 100%;
    max-width: 300px;
  }
}
</style>