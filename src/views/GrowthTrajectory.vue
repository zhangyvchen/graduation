<template>
  <div class="growth-page">
    <div class="year-selector">
      <el-select v-model="selectedYear" placeholder="选择年份">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
    </div>
    
    <div class="charts-grid">
      <el-card class="chart-card">
        <template #header>
          <span>荣誉奖项分布图</span>
        </template>
        <div ref="honorChart" class="chart"></div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <span>奖学金获得率</span>
        </template>
        <div ref="scholarshipChart" class="chart"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const years = [2024, 2023, 2022, 2021]
const selectedYear = ref(2024)
const honorChart = ref(null)
const scholarshipChart = ref(null)

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  const honor = echarts.init(honorChart.value)
  honor.setOption({
    xAxis: { type: 'category', data: ['校级', '省级', '国家级'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 80, 30], type: 'bar' }]
  })
  
  const scholarship = echarts.init(scholarshipChart.value)
  scholarship.setOption({
    series: [{
      type: 'pie',
      data: [
        { value: 30, name: '一等奖学金' },
        { value: 50, name: '二等奖学金' },
        { value: 80, name: '三等奖学金' },
        { value: 40, name: '助学金' }
      ]
    }]
  })
}
</script>

<style scoped>
.growth-page {
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