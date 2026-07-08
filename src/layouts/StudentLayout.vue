<template>
  <div class="student-layout">
    <header class="header">
      <div class="logo">毕业数据报告系统</div>
      <nav class="nav">
        <router-link to="/" :class="{ active: $route.path === '/' }">首页</router-link>
        <router-link to="/growth" :class="{ active: $route.path === '/growth' }">成长轨迹</router-link>
        <router-link to="/destination" :class="{ active: $route.path === '/destination' }">去向地图</router-link>
        <router-link to="/learning" :class="{ active: $route.path === '/learning' }">学习画像</router-link>
        <router-link to="/report" :class="{ active: $route.path === '/report' }">报告下载</router-link>
        <router-link to="/verify" :class="{ active: $route.path === '/verify' }">扫码核销</router-link>
      </nav>
      <div class="user-info" v-if="auth.state.isLoggedIn">
        <span>{{ auth.state.user.name }}</span>
        <el-button size="small" @click="handleLogout">退出</el-button>
      </div>
      <div v-else class="auth-btns">
        <router-link to="/login" class="login-btn">学生登录</router-link>
        <router-link to="/admin/login" class="admin-btn">管理后台</router-link>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const auth = useAuth()

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.student-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav a {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  transition: opacity 0.3s;
}

.nav a:hover,
.nav a.active {
  opacity: 0.8;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #fff;
}

.auth-btns {
  display: flex;
  gap: 12px;
}

.login-btn {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: background 0.3s;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.admin-btn {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 20px;
  background: rgba(102, 126, 234, 0.8);
  border-radius: 20px;
  transition: background 0.3s;
}

.admin-btn:hover {
  background: rgba(102, 126, 234, 1);
}

.main-content {
  flex: 1;
  padding: 40px;
}
</style>