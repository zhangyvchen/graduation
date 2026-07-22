<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-decor">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="login-wrapper">
      <!-- 左侧品牌区 -->
      <div class="brand-panel">
        <div class="brand-inner">
          <div class="brand-logo">
            <div class="logo-circle">
              <span>🎓</span>
            </div>
            <div class="logo-pulse"></div>
          </div>
          <h1 class="brand-title">毕业生数据报告系统</h1>
          <p class="brand-subtitle">Graduation Data Report Platform</p>
          <p class="brand-desc">回顾成长足迹 · 珍藏校园记忆 · 启航美好未来</p>

          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">📈</div>
              <div class="feature-text">
                <div class="feature-title">成长轨迹</div>
                <div class="feature-desc">记录大学四年的每一次进步</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📚</div>
              <div class="feature-text">
                <div class="feature-title">学业画像</div>
                <div class="feature-desc">多维度展示你的学习成果</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🌟</div>
              <div class="feature-text">
                <div class="feature-title">校友寄语</div>
                <div class="feature-desc">为母校留下你独特的祝福</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🎁</div>
              <div class="feature-text">
                <div class="feature-title">毕业纪念</div>
                <div class="feature-desc">生成专属你的毕业报告</div>
              </div>
            </div>
          </div>

          <div class="brand-footer">
            © 2026 Graduation Data Report · 用心记录每一段青春
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-panel">
        <div class="form-card">
          <div class="form-header">
            <h2>欢迎回来 👋</h2>
            <p>请使用学号和密码登录，开启你的毕业之旅</p>
          </div>

          <el-form :model="loginForm" ref="loginFormRef" class="login-form" size="large">
            <el-form-item>
              <el-input
                  v-model="loginForm.studentId"
                  placeholder="请输入学号"
                  @keyup.enter="handleLogin"
                  clearable
              >
                <template #prefix>
                  <span class="input-icon">🆔</span>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <span class="input-icon">🔒</span>
                </template>
                <template #suffix>
                  <span class="toggle-eye" @click="showPassword = !showPassword">
                    {{ showPassword ? '🙈' : '👁️' }}
                  </span>
                </template>
              </el-input>
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住学号</el-checkbox>
              <a class="forgot-link" @click="showTipDialog = true">忘记密码？</a>
            </div>

            <el-button
                type="primary"
                class="login-btn"
                @click="handleLogin"
                :loading="isLoading"
            >
              <span v-if="!isLoading">登 录</span>
              <span v-else>登录中...</span>
            </el-button>

            <div class="quick-fill">
              <span class="quick-label">没账号？试试：</span>
              <el-button link type="primary" @click="fillDemo" class="demo-btn">
                🎯 一键填充 demo 账号
              </el-button>
              <span class="quick-divider">|</span>
              <el-button link type="primary" @click="goAdmin" class="demo-btn">
                🛡️ 管理员登录
              </el-button>
            </div>

            <div class="form-footer">
              <span>登录即表示您同意</span>
              <a>《用户协议》</a>
              <span>和</span>
              <a>《隐私政策》</a>
            </div>
          </el-form>
        </div>

        <div class="form-side-tip">
          💡 初始密码：<b>123456</b>，登录后请及时修改
        </div>
      </div>
    </div>

    <!-- 忘记密码提示弹窗 -->
    <el-dialog v-model="showTipDialog" title="忘记密码" width="380px" :show-close="true">
      <p style="line-height: 1.8; color: #606266;">
        如忘记密码，请联系所在学院辅导员或管理员重置。<br>
        📞 客服电话：<b>400-xxx-xxxx</b><br>
        📧 邮箱：<b>support@school.edu</b>
      </p>
      <template #footer>
        <el-button type="primary" @click="showTipDialog = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
const showPassword = ref(false)
const rememberMe = ref(true)
const showTipDialog = ref(false)

onMounted(() => {
  // 自动回填上次的学号
  const saved = localStorage.getItem('remember_student_id')
  if (saved) loginForm.value.studentId = saved
})

const handleLogin = async () => {
  if (!loginForm.value.studentId.trim() || !loginForm.value.password.trim()) {
    ElMessage.warning('请输入学号和密码')
    return
  }

  isLoading.value = true
  try {
    const res = await studentLogin({
      studentId: loginForm.value.studentId.trim(),
      password: loginForm.value.password
    })

    if (res.code === 200) {
      const data = res.data
      // 清理可能残留的管理员 token，避免 student 登录后 admin token 污染学生请求
      localStorage.removeItem('token')
      localStorage.setItem('student_token', data.token)
      localStorage.setItem('student_id', data.studentId)

      // 记住学号
      if (rememberMe.value) {
        localStorage.setItem('remember_student_id', data.studentId)
      } else {
        localStorage.removeItem('remember_student_id')
      }

      const userInfo = {
        studentId: data.studentId,
        name: data.name,
        className: data.className,
        batchYear: data.batchYear,
        major: data.major,
        college: data.college,
        avatar: data.avatar || '',
        role: 'student'
      }
      localStorage.setItem('student_info', JSON.stringify(userInfo))
      auth.login(userInfo)

      ElMessage.success(`欢迎回来，${data.name}！`)
      
      // 处理跳转逻辑：优先跳转 redirect 参数指定的页面
      const redirect = route.query.redirect
      if (redirect && typeof redirect === 'string') {
        router.push(redirect)
      } else {
        router.push('/student/profile')
      }
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

const fillDemo = () => {
  loginForm.value.studentId = '20192500001'
  loginForm.value.password = '123456'
  ElMessage.info('已填充 demo 账号，点击"登录"即可')
}

const goAdmin = () => {
  router.push('/admin/login')
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* ===== 背景装饰 ===== */
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: float 12s ease-in-out infinite;
}
.orb-1 {
  width: 400px; height: 400px;
  background: #fbc2eb;
  top: -100px; left: -100px;
}
.orb-2 {
  width: 500px; height: 500px;
  background: #a18cd1;
  bottom: -150px; right: -150px;
  animation-delay: -4s;
}
.orb-3 {
  width: 300px; height: 300px;
  background: #ffecd2;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -8s;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(40px, -30px) scale(1.05); }
  66%      { transform: translate(-30px, 40px) scale(0.95); }
}
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* ===== 主布局 ===== */
.login-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  max-width: 1080px;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

/* ===== 左侧品牌区 ===== */
.brand-panel {
  flex: 1.1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.brand-panel::before {
  content: '';
  position: absolute;
  top: -50%; right: -30%;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}
.brand-panel::after {
  content: '';
  position: absolute;
  bottom: -30%; left: -20%;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.3) 0%, transparent 70%);
  border-radius: 50%;
}
.brand-inner {
  position: relative;
  z-index: 1;
}

.brand-logo {
  position: relative;
  width: 80px; height: 80px;
  margin-bottom: 24px;
}
.logo-circle {
  width: 80px; height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
  backdrop-filter: blur(10px);
  position: relative; z-index: 1;
}
.logo-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  animation: pulse 2.5s ease-out infinite;
}
@keyframes pulse {
  0%   { transform: scale(1);   opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}
.brand-subtitle {
  font-size: 14px;
  opacity: 0.7;
  margin: 0 0 16px 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.brand-desc {
  font-size: 16px;
  opacity: 0.9;
  margin: 0 0 36px 0;
  line-height: 1.6;
}

.feature-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}
.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}
.feature-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.feature-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}
.feature-desc {
  font-size: 12px;
  opacity: 0.7;
  line-height: 1.4;
}
.brand-footer {
  font-size: 12px;
  opacity: 0.5;
  text-align: center;
  letter-spacing: 0.5px;
}

/* ===== 右侧表单区 ===== */
.form-panel {
  flex: 1;
  padding: 60px 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}
.form-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.form-header {
  margin-bottom: 32px;
}
.form-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}
.form-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
  line-height: 1.6;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}
.login-form :deep(.el-input__wrapper) {
  padding: 4px 12px;
  border-radius: 10px;
  background: #f5f7fa;
  box-shadow: 0 0 0 1px #e4e7ed inset;
  transition: all 0.3s;
}
.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
  background: #fff;
}
.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #667eea inset, 0 0 0 4px rgba(102, 126, 234, 0.1);
  background: #fff;
}
.input-icon {
  font-size: 18px;
  margin-right: 4px;
}
.toggle-eye {
  font-size: 18px;
  cursor: pointer;
  user-select: none;
  padding: 4px;
  transition: transform 0.2s;
}
.toggle-eye:hover { transform: scale(1.15); }

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.forgot-link {
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}
.forgot-link:hover { text-decoration: underline; }

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(102, 126, 234, 0.55);
}
.login-btn:active {
  transform: translateY(0);
}

.quick-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 16px;
  font-size: 13px;
}
.quick-label { color: #909399; }
.demo-btn { font-size: 13px; }
.quick-divider {
  color: #dcdfe6;
  margin: 0 4px;
  user-select: none;
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: #909399;
}
.form-footer a {
  color: #667eea;
  text-decoration: none;
  margin: 0 2px;
}
.form-footer a:hover { text-decoration: underline; }

.form-side-tip {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: #909399;
  padding: 10px 16px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  border: 1px dashed rgba(102, 126, 234, 0.3);
}
.form-side-tip b { color: #667eea; }

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
    max-width: 420px;
  }
  .brand-panel {
    padding: 32px 24px;
  }
  .feature-list {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }
  .brand-desc { display: none; }
  .form-panel { padding: 32px 24px; }
}
</style>
