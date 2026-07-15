<template>
  <div class="layout">
    <!-- 动态渐变背景 -->
    <div class="bg-layer">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
      <div class="bg-grid"></div>
    </div>

    <!-- 毛玻璃侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-mark">
          <span>🎓</span>
        </div>
        <div class="logo-text">
          <h2>学生中心</h2>
          <small>Student Portal</small>
        </div>
      </div>

      <el-menu :default-active="activeMenu" router class="menu">
        <el-menu-item index="/student/profile">
          <el-icon><component :is="User" /></el-icon>
          <span>个人总览</span>
        </el-menu-item>
        <el-menu-item index="/student/grade">
          <el-icon><component :is="DataLine" /></el-icon>
          <span>成绩画像</span>
        </el-menu-item>
        <el-menu-item index="/student/achievement">
          <el-icon><component :is="Trophy" /></el-icon>
          <span>成就中心</span>
        </el-menu-item>
        <el-menu-item index="/student/comparison">
          <el-icon><component :is="TrendCharts" /></el-icon>
          <span>横向对比</span>
        </el-menu-item>
        <el-menu-item index="/student/timeline">
          <el-icon><component :is="Clock" /></el-icon>
          <span>成长轨迹</span>
        </el-menu-item>
        <el-menu-item index="/student/message">
          <el-icon><component :is="ChatLineRound" /></el-icon>
          <span>母校留言</span>
        </el-menu-item>
        <el-menu-item index="/student/verify">
          <el-icon><component :is="FullScreen" /></el-icon>
          <span>扫码核销</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="version">v1.0 · 2026 Graduation</div>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main">
      <header class="header">
        <div class="header-left">
          <div class="title">{{ currentTitle }}</div>
          <div class="subtitle">{{ currentSubtitle }}</div>
        </div>
        <div class="header-right">
          <div class="clock">
            <div class="clock-time">{{ currentTime }}</div>
            <div class="clock-date">{{ currentDate }}</div>
          </div>
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              <el-avatar :size="38" :src="userInfo.avatar || defaultAvatar">
                {{ userInfo.name?.charAt(0) }}
              </el-avatar>
              <div class="user-meta">
                <div class="user-name-text">{{ userInfo.name }}</div>
                <div class="user-id">{{ userInfo.studentId }}</div>
              </div>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordDialog" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, DataLine, Trophy, TrendCharts, Clock, ChatLineRound, FullScreen } from '@element-plus/icons-vue'
import { changePassword } from '@/api/student'
import { useAuth } from '@/stores/auth'

let lastMoveTime = 0

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const userInfo = ref({})
const passwordDialog = ref(false)
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const activeMenu = computed(() => route.path)

const titles = {
  '/student/profile': '个人总览',
  '/student/grade': '成绩画像',
  '/student/achievement': '成就中心',
  '/student/comparison': '横向对比',
  '/student/timeline': '成长轨迹',
  '/student/message': '母校留言',
  '/student/verify': '扫码核销'
}
const subtitles = {
  '/student/profile': '欢迎回来 · 你的成长一目了然',
  '/student/grade': '用数据看懂你的学业轨迹',
  '/student/achievement': '每一次荣誉，都值得被记住',
  '/student/comparison': '看清自己的位置',
  '/student/timeline': '属于你的大学时光',
  '/student/message': '给母校留下你的心声',
  '/student/verify': '毕业周边 · 等你领取'
}
const currentTitle = computed(() => titles[route.path] || '学生中心')
const currentSubtitle = computed(() => subtitles[route.path] || '')

// 实时时钟
const currentTime = ref('')
const currentDate = ref('')
let timer = null
function updateClock() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  currentTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  currentDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${w}`
}

onMounted(() => {
  const info = localStorage.getItem('student_info')
  if (info) userInfo.value = JSON.parse(info)
  updateClock()
  timer = setInterval(updateClock, 1000)

  // 鼠标视差
  document.addEventListener('mousemove', handleMouseMove)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('mousemove', handleMouseMove)
})

function handleMouseMove(e) {
  // 节流：每 80ms 更新一次背景位置，避免 60fps mousemove 触发频繁重排
  const now = performance.now()
  if (now - lastMoveTime < 80) return
  lastMoveTime = now
  const x = (e.clientX / window.innerWidth - 0.5) * 30
  const y = (e.clientY / window.innerHeight - 0.5) * 30
  document.documentElement.style.setProperty('--mx', `${x}px`)
  document.documentElement.style.setProperty('--my', `${y}px`)
}

const handleCommand = async (cmd) => {
  if (cmd === 'password') {
    passwordForm.value = {oldPassword: '', newPassword: '', confirmPassword: ''}
    passwordDialog.value = true
  } else if (cmd === 'logout') {
    await ElMessageBox.confirm('确定退出登录?', '提示', {type: 'warning'})
    localStorage.removeItem('student_token')
    localStorage.removeItem('student_info')
    auth.logout()
    router.push('/student/login')
  }
}

const submitPassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    return ElMessage.warning('请填写完整')
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    return ElMessage.error('两次密码不一致')
  }
  if (passwordForm.value.newPassword.length < 6) {
    return ElMessage.warning('密码至少6位')
  }
  try {
    const res = await changePassword({
      studentId: userInfo.value.studentId,
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      passwordDialog.value = false
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error('修改失败')
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #e0f2fe 0%, #ecfdf5 100%);
}

/* ============= 动态背景 ============= */
.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  transition: transform 0.6s ease-out;
  will-change: transform;
}
.orb-1 {
  width: 480px; height: 480px;
  background: radial-gradient(circle, #0ea5e9, transparent 70%);
  top: -120px; left: -120px;
  animation: float1 14s ease-in-out infinite;
}
.orb-2 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, #10b981, transparent 70%);
  bottom: -160px; right: -120px;
  animation: float2 16s ease-in-out infinite;
}
.orb-3 {
  width: 380px; height: 380px;
  background: radial-gradient(circle, #a78bfa, transparent 70%);
  top: 40%; left: 55%;
  animation: float3 18s ease-in-out infinite;
  opacity: 0.35;
}
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(calc(var(--mx, 0) * 1.5), calc(var(--my, 0) * 1.5)) scale(1.08); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(calc(var(--mx, 0) * -1.2), calc(var(--my, 0) * -1.2)) scale(1.05); }
}
@keyframes float3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(calc(var(--mx, 0) * 0.8), calc(var(--my, 0) * 0.8)) scale(1.1); }
}
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}

/* ============= 毛玻璃侧边栏 ============= */
.sidebar {
  width: 240px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(14, 165, 233, 0.08);
  z-index: 10;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 20px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.12);
}
.logo-mark {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0ea5e9, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35);
}
.logo-text h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #0369a1, #047857);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.logo-text small {
  color: #64748b;
  font-size: 11px;
  letter-spacing: 1px;
}
.menu {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 10px;
}
:deep(.el-menu-item) {
  border-radius: 12px !important;
  margin: 4px 0;
  height: 46px;
  line-height: 46px;
  color: #475569;
  font-weight: 500;
  transition: all 0.25s ease;
}
:deep(.el-menu-item:hover) {
  background: rgba(14, 165, 233, 0.1) !important;
  color: #0369a1;
  transform: translateX(4px);
}
:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #0ea5e9, #10b981) !important;
  color: #fff !important;
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35);
}
:deep(.el-menu-item.is-active .el-icon) {
  color: #fff !important;
}
:deep(.el-menu-item .el-icon) {
  color: #0ea5e9;
  font-size: 18px;
}
.sidebar-footer {
  padding: 16px 20px;
  text-align: center;
  border-top: 1px solid rgba(14, 165, 233, 0.1);
}
.version {
  font-size: 11px;
  color: #94a3b8;
  letter-spacing: 1px;
}

/* ============= 主体 ============= */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
  min-width: 0;
}

/* ============= 毛玻璃顶栏 ============= */
.header {
  height: 72px;
  margin: 16px 16px 0;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(14, 165, 233, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left .title {
  font-size: 19px;
  font-weight: 700;
  background: linear-gradient(135deg, #0369a1, #047857);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.header-left .subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 18px;
}
.clock {
  text-align: right;
  padding: 6px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(16, 185, 129, 0.1));
  border: 1px solid rgba(14, 165, 233, 0.15);
}
.clock-time {
  font-size: 16px;
  font-weight: 700;
  color: #0369a1;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}
.clock-date {
  font-size: 11px;
  color: #64748b;
}
.user-name {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 10px;
  transition: background 0.2s;
}
.user-name:hover {
  background: rgba(14, 165, 233, 0.08);
}
.user-meta { line-height: 1.3; }
.user-name-text {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.user-id {
  font-size: 11px;
  color: #94a3b8;
}

.content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  position: relative;
}
</style>
