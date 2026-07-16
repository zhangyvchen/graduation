<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="login-icon">🔒</div>
        <h2>管理后台登录</h2>
        <p class="login-subtitle">请使用管理员账号登录系统</p>
      </div>
      <div v-if="auth.state.isLoggedIn && auth.isAdmin()" class="logged-in-tip">
        <el-alert title="您已登录" type="info" closable @close="handleCloseTip" style="margin-bottom: 20px;">
          <template #default>
            您当前以 <strong>{{ auth.state.user?.name }}</strong> 身份登录，是否需要切换账号？
          </template>
          <template #actions>
            <el-button size="small" type="primary" @click="handleSwitchAccount">切换账号</el-button>
          </template>
        </el-alert>
      </div>
      <el-form :model="loginForm" ref="loginFormRef" label-width="80px" class="login-form">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item class="login-submit-item">
          <el-button type="primary" @click="handleLogin" style="width: 100%" :loading="isLoading">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuth } from '../stores/auth'
import { login } from '../api/admin'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const loginForm = ref({
  username: '',
  password: ''
})
const isLoading = ref(false)

const handleSwitchAccount = () => {
  auth.logout()
  ElMessage.info('已退出登录，请重新登录')
}

const handleCloseTip = () => {
  router.push('/admin/dashboard')
}

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  isLoading.value = true
  
  try {
    const response = await login({
      username: loginForm.value.username,
      password: loginForm.value.password
    })
    
    if (response.code === 200 && response.data) {
      const data = response.data
      localStorage.setItem('token', data.token)
      const userData = {
        token: data.token,
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role || 'admin'
      }
      auth.login({
        ...userData,
        role: (userData.role || 'admin').toUpperCase()
      })
      console.log('[admin login success] role=', auth.state.role, 'token=', data.token?.slice(0, 20))
      ElMessage.success('登录成功')
      
      const redirect = route.query.redirect
      const defaultRoute = '/admin/dashboard'
      if (redirect && typeof redirect === 'string') {
        const allowedPrefixes = ['/admin', '/report']
        const isValidRedirect = allowedPrefixes.some(prefix => redirect.startsWith(prefix))
        if (isValidRedirect) {
          router.push(redirect)
        } else {
          router.push(defaultRoute)
        }
      } else {
        router.push(defaultRoute)
      }
    } else {
      ElMessage.error(response.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('网络错误或用户名密码错误')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #F8FAF9 0%, #EDF5F3 40%, #E8EEED 70%, #DDE9E7 100%);
}

.login-box {
  width: 380px;
  background: #FFFFFF;
  padding: 48px 40px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(45, 90, 122, 0.08);
  border: 1px solid #E8EEED;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-icon {
  font-size: 52px;
  margin-bottom: 14px;
}

.login-header h2 {
  margin: 0 0 8px 0;
  color: #2D5A7A;
  font-size: 24px;
  font-weight: 600;
}

.login-subtitle {
  color: #8BA4C4;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-bottom: 18px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  border-color: #E8EEED;
  box-shadow: none;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #B6DDDC;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(182, 221, 220, 0.3);
}

.login-form :deep(.el-button) {
  height: 44px;
  font-size: 15px;
  border-radius: 12px;
}

.login-submit-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
}
</style>