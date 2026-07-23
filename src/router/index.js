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

router.beforeEach((to, from, next) => {
  const auth = useAuth()
  const currentRole = auth.state.role?.toUpperCase()

  // ★ 进入登录页时记录来源路径（不记录登录页之间的跳转）
  // 登录成功后登录页会读 sessionStorage.login_return_path 跳回原页面
  if ((to.path === '/login' || to.path === '/admin/login')
      && from.path && from.path !== '/login' && from.path !== '/admin/login') {
    sessionStorage.setItem('login_return_path', from.fullPath)
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
