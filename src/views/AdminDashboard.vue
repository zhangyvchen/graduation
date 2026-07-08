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
        <el-table :data="activities" border>
          <el-table-column prop="time" label="时间" width="150" />
          <el-table-column prop="action" label="操作" />
          <el-table-column prop="user" label="操作者" width="100" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const stats = ref({
  totalBatches: 4,
  totalStudents: 1200,
  totalTemplates: 3,
  totalVerified: 856
})

const activities = ref([
  { id: 1, time: '2024-01-15 10:30', action: '新增批次 2024届', user: 'admin' },
  { id: 2, time: '2024-01-15 09:15', action: '导入学生名单（50人）', user: 'admin' },
  { id: 3, time: '2024-01-14 16:45', action: '创建报告模板', user: 'admin' },
  { id: 4, time: '2024-01-14 14:20', action: '删除学生记录', user: 'admin' },
  { id: 5, time: '2024-01-13 11:00', action: '导出Excel数据', user: 'admin' }
])

onMounted(() => {
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
</style>
