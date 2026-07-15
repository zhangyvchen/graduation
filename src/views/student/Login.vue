<template>
  <div class="login-container">
    <div class="login-bg"></div>
    <div class="login-box">
      <div class="login-header">
        <h1>🎓 毕业生数据报告</h1>
        <p>学生登录</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="studentId">
          <el-input v-model="form.studentId" placeholder="请输入学号" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width: 100%">
            登 录
          </el-button>
        </el-form-item>
        <div class="login-tip">
          <el-alert type="info" :closable="false">
            初始密码为<strong>123456</strong>，首次登录请及时修改
          </el-alert>
        </div>
        <div class="login-footer">
          <a href="/">返回首页</a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { studentLogin } from '@/api/student'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  studentId: '',
  password: ''
})

const rules = {
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await studentLogin(form)
    if (res.code === 200) {
      localStorage.setItem('student_token', res.data.token)
      localStorage.setItem('student_info', JSON.stringify(res.data))
      auth.login(res.data)
      ElMessage.success('登录成功')
      // 首次登录提示改密码
      if (res.data.defaultPassword === 1) {
        ElMessage.warning('您使用的是初始密码,请尽快修改')
      }
      // 如果有回调地址则跳转到回调地址，否则默认进入个人总览
      const redirect = route.query.redirect
      if (redirect && typeof redirect === 'string') {
        router.push(redirect)
      } else {
        router.push('/student/profile')
      }
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  position: relative;
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.login-header { text-align: center; margin-bottom: 30px; }
.login-header h1 { font-size: 24px; color: #303133; margin: 0; }
.login-header p { color: #909399; margin-top: 8px; }
.login-tip { margin-top: 20px; }
.login-footer { text-align: center; margin-top: 20px; }
.login-footer a { color: #409eff; text-decoration: none; }
</style>
