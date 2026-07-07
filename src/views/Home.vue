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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOverview } from '../api/graduationData'

const years = [2024, 2023, 2022, 2021]
const selectedYear = ref(2024)
const overview = ref({
  totalGraduates: 0,
  employmentRate: 0,
  enrollmentRate: 0
})

onMounted(() => {
  loadOverview()
})

const loadOverview = async () => {
  const res = await getOverview(selectedYear.value)
  if (res.code === 200 && res.data) {
    overview.value = res.data
  }
}
</script>

<style scoped>
.home-page {
  padding: 0;
}

.year-selector {
  margin-bottom: 30px;
}

.year-selector :deep(.el-select) {
  width: 200px;
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
</style>