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
        <el-menu-item index="/admin/verify">
          <template #icon>
            <span class="menu-icon">✅</span>
          </template>
          核销管理
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <div class="user-info" v-if="auth.state.user">
          <span class="user-name">{{ auth.state.user.name }}</span>
          <span class="user-role">管理员</span>
        </div>
        <el-button size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
    <AIFloatButton />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import AIFloatButton from '../components/AIFloatButton.vue'

const router = useRouter()
const auth = useAuth()

const activeMenu = computed(() => router.currentRoute.value.path)

const handleLogout = () => {
  auth.logout()
  router.push('/')
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
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(102, 126, 234, 0.2);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.menu-icon {
  font-size: 18px;
  margin-right: 10px;
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
