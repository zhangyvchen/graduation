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
          @mousemove="handleMenuMouseMove"
          @mouseleave="handleMenuMouseLeave"
        >
          <el-menu-item index="/admin/dashboard" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('dashboard')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">🏠</span>
            </template>
            <template #title>管理首页</template>
          </el-menu-item>
          <el-menu-item index="/admin/batch" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('batch')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">📋</span>
            </template>
            <template #title>批次管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/student" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('student')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">👥</span>
            </template>
            <template #title>名单管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/search" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('student')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">🔍</span>
            </template>
            <template #title>全局搜索</template>
          </el-menu-item>
          <el-menu-item index="/admin/statistics" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('statistics')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">📈</span>
            </template>
            <template #title>数据统计</template>
          </el-menu-item>
          <el-menu-item index="/admin/template" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('template')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">📝</span>
            </template>
            <template #title>报告模板配置</template>
          </el-menu-item>
          <el-menu-item index="/admin/verify" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('verify')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">✅</span>
            </template>
            <template #title>核销管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/import" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('import')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">📥</span>
            </template>
            <template #title>数据导入</template>
          </el-menu-item>
          <el-menu-item index="/admin/message" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" class="menu-item-with-badge" v-if="hasPermission('message')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">💬</span>
            </template>
            <template #title>留言审核</template>
            <span v-if="pendingMessageCount > 0" class="custom-badge">
              {{ pendingMessageCount > 99 ? '99+' : pendingMessageCount }}
            </span>
          </el-menu-item>
          <el-menu-item index="/admin/permission" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('permission')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">🔑</span>
            </template>
            <template #title>权限管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/ai" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('ai')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">🤖</span>
            </template>
            <template #title>AI 助手</template>
          </el-menu-item>
          <el-menu-item index="/admin/ai-history" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('ai')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">📋</span>
            </template>
            <template #title>AI 历史</template>
          </el-menu-item>
          <el-menu-item index="/admin/ai-risk" @mousemove="handleMenuItemMouseMove" @mouseleave="handleMenuItemMouseLeave" v-if="hasPermission('ai')">
            <div class="light-mask"></div>
            <template #icon>
              <span class="menu-icon">🛡️</span>
            </template>
            <template #title>AI 风控</template>
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
            <el-button @click="openSwitchAccount">切换账号</el-button>
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
    <main
      class="main-content"
      :class="{ 'sidebar-collapsed': isCollapsed, 'is-flush': isFlushPage }"
    >
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

    <el-dialog title="切换管理员账号" v-model="showSwitchDialog" width="560px" :close-on-click-modal="false" class="switch-account-dialog">
      <div v-if="!selectedAdmin" class="admin-list">
        <div class="list-tip">请选择要切换到的管理员账号：</div>
        <div 
          v-for="admin in adminList" 
          :key="admin.id" 
          class="admin-item"
          :class="{ current: auth.state.user && admin.username === auth.state.user.username }"
          @click="selectAdmin(admin)"
          @mousemove="handleAdminItemMouseMove"
          @mouseleave="handleAdminItemMouseLeave"
        >
          <div class="light-mask"></div>
          <div class="admin-avatar">
            <span>👤</span>
          </div>
          <div class="admin-info">
            <div class="admin-name">{{ admin.name }}</div>
            <div class="admin-username">@{{ admin.username }}</div>
          </div>
          <div class="admin-right">
            <div class="admin-role-tag">
              <el-tag size="small" :type="admin.role === 'ADMIN' ? 'primary' : 'info'">
                {{ getRoleLabel(admin.role) }}
              </el-tag>
            </div>
            <div v-if="auth.state.user && admin.username === auth.state.user.username" class="current-badge">当前</div>
          </div>
        </div>
      </div>
      <div v-else-if="selectedAdmin" class="selected-admin-card">
        <div class="back-btn" @click="selectedAdmin = null">← 返回选择</div>
        <div class="selected-info">
          <div class="selected-avatar">
            <span>👤</span>
          </div>
          <div class="selected-details">
            <div class="selected-name">{{ selectedAdmin.name }}</div>
            <div class="selected-username">@{{ selectedAdmin.username }}</div>
            <div class="selected-role">
              <el-tag :type="selectedAdmin.role === 'ADMIN' ? 'primary' : 'info'" size="small">
                {{ getRoleLabel(selectedAdmin.role) }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="switch-tip">请确认切换到该管理员账号</div>
      </div>
      <template #footer v-if="selectedAdmin">
        <el-button @click="selectedAdmin = null">取消</el-button>
        <el-button type="primary" @click="handleSwitchAccount" :loading="isSwitching" class="switch-confirm-btn">确认切换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuth } from '../stores/auth'
import { changePassword, getPendingMessageCount, getAdminList, login, getAdminPermissions } from '../api/admin'

const router = useRouter()
const auth = useAuth()

const activeMenu = computed(() => router.currentRoute.value.path)
/** AI 对话页贴边铺满，去掉 main 内边距避免「套一层卡片」 */
const isFlushPage = computed(() => router.currentRoute.value.path === '/admin/ai')
const isCollapsed = ref(false)
const toggleTop = ref(50)
const isDragging = ref(false)
const dragStartY = ref(0)
const dragStartTop = ref(0)

const userPermissions = ref([])

const hasPermission = (module) => {
  if (auth.state.role?.toUpperCase() === 'ADMIN') return true
  return userPermissions.value.some(p => p.module === module)
}

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
const fetchUserPermissions = async () => {
  const userId = auth.state.user?.id
  if (!userId) return
  try {
    const res = await getAdminPermissions(userId)
    if (res.code === 200) {
      userPermissions.value = res.data || []
    }
  } catch (e) {
    console.error('获取权限失败:', e)
  }
}

onMounted(() => {
  refreshPendingCount()
  pollTimer = setInterval(refreshPendingCount, 30000)
  fetchUserPermissions()
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

const handleMenuItemMouseMove = (e) => {
  const menuItem = e.currentTarget
  const mask = menuItem.querySelector('.light-mask')
  if (!mask) return
  
  // 根据菜单项是否激活切换光影颜色
  const isActive = menuItem.classList.contains('is-active')
  const bg = isActive 
    ? 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 70%)'
    : 'radial-gradient(circle, rgba(72, 202, 228, 0.4) 0%, rgba(72, 202, 228, 0.1) 40%, rgba(72, 202, 228, 0) 70%)'
  
  mask.style.background = bg
  mask.style.opacity = '1'
  
  const rect = menuItem.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  mask.style.left = `${x}px`
  mask.style.top = `${y}px`
}

const handleMenuItemMouseLeave = (e) => {
  const mask = e.currentTarget.querySelector('.light-mask')
  if (mask) {
    mask.style.opacity = '0'
  }
}

const handleMenuMouseMove = () => {}
const handleMenuMouseLeave = () => {}

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

const showSwitchDialog = ref(false)
const adminList = ref([])
const selectedAdmin = ref(null)
const isSwitching = ref(false)
const switchForm = ref({
  password: ''
})

const getRoleLabel = (role) => {
  const roleMap = {
    'ADMIN': '超级管理员',
    'ASSISTANT': '协助管理员',
    'assistant': '协助管理员'
  }
  return roleMap[role] || role || '管理员'
}

const openSwitchAccount = async () => {
  showSwitchDialog.value = true
  selectedAdmin.value = null
  switchForm.value.password = ''
  try {
    const res = await getAdminList()
    if (res.code === 200) {
      adminList.value = res.data || []
    }
  } catch (e) {
    ElMessage.error('获取管理员列表失败')
  }
}

const selectAdmin = (admin) => {
  if (auth.state.user && admin.username === auth.state.user.username) {
    ElMessage.info('当前已登录该账号')
    return
  }
  selectedAdmin.value = admin
  switchForm.value.password = ''
}

const handleAdminItemMouseMove = (e) => {
  const item = e.currentTarget
  const mask = item.querySelector('.light-mask')
  if (!mask) return
  const rect = item.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  mask.style.left = `${x}px`
  mask.style.top = `${y}px`
  mask.style.opacity = '1'
}

const handleAdminItemMouseLeave = (e) => {
  const item = e.currentTarget
  const mask = item.querySelector('.light-mask')
  if (!mask) return
  mask.style.opacity = '0'
}

const handleSwitchAccount = async () => {
  auth.logout()
  showSwitchDialog.value = false
  router.push(`/admin/login?username=${encodeURIComponent(selectedAdmin.value.username)}`)
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
  position: relative;
  overflow: hidden;
}

.sidebar-menu :deep(.el-menu-item) .light-mask {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(72, 202, 228, 0.4) 0%, rgba(72, 202, 228, 0.1) 40%, rgba(72, 202, 228, 0) 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease, background 0.3s ease;
  transform: translate(-50%, -50%);
  left: 0;
  top: 0;
  z-index: 10;
  will-change: left, top, opacity;
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

.custom-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  background-color: #F56C6C;
  color: #FFFFFF;
  font-size: 11px;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 10px;
  z-index: 20;
  pointer-events: none;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.4);
  transform: scale(0.9);
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
  min-width: 0;
  min-height: 0;
}

.main-content.sidebar-collapsed {
  margin-left: 0;
}

.main-content.is-flush {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100vh;
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

.switch-account-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #EDF5F3 0%, #F8FAF9 100%);
  padding: 18px 24px;
  border-bottom: 1px solid #E8EEED;
}

.switch-account-dialog :deep(.el-dialog__title) {
  color: #2D5A7A;
  font-weight: 600;
  font-size: 16px;
}

.switch-account-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.switch-account-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #E8EEED;
}

.admin-list .list-tip {
  font-size: 14px;
  color: #5A7A96;
  margin-bottom: 16px;
}

.admin-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
  background: #F8FAF9;
  border: 1px solid #EDF5F3;
}

.admin-item:hover {
  transform: translateX(4px);
  background: #EDF5F3;
  border-color: #B6DDDC;
}

.admin-item.current {
  cursor: default;
  background: #EDF5F3;
  border-color: #B6DDDC;
}

.admin-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B6DDDC 0%, #A3D4D2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 14px;
  flex-shrink: 0;
}

.admin-info {
  flex: 1;
  min-width: 0;
}

.admin-name {
  font-size: 15px;
  font-weight: 500;
  color: #2D5A7A;
  margin-bottom: 3px;
}

.admin-username {
  font-size: 12px;
  color: #8BA4C4;
}

.admin-right {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-role-tag {
  flex-shrink: 0;
}

.current-badge {
  background: #B6DDDC;
  color: #2D5A7A;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.admin-item .light-mask {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(182, 221, 220, 0.6) 0%, rgba(182, 221, 220, 0.25) 30%, rgba(182, 221, 220, 0.1) 50%, rgba(182, 221, 220, 0) 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  transform: translate(-50%, -50%);
  left: 0;
  top: 0;
  z-index: 0;
  will-change: left, top, opacity;
}

.admin-item .admin-avatar,
.admin-item .admin-info,
.admin-item .admin-right {
  position: relative;
  z-index: 1;
}

.selected-admin-card {
  background: #F8FAF9;
  border-radius: 12px;
  padding: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #5A7A96;
  cursor: pointer;
  margin-bottom: 14px;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: #2D5A7A;
}

.selected-info {
  display: flex;
  align-items: center;
}

.selected-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B6DDDC 0%, #A3D4D2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.selected-name {
  font-size: 17px;
  font-weight: 600;
  color: #2D5A7A;
  margin-bottom: 4px;
}

.selected-username {
  font-size: 13px;
  color: #8BA4C4;
  margin-bottom: 8px;
}

.selected-role {
  margin-top: 4px;
}

.switch-tip {
  text-align: center;
  font-size: 13px;
  color: #8BA4C4;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EEED;
}

.switch-confirm-btn {
  background: #B6DDDC !important;
  border-color: #B6DDDC !important;
  color: #2D5A7A !important;
}

.switch-confirm-btn:hover {
  background: #A3D4D2 !important;
  border-color: #A3D4D2 !important;
}

.switch-account-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  font-size: 18px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.switch-account-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  transform: rotate(180deg);
  color: #F56C6C;
}

</style>
