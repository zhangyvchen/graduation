<template>
  <div class="learning-container">
    <header class="header">
      <div class="logo">学习画像</div>
      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link to="/growth">成长轨迹</router-link>
        <router-link to="/destination">去向地图</router-link>
        <router-link to="/learning">学习画像</router-link>
        <router-link to="/report">报告下载</router-link>
      </nav>
    </header>
    
    <main class="main-content">
      <div class="year-selector">
        <el-select v-model="selectedYear" placeholder="选择年份">
          <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
        </el-select>
      </div>
      
      <div class="charts-grid">
        <el-card class="chart-card">
          <template #header>
            <span>平均绩点分布</span>
          </template>
          <div ref="gpaChart" class="chart"></div>
        </el-card>
        
        <el-card class="chart-card">
          <template #header>
            <span>图书馆借阅统计</span>
          </template>
          <div ref="libraryChart" class="chart"></div>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const years = [2024, 2023, 2022, 2021]
const selectedYear = ref(2024)
const gpaChart = ref(null)
const libraryChart = ref(null)

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  const gpa = echarts.init(gpaChart.value)
  gpa.setOption({
    xAxis: { type: 'category', data: ['<2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0'] },
    yAxis: { type: 'value' },
    series: [{ data: [50, 120, 200, 300, 180], type: 'bar' }]
  })
  
  const library = echarts.init(libraryChart.value)
  library.setOption({
    xAxis: { type: 'category', data: ['大一', '大二', '大三', '大四'] },
    yAxis: { type: 'value' },
    series: [{ data: [20, 45, 60, 35], type: 'line' }]
  })
}
</script>

<style scoped>
.learning-container {
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
}

.main-content {
  padding: 40px;
}

.year-selector {
  margin-bottom: 30px;
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
</style>