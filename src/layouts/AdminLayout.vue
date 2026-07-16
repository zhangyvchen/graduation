<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">📊</div>
        <div class="logo-text">管理后台</div>
      </div>
      <el-menu 
        :default-active="activeMenu" 
        class="sidebar-menu" 
        :router="true"
        background-color="#1a1a2e"
        text-color="#a0aec0"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/admin/dashboard">
          <template #icon>
            <span class="menu-icon">🏠</span>
          </template>
          管理首页
        </el-menu-item>
        <el-menu-item index="/admin/batch">
          <template #icon>
            <span class="menu-icon">📋</span>
          </template>
          批次管理
        </el-menu-item>
        <el-menu-item index="/admin/student">
          <template #icon>
            <span class="menu-icon">👥</span>
          </template>
          名单管理
        </el-menu-item>
        <el-menu-item index="/admin/statistics">
          <template #icon>
            <span class="menu-icon">📈</span>
          </template>
          数据统计
        </el-menu-item>
        <el-menu-item index="/admin/template">
          <template #icon>
            <span class="menu-icon">📝</span>
          </template>
          报告模板配置
        </el-menu-item>

        <el-menu-item index="/admin/import">
          <template #icon>
            <span class="menu-icon">📥</span>
          </template>
          数据导入
        </el-menu-item>

        <el-menu-item index="/admin/verify">
          <template #icon>
            <span class="menu-icon">📱</span>
          </template>
          扫码核销
        </el-menu-item>

        <el-menu-item index="/admin/message">
          <template #icon>
            <span class="menu-icon">💬</span>
          </template>
          留言审核
          <el-badge
              v-if="pendingMessageCount > 0"
              :value="pendingMessageCount"
              :max="99"
              class="menu-badge"
          />
        </el-menu-item>

      </el-menu>
      <div class="sidebar-footer">
        <div class="user-info" v-if="auth.state.user">
          <span class="user-name">{{ auth.state.user.name }}</span>
          <span class="user-role">管理员</span>
        </div>
        <el-button size="small" @click="goToHome" style="width: 100%; margin-bottom: 8px;">返回首页</el-button>
        <el-button size="small" @click="showChangePasswordDialog = true" style="width: 100%; margin-bottom: 8px;">修改密码</el-button>
        <el-button size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>

    <el-dialog title="修改密码" v-model="showChangePasswordDialog" width="400px" :close-on-click-modal="false">
      <el-form :model="changePasswordForm" label-width="80px">
        <el-form-item label="旧密码">
          <el-input v-model="changePasswordForm.oldPassword" type="password" placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="changePasswordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="changePasswordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="isChanging">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuth } from '../stores/auth'
import { changePassword, getPendingMessageCount } from '../api/admin'


const router = useRouter()
const auth = useAuth()

const activeMenu = computed(() => router.currentRoute.value.path)

// 留言待审核数（轮询，每 30s 拉一次）
const pendingMessageCount = ref(0)
let pollTimer = null
const refreshPendingCount = async () => {
  if (!auth.state.isLoggedIn) return
  try {
    const res = await getPendingMessageCount()
    if (res.code === 200) pendingMessageCount.value = res.data || 0
  } catch (e) { /* 忽略 */ }
}
onMounted(() => {
  refreshPendingCount()
  pollTimer = setInterval(refreshPendingCount, 30000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

const showChangePasswordDialog = ref(false)
const isChanging = ref(false)
const changePasswordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const handleLogout = () => {
    auth.logout()
    router.push('/')
}

const goToHome = () => {
    window.open('/','_blank')
}


const handleChangePassword = async () => {
  if (!changePasswordForm.value.oldPassword || !changePasswordForm.value.newPassword || !changePasswordForm.value.confirmPassword) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (changePasswordForm.value.newPassword !== changePasswordForm.value.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }
  if (changePasswordForm.value.newPassword.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }

  isChanging.value = true

  try {
    const response = await changePassword({
      username: auth.state.user?.username,
      oldPassword: changePasswordForm.value.oldPassword,
      newPassword: changePasswordForm.value.newPassword
    })

    if (response.code === 200) {
      ElMessage.success('密码修改成功，请使用新密码登录')
      auth.logout()
      showChangePasswordDialog.value = false
      changePasswordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      router.push('/admin/login')
    } else {
      ElMessage.error(response.message || '密码修改失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    isChanging.value = false
  }
}


</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
}

.sidebar-logo {
  padding: 25px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.sidebar-menu {
  flex: 1;
  padding: 15px 0;
}

.sidebar-menu :deep(.el-menu) {
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  margin: 5px 10px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}
.sidebar-menu :deep(.el-menu-item):before {
    content: '';
position: absolute;
left: 0;
top: 0;
width: 3px;
height: 100%;
background: linear-gradient(180deg, #667eea, #764ba2);
transform: scaleY(0);
transition: transform 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(102, 126, 234, 0.2);
    transform: translateX(6px);
    box-shadow: 0 2px 12px rgba(102,126,234,0.15);
}

.sidebar-menu :deep(.el-menu-item:hover)::before {
    transform: scaleY(1);
}

.sidebar-menu :deep(.el-menu-item:hover .menu-icon) {
    transform: scale(1.25) rotate(-5deg);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.sidebar-menu :deep(.el-menu-item.is-active .menu-icon) {
    animation: icon-bounce 0.5s ease;
}

@keyframes icon-bounce {
    0% { transform: scale(1); }
    30% { transform: scale(1.3) rotate(10deg); }
    60% { transform: scale(0.95) rotate(-5deg); }
    100% { transform: scale(1) rotate(0); }
}
.menu-icon {
  font-size: 18px;
  margin-right: 10px;
    display: inline-block;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.menu-badge {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.user-role {
  font-size: 12px;
  color: #a0aec0;
  margin-top: 4px;
}

.sidebar-footer :deep(.el-button) {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 20px;
    box-sizing: border-box;
    min-width: 0;
}

.sidebar-footer :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
