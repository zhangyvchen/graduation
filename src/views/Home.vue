<template>
  <div class="home-container">
    <header class="header">
      <div class="logo">毕业数据报告系统</div>
      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link to="/growth">成长轨迹</router-link>
        <router-link to="/destination">去向地图</router-link>
        <router-link to="/learning">学习画像</router-link>
        <router-link to="/report">报告下载</router-link>
        <router-link to="/admin">管理后台</router-link>
      </nav>
    </header>
    
    <main class="main-content">
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
    </main>
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
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav a {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  transition: opacity 0.3s;
}

.nav a:hover {
  opacity: 0.8;
}

.main-content {
  padding: 40px;
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