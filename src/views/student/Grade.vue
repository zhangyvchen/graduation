<template>
  <div class="grade-page">
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <span>📈 历年GPA趋势</span>
          </template>
          <div ref="trendChart" style="height: 320px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <span>📊 概览</span>
          </template>
          <div class="overview">
            <div class="overview-item">
              <div class="overview-label">当前GPA</div>
              <div class="overview-value">{{ grade.currentGpa || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">挂科/补考</div>
              <div class="overview-value" :class="{ 'has-fail': grade.failedCount > 0 }">
                {{ grade.failedCount || 0 }} 门
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-label">课程总数</div>
              <div class="overview-value">{{ grade.courseList?.length || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <span>📚 课程成绩明细</span>
      </template>
      <el-table :data="grade.courseList || []" stripe>
        <el-table-column prop="semester" label="学期" width="120" />
        <el-table-column prop="courseName" label="课程" width="140" />
        <el-table-column prop="type" label="性质" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === '主修' ? 'danger' : 'info'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit" label="学分" width="80" />
        <el-table-column prop="score" label="成绩" width="80">
          <template #default="{ row }">
            <span :class="{ 'fail-score': row.score < 60 }">{{ row.score?.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="gradePoint" label="绩点" width="80" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag v-if="row.status === '挂科'" type="danger" size="small">⚠️ 挂科</el-tag>
            <el-tag v-else type="success" size="small">✓ 正常</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getMyGrades } from '@/api/student'

const grade = ref({})
const trendChart = ref()

onMounted(async () => {
  const res = await getMyGrades()
  if (res.code === 200) {
    grade.value = res.data
    await nextTick()
    renderChart()
  }
})

const renderChart = () => {
  if (!trendChart.value) return
  const chart = echarts.init(trendChart.value)
  const trend = grade.value.gpaTrend || []
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trend.map(t => t.year + '年')
    },
    yAxis: { type: 'value', min: 0, max: 4 },
    series: [{
      data: trend.map(t => t.gpa),
      type: 'line',
      smooth: true,
      itemStyle: { color: '#409eff' },
      areaStyle: { color: 'rgba(64,158,255,0.2)' }
    }]
  })
}
</script>

<style scoped>
.grade-page { }
.overview { display: flex; justify-content: space-around; }
.overview-item { text-align: center; padding: 16px; }
.overview-label { color: #909399; font-size: 13px; }
.overview-value { font-size: 28px; font-weight: bold; color: #303133; margin-top: 8px; }
.overview-value.has-fail { color: #f56c6c; }
.fail-score { color: #f56c6c; font-weight: bold; }
</style>
