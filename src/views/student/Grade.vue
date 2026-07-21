<template>
  <div class="grade-page">
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <span>📈 历年GPA趋势</span>
          </template>
          <div ref="trendChart" style="height: 320px"></div>
          <div class="chart-tip" v-if="hasSynthetic">
            <el-icon><InfoFilled /></el-icon>
            <span>缺失年份为基于历年走势生成的参考数据</span>
          </div>
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
const hasSynthetic = ref(false)

onMounted(async () => {
  const res = await getMyGrades()
  if (res.code === 200) {
    grade.value = res.data
    hasSynthetic.value = !!res.data.hasSynthetic
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
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trend.map(t => t.year + '年'),
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 4,
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      data: trend.map(t => t.gpa),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 9,
      itemStyle: { color: '#0ea5e9', borderColor: '#fff', borderWidth: 2 },
      lineStyle: { width: 3, color: '#0ea5e9' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(14,165,233,0.35)' },
            { offset: 1, color: 'rgba(16,185,129,0.05)' }
          ]
        }
      },
      label: {
        show: true,
        position: 'top',
        color: '#0369a1',
        fontWeight: 600,
        formatter: '{c}'
      }
    }]
  })
  window.addEventListener('resize', () => chart.resize())
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
.chart-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}
.chart-tip .el-icon { color: #0ea5e9; }
</style>
