<template>
  <div class="comparison-page">
    <!-- 对比范围选择 -->
    <el-card shadow="hover" class="filter-card">
      <el-radio-group v-model="scope" @change="loadData" size="large">
        <el-radio-button label="class">同班</el-radio-button>
        <el-radio-button label="major">同专业</el-radio-button>
        <el-radio-button label="college">同学院</el-radio-button>
      </el-radio-group>
      <span class="scope-info">对比范围: <strong>{{ scopeText }}</strong> · 共 <strong>{{ data.totalCount }}</strong> 人</span>
    </el-card>

    <!-- 我的标签 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header><span>🏷️ 我的优势标签</span></template>
      <div class="tags-wrapper">
        <el-tag
          v-for="tag in data.tags || []"
          :key="tag"
          type="warning"
          effect="dark"
          size="large"
          class="tag-item"
        >{{ tag }}</el-tag>
      </div>
    </el-card>

    <!-- 雷达图 + 详细数据 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>📊 综合能力雷达图</span></template>
          <div ref="radarChart" style="height: 360px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>📈 详细排名</span></template>
          <el-table :data="rankTable" stripe>
            <el-table-column prop="name" label="维度" />
            <el-table-column prop="mine" label="我的" width="80" align="center" />
            <el-table-column prop="avg" label="平均" width="80" align="center" />
            <el-table-column label="排名" width="140" align="center">
              <template #default="{ row }">
                <span :class="getRankClass(row.percent)">
                  前 {{ 100 - row.percent }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getComparison } from '@/api/student'

const data = ref({})
const scope = ref('major')
const radarChart = ref()

const scopeText = computed(() => ({ class: '同班', major: '同专业', college: '同学院' }[scope.value]))

const rankTable = computed(() => [
  { name: '📊 GPA', mine: data.value.myGpa, avg: data.value.avgGpa?.toFixed(2), percent: data.value.gpaPercent },
  { name: '📖 借阅量', mine: data.value.myBookCount, avg: data.value.avgBookCount?.toFixed(1), percent: data.value.bookPercent },
  { name: '🥇 竞赛数', mine: data.value.myCompetitionCount, avg: data.value.avgCompetitionCount?.toFixed(1), percent: data.value.competitionPercent },
  { name: '🏆 荣誉数', mine: data.value.myHonorCount, avg: data.value.avgHonorCount?.toFixed(1), percent: data.value.honorPercent },
  { name: '💰 奖学金', mine: data.value.myScholarshipAmount, avg: data.value.avgScholarshipAmount?.toFixed(0), percent: data.value.scholarshipPercent }
])

const loadData = async () => {
  const res = await getComparison({ scope: scope.value })
  if (res.code === 200) {
    data.value = res.data
    await nextTick()
    renderRadar()
  }
}

const renderRadar = () => {
  if (!radarChart.value) return
  const chart = echarts.init(radarChart.value)
  chart.setOption({
    tooltip: {},
    radar: {
      indicator: [
        { name: 'GPA', max: 100 },
        { name: '借阅', max: 100 },
        { name: '竞赛', max: 100 },
        { name: '荣誉', max: 100 },
        { name: '奖学金', max: 100 }
      ]
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          data.value.gpaPercent || 0,
          data.value.bookPercent || 0,
          data.value.competitionPercent || 0,
          data.value.honorPercent || 0,
          data.value.scholarshipPercent || 0
        ],
        name: '我的位置',
        areaStyle: { color: 'rgba(64,158,255,0.4)' },
        itemStyle: { color: '#409eff' }
      }]
    }]
  })
}

const getRankClass = (p) => {
  if (p >= 80) return 'rank-excellent'
  if (p >= 50) return 'rank-good'
  return 'rank-normal'
}

onMounted(loadData)
</script>

<style scoped>
.comparison-page { }
.filter-card { display: flex; align-items: center; gap: 24px; }
.scope-info { color: #606266; margin-left: auto; }
.tags-wrapper { display: flex; gap: 12px; flex-wrap: wrap; }
.tag-item { padding: 8px 16px; }
.rank-excellent { color: #f56c6c; font-weight: bold; }
.rank-good { color: #e6a23c; font-weight: bold; }
.rank-normal { color: #909399; }
</style>
