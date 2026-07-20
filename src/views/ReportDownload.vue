<template>
  <div class="report-page">
    <div v-if="!isLoggedIn" class="login-overlay">
      <el-dialog
        v-model="showLoginDialog"
        :close-on-click-modal="true"
        :show-close="true"
        width="400px"
        center
        @close="goBack"
      >
        <div class="login-dialog-content">
          <div class="login-icon">🔒</div>
          <h2>请先登录</h2>
          <p>查看和下载报告需要登录系统</p>
          <div class="login-options">
            <el-button type="primary" size="large" @click="goToStudentLogin">
              🎓 学生登录
            </el-button>
            <el-button type="default" size="large" @click="goToAdminLogin">
              🔑 管理员登录
            </el-button>
          </div>
        </div>
        <template #footer>
          <div style="text-align: center;">
            <el-button type="text" @click="goBack">返回首页</el-button>
          </div>
        </template>
      </el-dialog>
    </div>

    <div v-else-if="isAdmin" class="admin-report">
      <div class="report-form">
        <el-card>
          <template #header>
            <span>📋 查询学生报告</span>
          </template>

          <el-form :model="reportForm" label-width="100px">
            <el-form-item label="学号">
              <el-input
                v-model="reportForm.studentId"
                placeholder="请输入学号"
                @keyup.enter="generateReport"
              />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="reportForm.name" placeholder="请输入姓名（可选）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateReport" :loading="loading">查询报告</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>

    <div v-else class="redirecting">
      <p>正在打开个人报告…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { checkStudentExists } from '../api/student'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuth()

const isLoggedIn = computed(() => auth.state.isLoggedIn)
const isStudent = computed(() => auth.state.role?.toUpperCase() === 'STUDENT')
const isAdmin = computed(() => auth.state.role?.toUpperCase() === 'ADMIN')

const showLoginDialog = ref(true)
const loading = ref(false)
const reportForm = ref({ studentId: '', name: '' })

const goToStudentLogin = () => {
  router.push('/login?redirect=/report')
}

const goToAdminLogin = () => {
  router.push('/admin/login?redirect=/report')
}

const goBack = () => {
  router.push('/')
}

const resetForm = () => {
  reportForm.value = { studentId: '', name: '' }
}

/** 学生进入报告下载时，跳转到与后台「查看报告」相同的页面 */
const redirectStudentToReport = () => {
  if (!isStudent.value) return
  router.replace('/my-report')
}

const generateReport = async () => {
  if (!reportForm.value.studentId) {
    ElMessage.warning('请输入学号')
    return
  }

  loading.value = true
  try {
    const res = await checkStudentExists(reportForm.value.studentId)
    if (res.code === 200 && res.data) {
      router.push(`/admin/student-report/${reportForm.value.studentId}`)
    } else {
      ElMessage.error('学生不存在')
    }
  } catch (e) {
    console.error('[ReportDownload] 查询失败:', e)
    ElMessage.error('查询失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  redirectStudentToReport()
})

watch(isStudent, (val) => {
  if (val) redirectStudentToReport()
})
</script>

<style scoped>
.report-page {
  min-height: 60vh;
  padding: 20px;
}

.login-overlay {
  min-height: 60vh;
  background: #F8FAF9;
}

.login-overlay :deep(.el-dialog__header) {
  background: #FFFFFF;
  padding: 0;
}

.login-dialog-content {
  text-align: center;
  padding: 20px 10px;
}

.login-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-dialog-content h2 {
  margin: 0 0 8px;
  color: #2c3e50;
}

.login-dialog-content p {
  margin: 0 0 24px;
  color: #666;
}

.login-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-report {
  max-width: 640px;
  margin: 40px auto;
}

.redirecting {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}
</style>
