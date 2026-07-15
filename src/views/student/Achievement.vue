<template>
  <div class="achievement-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num">{{ data.totalCount || 0 }}</div>
          <div class="stat-label">🏆 总成就数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num" style="color: #e6a23c">¥ {{ data.totalScholarship || 0 }}</div>
          <div class="stat-label">💰 累计奖学金</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num" style="color: #67c23a">{{ honorCount }}</div>
          <div class="stat-label">🎖️ 荣誉奖项</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num" style="color: #f56c6c">{{ competitionCount }}</div>
          <div class="stat-label">🥇 竞赛获奖</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 等级分布 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <span>📊 等级分布</span>
      </template>
      <div ref="distChart" style="height: 280px"></div>
    </el-card>

    <!-- 筛选 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>📋 我的成就</span>
          <div class="filter-bar">
            <el-radio-group v-model="filters.type" @change="loadData" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="honor">荣誉</el-radio-button>
              <el-radio-button label="competition">竞赛</el-radio-button>
              <el-radio-button label="scholarship">奖学金</el-radio-button>
            </el-radio-group>
            <el-select v-model="filters.level" placeholder="等级" style="width: 120px; margin-left: 12px" @change="loadData" size="small">
              <el-option label="全部" value="all" />
              <el-option label="国家级" value="国家级" />
              <el-option label="省级" value="省级" />
              <el-option label="校级" value="校级" />
              <el-option label="院级" value="院级" />
            </el-select>
          </div>
        </div>
      </template>

      <el-empty v-if="!data.list || data.list.length === 0" description="暂无成就" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="item in data.list"
          :key="item.id"
          :timestamp="item.date"
          :type="getTypeColor(item.type)"
          placement="top"
        >
          <el-card shadow="hover" class="achievement-item">
            <div class="ach-header">
              <span class="ach-type">{{ item.typeText }}</span>
              <el-tag :type="getLevelColor(item.level)" size="small">{{ item.level }}</el-tag>
            </div>
            <h4 class="ach-title">{{ item.title }}</h4>
            <p class="ach-desc" v-if="item.description">{{ item.description }}</p>
            <div v-if="item.amount" class="ach-amount">💰 ¥{{ item.amount }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getMyAchievements } from '@/api/student'

const data = ref({})
const filters = ref({ type: 'all', year: 'all', level: 'all' })
const distChart = ref()

const honorCount = computed(() => (data.value.list || []).filter(i => i.type === 'honor').length)
const competitionCount = computed(() => (data.value.list || []).filter(i => i.type === 'competition').length)

const loadData = async () => {
  const res = await getMyAchievements(filters.value)
  if (res.code === 200) {
    data.value = res.data
    await nextTick()
    renderDist()
  }
}

const renderDist = () => {
  if (!distChart.value) return
  const chart = echarts.init(distChart.value)
  const dist = data.value.distribution || []
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: dist.map(d => ({ name: d.name, value: d.value })),
      label: { formatter: '{b}: {c} ({d}%)' }
    }]
  })
}

const getTypeColor = (type) => {
  return { honor: 'warning', competition: 'danger', scholarship: 'success' }[type] || 'primary'
}
const getLevelColor = (level) => {
  return { '国家级': 'danger', '省级': 'warning', '校级': 'success', '院级': 'info' }[level] || ''
}

onMounted(loadData)
</script>

<style scoped>
.achievement-page { }
.stat-row { margin: 0 !important; }
.stat-card { text-align: center; padding: 20px 0; }
.stat-num { font-size: 32px; font-weight: bold; color: #409eff; }
.stat-label { color: #909399; margin-top: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.filter-bar { display: flex; align-items: center; }
.achievement-item { margin-top: 8px; }
.ach-header { display: flex; justify-content: space-between; align-items: center; }
.ach-type { color: #909399; font-size: 13px; }
.ach-title { margin: 8px 0 4px 0; }
.ach-desc { color: #606266; margin: 0; font-size: 13px; }
.ach-amount { color: #e6a23c; font-weight: bold; margin-top: 8px; }
</style>
