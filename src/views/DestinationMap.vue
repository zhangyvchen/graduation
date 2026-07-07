<template>
  <div class="destination-container">
    <header class="header">
      <div class="logo">去向地图</div>
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
        <el-card class="chart-card full-width">
          <template #header>
            <span>就业省份热力图</span>
          </template>
          <div ref="heatmapChart" class="chart large"></div>
        </el-card>
        
        <el-card class="chart-card">
          <template #header>
            <span>行业分布</span>
          </template>
          <div ref="industryChart" class="chart"></div>
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
const heatmapChart = ref(null)
const industryChart = ref(null)

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  const heatmap = echarts.init(heatmapChart.value)
  heatmap.setOption({
    visualMap: { min: 0, max: 100 },
    tooltip: {},
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['北京', '上海', '广州', '深圳', '杭州', '成都'] },
    yAxis: { type: 'category', data: ['华北', '华东', '华南', '西南'] },
    series: [{
      type: 'heatmap',
      data: [
        [0, 0, 80], [1, 0, 20], [2, 0, 10], [3, 0, 10], [4, 0, 5], [5, 0, 3],
        [0, 1, 10], [1, 1, 90], [2, 1, 40], [3, 1, 30], [4, 1, 60], [5, 1, 20],
        [0, 2, 5], [1, 2, 30], [2, 2, 100], [3, 2, 95], [4, 2, 20], [5, 2, 15],
        [0, 3, 2], [1, 3, 10], [2, 3, 15], [3, 3, 10], [4, 3, 30], [5, 3, 70]
      ]
    }]
  })
  
  const industry = echarts.init(industryChart.value)
  industry.setOption({
    series: [{
      type: 'pie',
      data: [
        { value: 30, name: '互联网' },
        { value: 25, name: '金融' },
        { value: 20, name: '制造业' },
        { value: 15, name: '教育' },
        { value: 10, name: '其他' }
      ]
    }]
  })
}
</script>

<style scoped>
.destination-container {
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
  grid-template-columns: 1fr;
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
  grid-column: span 1;
}
</style>