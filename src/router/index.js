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

  if (auth.state.isLoggedIn && currentRole === 'STUDENT') {
    if (to.path === '/login') {
      next('/student/verify')
      return
    }
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

  if (auth.state.isLoggedIn && currentRole === 'ADMIN') {
    if (to.path === '/login') {
      next('/admin/dashboard')
      return
    }
  }

  if (auth.state.isLoggedIn && currentRole === 'ASSISTANT') {
    if (to.path === '/login') {
      next('/admin/dashboard')
      return
    }
    if (to.path.startsWith('/admin')) {
      next()
      return
    }
  }

  next()
})

export default router
