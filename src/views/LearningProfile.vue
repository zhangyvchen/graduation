<template>
  <div class="learning-page">
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
.learning-page {
  padding: 0;
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