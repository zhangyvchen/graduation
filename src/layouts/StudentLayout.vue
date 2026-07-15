<template>
  <div class="student-layout">
    <!-- ========== 顶部导航 ========== -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">毕业数据报告系统</span>
        </div>
      </div>

      <nav class="header-nav">
        <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
          <span>🏠</span> 首页
        </router-link>
        <router-link to="/growth" class="nav-link" :class="{ active: $route.path === '/growth' }">
          <span>📈</span> 成长轨迹
        </router-link>
        <router-link to="/destination" class="nav-link" :class="{ active: $route.path === '/destination' }">
          <span>🗺️</span> 去向地图
        </router-link>
        <router-link to="/learning" class="nav-link" :class="{ active: $route.path === '/learning' }">
          <span>📚</span> 学习画像
        </router-link>
        <router-link to="/report" class="nav-link" :class="{ active: $route.path === '/report' }">
          <span>📄</span> 报告下载
        </router-link>
        <router-link to="/ending" class="nav-link" :class="{ active: $route.path === '/ending' }">
          <span>💬</span> 毕业纪念
        </router-link>
      </nav>

      <div class="header-right">
        <!-- 已登录 -->
        <el-dropdown v-if="auth.state.isLoggedIn" trigger="click">
          <span class="user-info">
            <span class="user-avatar">👤</span>
            <span>{{ auth.state.user?.name || '用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="auth.isAdmin()" @click="router.push('/admin/dashboard')">返回管理首页</el-dropdown-item>
              <el-dropdown-item v-if ="auth.isStudent()" @click="router.push('/verify')">我的报告</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 未登录 -->
        <template v-else>
          <router-link to="/login" class="auth-btn login-btn">学生登录</router-link>
          <router-link to="/admin/login" class="auth-btn admin-btn">管理后台</router-link>
        </template>
      </div>
    </header>

    <!-- ========== 主内容 ========== -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- ========== 尾页 Footer ========== -->
    <footer class="footer">
      <div class="footer-content">
        <!-- 院长寄语 -->
        <div class="footer-section">
          <h4>🎓 院长寄语</h4>
          <div class="footer-message" v-html="footerData.deanMessage || '愿你们以梦为马，不负韶华。在未来的道路上，保持学习的热情，坚守初心的力量，成为社会的栋梁之才。'"></div>
          <span class="footer-author">—— 院长</span>
        </div>

        <!-- 校友寄语 -->
        <div class="footer-section">
          <h4>🌟 校友寄语</h4>
          <div class="footer-message" v-html="footerData.alumniMessage || '毕业不是终点，而是新的起点。感谢母校的培养，愿学弟学妹们在更广阔的天地中绽放光彩。'"></div>
          <span class="footer-author">—— 校友代表</span>
        </div>

        <!-- 未来展望 -->
        <div class="footer-section">
          <h4>🚀 未来展望</h4>
          <div class="footer-message" v-html="footerData.futureMessage || '愿每一位毕业生都能在时代的浪潮中找准方向，用智慧和汗水书写属于自己的精彩篇章。'"></div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} 毕业数据报告系统 | 数据来源于学工/教务/就业系统</span>
        <span>技术支持：毕业数据报告项目组</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { ArrowDown } from '@element-plus/icons-vue'
import { getTemplateList } from '../api/template'

const router = useRouter()
const auth = useAuth()

const footerData = ref({
  deanMessage: '',
  alumniMessage: '',
  futureMessage: ''
})

let isMounted = false

const handleLogout = () => {
  auth.logout()
  router.push('/')
}

// 加载尾页数据（从后台配置读取）
const loadFooterData = async () => {
  try {
    const res = await getTemplateList({ type: 'footer' })
    if (isMounted && res.code === 200 && res.data && res.data.length > 0) {
      const footer = res.data.find(t => t.type === 'footer') || res.data[0]
      footerData.value = {
        deanMessage: footer.deanMessage || footerData.value.deanMessage,
        alumniMessage: footer.alumniMessage || footerData.value.alumniMessage,
        futureMessage: footer.futureMessage || footerData.value.futureMessage
      }
    }
  } catch (e) {
    console.log('加载尾页数据失败，使用默认数据')
  }
}

onMounted(() => {
  isMounted = true
  loadFooterData()
})

onUnmounted(() => {
  isMounted = false
})
</script>

<style scoped>
/* ===== 全局布局 ===== */
.student-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

/* ===== 顶部导航 ===== */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}
.logo-icon { font-size: 28px; }
.logo-text { letter-spacing: 1px; }

.header-nav {
  display: flex;
  gap: 4px;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s;
}
.nav-link:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
.nav-link.active {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.3s;
}
.user-info:hover {
  background: rgba(255, 255, 255, 0.15);
}
.user-avatar { font-size: 20px; }

.auth-btn {
  padding: 8px 20px;
  border-radius: 20px;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s;
}
.login-btn {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}
.login-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
.admin-btn {
  color: #fff;
  background: rgba(102, 126, 234, 0.8);
}
.admin-btn:hover {
  background: rgba(102, 126, 234, 1);
}

/* ===== 主内容 ===== */
.main-content {
  flex: 1;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px;
}

/* ===== 尾页 Footer ===== */
.footer {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: rgba(255, 255, 255, 0.85);
  padding: 40px 40px 20px;
  margin-top: 20px;
  flex-shrink: 0;
}
.footer-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto 30px;
}
.footer-section h4 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #fff;
  position: relative;
  padding-bottom: 10px;
}
.footer-section h4::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: #667eea;
  border-radius: 2px;
}
.footer-message {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}
.footer-author {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  max-width: 1200px;
  margin: 0 auto;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .header {
    padding: 0 20px;
    flex-wrap: wrap;
    height: auto;
    padding-top: 10px;
    gap: 10px;
  }
  .header-nav {
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
  }
  .nav-link {
    padding: 4px 10px;
    font-size: 12px;
  }
  .footer-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .main-content {
    padding: 16px;
  }
  .header-right .auth-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
}

@media (max-width: 600px) {
  .header-left .logo-text {
    font-size: 16px;
  }
  .header-nav .nav-link span:first-child {
    display: none;
  }
  .footer {
    padding: 24px 16px 16px;
  }
  .footer-bottom {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>