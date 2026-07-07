import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
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
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminLogin.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboard.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router