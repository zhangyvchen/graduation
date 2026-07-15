<template>
  <div class="admin-layout">
    <div class="sidebar-wrapper" :class="{ collapsed: isCollapsed }">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <div class="logo-icon">📊</div>
            <div class="logo-text">管理后台</div>
          </div>
        </div>
        <el-menu 
          :default-active="activeMenu" 
          class="sidebar-menu" 
          :router="true"
          background-color="#FFFFFF"
          text-color="#2D5A7A"
          active-text-color="#2D5A7A"
          :collapse="false"
        >
          <el-menu-item index="/admin/dashboard">
            <template #icon>
              <span class="menu-icon">🏠</span>
            </template>
            <template #title>管理首页</template>
          </el-menu-item>
          <el-menu-item index="/admin/batch">
            <template #icon>
              <span class="menu-icon">📋</span>
            </template>
            <template #title>批次管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/student">
            <template #icon>
              <span class="menu-icon">👥</span>
            </template>
            <template #title>名单管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/statistics">
            <template #icon>
              <span class="menu-icon">📈</span>
            </template>
            <template #title>数据统计</template>
          </el-menu-item>
          <el-menu-item index="/admin/template">
            <template #icon>
              <span class="menu-icon">📝</span>
            </template>
            <template #title>报告模板配置</template>
          </el-menu-item>
          <el-menu-item index="/admin/verify">
            <template #icon>
              <span class="menu-icon">✅</span>
            </template>
            <template #title>核销管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/import">
            <template #icon>
              <span class="menu-icon">📥</span>
            </template>
            <template #title>数据导入</template>
          </el-menu-item>
        </el-menu>
        <div class="sidebar-footer">
          <div class="user-info" v-if="auth.state.user">
            <span class="user-name">{{ auth.state.user.name }}</span>
            <span class="user-role">管理员</span>
          </div>
          <div class="footer-buttons">
            <el-button @click="goToHome">返回首页</el-button>
            <el-button @click="showChangePasswordDialog = true">修改密码</el-button>
            <el-button type="danger" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </aside>
    </div>
    <div class="sidebar-toggle-container" :class="{ collapsed: isCollapsed }" :style="{ top: isCollapsed ? toggleTop + '%' : '50%' }">
      <div class="sidebar-toggle" @click="toggleCollapse" @mousedown="handleMouseDown">
        <span class="toggle-icon">{{ isCollapsed ? '▶' : '◀' }}</span>
      </div>
    </div>
    <main class="main-content" :class="{ 'sidebar-collapsed': isCollapsed }">
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuth } from '../stores/auth'
import { changePassword } from '../api/admin'

const router = useRouter()
const auth = useAuth()

const activeMenu = computed(() => router.currentRoute.value.path)
const isCollapsed = ref(false)
const toggleTop = ref(50)
const isDragging = ref(false)
const dragStartY = ref(0)
const dragStartTop = ref(0)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  if (!isCollapsed.value) {
    toggleTop.value = 50
  }
}

const handleMouseDown = (e) => {
  e.preventDefault()
  isDragging.value = true
  dragStartY.value = e.clientY
  dragStartTop.value = toggleTop.value
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  
  const deltaY = e.clientY - dragStartY.value
  const viewportHeight = window.innerHeight
  const buttonHeight = 36
  const margin = 20
  
  let newTop = dragStartTop.value + (deltaY / viewportHeight) * 100
  
  newTop = Math.max(margin / viewportHeight * 100, newTop)
  newTop = Math.min((viewportHeight - buttonHeight - margin) / viewportHeight * 100, newTop)
  
  toggleTop.value = newTop
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

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
  window.open('/', '_blank')
}

const handleChangePassword = async () => {
  if (changePasswordForm.value.newPassword !== changePasswordForm.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  isChanging.value = true
  try {
    await changePassword(changePasswordForm.value)
    ElMessage.success('密码修改成功')
    showChangePasswordDialog.value = false
    changePasswordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    isChanging.value = false
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #F8FAF9;
  position: relative;
  overflow: hidden;
}

.sidebar-wrapper {
  width: 220px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 99;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-wrapper.collapsed {
  width: 0;
  opacity: 0;
  pointer-events: none;
}

.sidebar {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  color: #2D5A7A;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 20px rgba(45, 90, 122, 0.08);
  overflow-y: auto;
  border-radius: 0 16px 16px 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  border-bottom: 1px solid #E8EEED;
  position: relative;
  z-index: 20;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 26px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #2D5A7A;
}

.sidebar-menu {
  flex: 1;
  padding: 12px 6px;
  position: relative;
  z-index: 20;
}

.sidebar-menu :deep(.el-menu) {
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  margin: 4px 4px;
  border-radius: 12px;
  height: 44px;
  line-height: 44px;
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: #EDF5F3;
  border-radius: 12px;
  transform: translateX(5px);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #B6DDDC;
  color: #2D5A7A;
  border-radius: 12px;
  font-weight: 500;
}

.menu-icon {
  font-size: 18px;
  margin-right: 10px;
}

.sidebar-footer {
  padding: 12px 14px 20px;
  border-top: 1px solid #E8EEED;
  margin-top: auto;
  position: relative;
  z-index: 20;
  box-sizing: border-box;
  width: 100%;
}

.footer-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EEED;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #2D5A7A;
}

.user-role {
  font-size: 12px;
  color: #8BA4C4;
  margin-top: 3px;
}

.sidebar-footer :deep(.el-button) {
  width: 100%;
  max-width: 170px;
  background: #EDF5F3;
  color: #2D5A7A;
  border: 1px solid #E8EEED;
  border-radius: 10px;
  font-size: 13px;
  padding: 9px 14px;
  height: auto;
  line-height: 1.4;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(45, 90, 122, 0.06);
}

.sidebar-footer :deep(.el-button:hover) {
  background: #B6DDDC;
  border-color: #B6DDDC;
  transform: translateX(6px) scale(1.03);
  box-shadow: 0 4px 16px rgba(182, 221, 220, 0.4);
}

.sidebar-footer :deep(.el-button:active) {
  transform: translateX(3px) scale(0.98);
  box-shadow: 0 2px 8px rgba(45, 90, 122, 0.06);
}

.sidebar-footer :deep(.el-button--danger) {
  background: rgba(232, 160, 160, 0.1);
  color: #E8A0A0;
  border-color: rgba(232, 160, 160, 0.3);
}

.sidebar-footer :deep(.el-button--danger:hover) {
  background: rgba(232, 160, 160, 0.2);
  transform: translateX(6px) scale(1.03);
  box-shadow: 0 4px 16px rgba(232, 160, 160, 0.3);
}

.sidebar-footer :deep(.el-button--danger:active) {
  transform: translateX(3px) scale(0.98);
  box-shadow: 0 2px 8px rgba(232, 160, 160, 0.1);
}

.sidebar-toggle-container {
  position: fixed;
  left: 234px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  transition: left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sidebar-toggle-container.collapsed {
  left: 12px;
}

.sidebar-toggle {
  width: 36px;
  height: 36px;
  background: #2D5A7A;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 3px 10px rgba(45, 90, 122, 0.25);
  user-select: none;
  -webkit-user-select: none;
}

.sidebar-toggle:hover {
  transform: scale(1.15);
  box-shadow: 0 5px 15px rgba(45, 90, 122, 0.35);
}

.sidebar-toggle-container.collapsed .sidebar-toggle {
  cursor: move;
  cursor: -webkit-grab;
}

.sidebar-toggle-container.collapsed .sidebar-toggle:active {
  cursor: grabbing;
  transform: scale(1.2);
  box-shadow: 0 8px 25px rgba(45, 90, 122, 0.45);
}

.toggle-icon {
  font-size: 14px;
  font-weight: bold;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  margin-left: 220px;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.sidebar-collapsed {
  margin-left: 0;
}

.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #D1E8E6;
  border-radius: 2px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #B6DDDC;
}

</style>