<template>
  <div class="login-container">
    <div class="login-box">
      <h2>管理后台登录</h2>
      <el-form :model="loginForm" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const auth = useAuth()
const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    alert('请输入用户名和密码')
    return
  }
  
  auth.login({
    username: loginForm.value.username,
    name: loginForm.value.username,
    role: 'admin'
  })
  
  router.push('/admin/dashboard')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-box h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
</style>