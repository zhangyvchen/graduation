<template>
  <div class="dashboard-page">
    <header class="content-header">
      <h2>管理后台首页</h2>
    </header>
    
    <div class="welcome-card">
      <el-card>
        <div class="welcome-content">
          <div class="welcome-icon">👋</div>
          <div class="welcome-info">
            <h3>欢迎来到毕业数据报告管理系统</h3>
            <p>请从左侧菜单选择需要管理的模块</p>
          </div>
        </div>
      </el-card>
    </div>
    
    <div class="quick-stats">
      <el-card class="stat-card clickable" @click="router.push('/admin/batch')">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalBatches }}</div>
          <div class="stat-label">管理批次</div>
        </div>
      </el-card>
      <el-card class="stat-card clickable" @click="router.push('/admin/student')">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalStudents }}</div>
          <div class="stat-label">学生总数</div>
        </div>
      </el-card>
      <el-card class="stat-card clickable" @click="router.push('/admin/template')">
        <div class="stat-icon">📄</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalTemplates }}</div>
          <div class="stat-label">报告模板</div>
        </div>
      </el-card>
      <el-card class="stat-card clickable" @click="router.push('/admin/verify')">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalVerified }}</div>
          <div class="stat-label">已核销</div>
        </div>
      </el-card>
    </div>
    
    <div class="recent-activities">
      <el-card>
        <template #header>
          <span>最近操作</span>
        </template>
        <el-table :data="activities" border v-loading="loading">
          <el-table-column prop="createdAt" label="时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="operation" label="操作" />
          <el-table-column prop="operator" label="操作者" width="100" />
          <el-table-column prop="module" label="模块" width="100">
            <template #default="scope">
              <el-tag size="small">{{ scope.row.module || '-' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="activities.length === 0 && !loading" class="empty-tip">
          暂无操作记录
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecentLogs } from '../api/operationLog'
import { getAllBatch } from '../api/batch'
import { getAllStudents } from '../api/student'

const router = useRouter()
const loading = ref(false)

const stats = ref({
  totalBatches: 0,
  totalStudents: 0,
  totalTemplates: 0,
  totalVerified: 0
})

const activities = ref([])

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return dateTime.replace('T', ' ').substring(0, 19)
}

const fetchRecentLogs = async () => {
  loading.value = true
  try {
    const res = await getRecentLogs(10)
    if (res.code === 200) {
      activities.value = res.data
    }
  } catch (error) {
    console.error('获取操作日志失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const [batchRes, studentRes] = await Promise.all([
      getAllBatch(),
      getAllStudents()
    ])
    
    if (batchRes.code === 200) {
      stats.value.totalBatches = batchRes.data.length
    }
    
    if (studentRes.code === 200) {
      stats.value.totalStudents = studentRes.data.length
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

onMounted(() => {
  fetchRecentLogs()
  fetchStats()
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
}

.content-header {
  margin-bottom: 20px;
}

.content-header h2 {
  color: #333;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 30px;
}

.welcome-icon {
  font-size: 64px;
}

.welcome-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.welcome-info p {
  color: #666;
  margin: 0;
}

.quick-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  cursor: default;
}

.stat-card.clickable {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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

.recent-activities {
  margin-top: 20px;
}

.empty-tip {
  text-align: center;
  padding: 30px;
  color: #999;
}
</style>