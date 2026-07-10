import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../stores/auth'

const routes = [
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
        path: '/growth',
        name: 'Growth',
        component: () => import('../views/GrowthTrajectory.vue')
      },
      {
        path: '/destination',
        name: 'Destination',
        component: () => import('../views/DestinationMap.vue')
      },
      {
        path: '/learning',
        name: 'Learning',
        component: () => import('../views/LearningProfile.vue')
      },
      {
        path: '/report',
        name: 'Report',
        component: () => import('../views/ReportDownload.vue')
      },
      {
        path: '/verify',
        name: 'Verify',
        component: () => import('../views/QRCodeVerification.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/ending',
        name: 'Ending',
        component: () => import('../views/FooterEnding.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'StudentLogin',
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
        path: 'verify',
        name: 'AdminVerify',
        component: () => import('../views/QRCodeVerification.vue')
      },
      {
        path: 'ai',
        name: 'AdminAI',
        component: () => import('../views/AdminAI.vue')
      },
      {
        path: 'import',
        name: 'AdminImport',
        component: () => import('../views/AdminImport.vue')
      },
      {
        path: 'report/:year',
        name: 'AdminReport',
        component: () => import('../views/AdminReport.vue')
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
  
  if (to.path === '/admin/login') {
    next()
    return
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
    
    if (to.meta.role && currentRole !== to.meta.role.toUpperCase()) {
      if (currentRole === 'ADMIN') {
        next('/admin/dashboard')
      } else {
        next('/')
      }
      return
    }
  }
  
  if (auth.state.isLoggedIn && currentRole === 'STUDENT') {
    if (to.path === '/login') {
      next('/verify')
      return
    }
    if (to.path.startsWith('/admin')) {
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
  
  next()
})

export default router