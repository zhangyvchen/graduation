import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../stores/auth'
import studentRoutes from './student'

const routes = [
  ...studentRoutes,
  {
    path: '/',
    component: () => import('../layouts/StudentLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'growth',
        name: 'Growth',
        component: () => import('../views/GrowthTrajectory.vue')
      },
      {
        path: 'destination',
        name: 'Destination',
        component: () => import('../views/DestinationMap.vue')
      },
      {
        path: 'learning',
        name: 'Learning',
        component: () => import('../views/LearningProfile.vue')
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('../views/ReportDownload.vue')
      },
      {
        path: 'my-report',
        name: 'MyReport',
        component: () => import('../views/AdminStudentReport.vue'),
        meta: { requiresAuth: true, role: 'student' }
      },
      {
        path: 'ending',
        name: 'Ending',
        component: () => import('../views/FooterEnding.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'GuestLogin',
    component: () => import('../views/StudentLogin.vue')
  },
  {
    path: '/postcard-share',
    name: 'PostcardShare',
    component: () => import('../views/PostcardShareView.vue')
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/AdminLogin.vue')
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/AdminDashboard.vue')
      },
      {
        path: 'batch',
        name: 'AdminBatch',
        component: () => import('../views/AdminBatch.vue')
      },
      {
        path: 'student',
        name: 'AdminStudent',
        component: () => import('../views/AdminStudent.vue')
      },
      {
        path: 'search',
        name: 'AdminGlobalSearch',
        component: () => import('../views/AdminGlobalSearch.vue')
      },
      {
        path: 'statistics',
        name: 'AdminStatistics',
        component: () => import('../views/AdminStatistics.vue')
      },
      {
        path: 'template',
        name: 'AdminTemplate',
        component: () => import('../views/AdminTemplate.vue')
      },
      {
        path: 'ai',
        name: 'AdminAI',
        component: () => import('../views/AdminAI.vue')
      },
      {
        path: 'ai-history',
        name: 'AdminAiHistory',
        component: () => import('../views/AdminAiHistory.vue')
      },
      {
        path: 'ai-risk',
        name: 'AdminAiRisk',
        component: () => import('../views/AdminAiRisk.vue')
      },
      {
        path: 'import',
        name: 'AdminImport',
        component: () => import('../views/AdminImport.vue')
      },
      {
        path: 'verify',
        name: 'AdminVerify',
        component: () => import('../views/AdminVerify.vue')
      },
      {
        path: 'message',
        name: 'AdminMessage',
        component: () => import('../views/AdminMessage.vue')
      },
      {
        path: 'permission',
        name: 'AdminPermission',
        component: () => import('../views/AdminPermission.vue')
      },
      {
        path: 'report/:year',
        name: 'AdminReport',
        component: () => import('../views/AdminReport.vue')
      },
      {
        path: 'student-report/:studentId',
        name: 'AdminStudentReport',
        component: () => import('../views/AdminStudentReport.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 管理员路由权限映射 - 定义每个路由需要的权限模块
const adminRoutePermissions = {
  '/admin/dashboard': 'dashboard',
  '/admin/batch': 'batch',
  '/admin/student': 'student',
  '/admin/search': 'student',  // 全局搜索需要学生管理权限
  '/admin/statistics': 'statistics',
  '/admin/template': 'template',
  '/admin/verify': 'verify',
  '/admin/import': 'import',
  '/admin/message': 'message',
  '/admin/permission': 'permission',
  '/admin/ai': 'ai',
  '/admin/ai-history': 'ai',
  '/admin/ai-risk': 'ai',
}

router.beforeEach((to, from, next) => {
  const auth = useAuth()
  const currentRole = auth.state.role?.toUpperCase()

  // ★ 进入登录页时记录来源路径（不记录登录页之间的跳转）
  // 但如果来源是管理后台的受限页面，则不记录（登录后直接跳首页）
  if ((to.path === '/login' || to.path === '/admin/login')
      && from.path && from.path !== '/login' && from.path !== '/admin/login') {
    // 如果是管理员登录页，检查来源是否是需要特殊权限的页面
    if (to.path === '/admin/login' && from.path.startsWith('/admin/')) {
      // 只记录到dashboard，不记录受限页面
      sessionStorage.setItem('login_return_path', '/admin/dashboard')
    } else {
      sessionStorage.setItem('login_return_path', from.fullPath)
    }
  }

  if (to.path === '/admin/login' || to.path === '/login') {
    next()
    return
  }

  if (to.path.startsWith('/student/') && to.path !== '/login') {
    if (!auth.state.isLoggedIn || currentRole !== 'STUDENT') {
      next('/login')
      return
    }
  }

  // Allow students to access their own report pages
  if (to.path.startsWith('/admin/student-report/') && auth.state.isLoggedIn && currentRole === 'STUDENT') {
    const studentId = to.params.studentId
    const currentStudentId = auth.state.user?.studentId || localStorage.getItem('student_id')
    
    if (studentId === currentStudentId) {
      next()
      return
    }
  }

  if (to.meta.requiresAuth) {
    if (!auth.state.isLoggedIn) {
      if (to.meta.role?.toUpperCase() === 'ADMIN') {
        next('/admin/login')
      } else {
        next('/login')
      }
      return
    }

    if (to.meta.role && !['ADMIN', 'ASSISTANT'].includes(currentRole) && currentRole !== to.meta.role.toUpperCase()) {
      next('/')
      return
    }
  }

  // ★ 已登录用户访问管理后台时的权限检查
  if (auth.state.isLoggedIn && (currentRole === 'ADMIN' || currentRole === 'ASSISTANT')) {
    if (to.path.startsWith('/admin/')) {
      // 超级管理员可以访问所有页面
      if (currentRole === 'ADMIN') {
        next()
        return
      }
      
      // 协助管理员需要检查权限
      const requiredPermission = adminRoutePermissions[to.path]
      if (requiredPermission) {
        // 从sessionStorage获取权限列表
        const permissionsStr = sessionStorage.getItem('admin_permissions')
        let permissions = []
        if (permissionsStr) {
          try {
            permissions = JSON.parse(permissionsStr)
          } catch (e) {
            console.error('解析权限失败:', e)
          }
        }
        
        const hasPermission = permissions.some(p => p.module === requiredPermission)
        if (!hasPermission) {
          // 没有权限，跳转到首页
          next('/admin/dashboard')
          return
        }
      }
    }
  }

  // ★ 登录页（/login 学生登录、/admin/login 管理员登录）始终可进入，不做"已登录自动跳走"反向逻辑
  // 这样已登录用户也能主动进入登录页选择退出/换号，行为完全由用户点击触发
  if (auth.state.isLoggedIn && currentRole === 'STUDENT') {
    // 学生已登录访问 /admin/* 时阻断（防止学生误入管理后台）
    if (to.path.startsWith('/admin')) {
      if (to.path.startsWith('/admin/student-report/')) {
        const studentId = to.params.studentId
        const currentStudentId = auth.state.user?.studentId || localStorage.getItem('student_id')

        if (studentId === currentStudentId) {
          next()
          return
        } else {
          next('/')
          return
        }
      }
      next('/')
      return
    }
  }

  next()
})

export default router
