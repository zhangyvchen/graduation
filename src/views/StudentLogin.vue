<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="login-icon">🎓</div>
        <h2>学生登录</h2>
        <p class="login-subtitle">请使用学号和密码登录系统</p>
      </div>
      
      <el-form :model="loginForm" ref="loginFormRef" label-width="80px" class="login-form">
        <el-form-item label="学号">
          <el-input 
            v-model="loginForm.studentId" 
            placeholder="请输入学号" 
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%" :loading="isLoading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <a href="#" class="forgot-password">忘记密码？</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../stores/auth'
import { studentLogin } from '../api/student'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const loginForm = ref({
  studentId: '',
  password: ''
})

const isLoading = ref(false)

const handleLogin = async () => {
  if (!loginForm.value.studentId || !loginForm.value.password) {
    ElMessage.warning('请输入学号和密码')
    return
  }

  isLoading.value = true
  try {
    // 调用后端学生登录接口
    const res = await studentLogin({
      studentId: loginForm.value.studentId,
      password: loginForm.value.password
    })

    if (res.code === 200) {
      const data = res.data
      // 保存 token
      localStorage.setItem('student_token', data.token)
      localStorage.setItem('student_id', data.studentId)

      // 保存完整用户信息（Layout.vue 依赖这个）
      const userInfo = {
        studentId: data.studentId,
        name: data.name,
        className: data.className,
        batchYear: data.batchYear,
        major: data.major,
        college: data.college,
        role: 'student'
      }
      localStorage.setItem('student_info', JSON.stringify(userInfo))

      // 更新 auth store
      auth.login(userInfo)

      ElMessage.success('登录成功')
      // 跳转到学生个人中心，如果有redirect参数则跳转到指定页面
      const redirect = route.query.redirect || '/student/profile'
      router.push(redirect)
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (err) {
    console.error('登录错误:', err)
    ElMessage.error('登录失败：' + (err.message || '网络错误'))
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  background: #fff;
  padding: 45px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
}

.login-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.login-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.login-subtitle {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.login-form :deep(.el-button) {
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}

.login-footer {
  text-align: center;
}

.forgot-password {
  color: #667eea;
  font-size: 14px;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}
</style>
