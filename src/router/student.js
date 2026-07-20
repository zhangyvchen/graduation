import Layout from '@/views/student/Layout.vue'

export default [
  {
    path: '/student',
    component: Layout,
    redirect: '/student/profile',
    children: [
      {
        path: 'profile',
        name: 'StudentProfile',
        component: () => import('@/views/student/Profile.vue'),
        meta: { title: '个人总览', requireStudentAuth: true }
      },
      {
        path: 'grade',
        name: 'StudentGrade',
        component: () => import('@/views/student/Grade.vue'),
        meta: { title: '成绩画像', requireStudentAuth: true }
      },
      {
        path: 'achievement',
        name: 'StudentAchievement',
        component: () => import('@/views/student/Achievement.vue'),
        meta: { title: '成就中心', requireStudentAuth: true }
      },
      {
        path: 'comparison',
        name: 'StudentComparison',
        component: () => import('@/views/student/Comparison.vue'),
        meta: { title: '横向对比', requireStudentAuth: true }
      },
      {
        path: 'timeline',
        name: 'StudentTimeline',
        component: () => import('@/views/student/Timeline.vue'),
        meta: { title: '成长轨迹', requireStudentAuth: true }
      },
      {
        path: 'message',
        name: 'StudentMessage',
        component: () => import('@/views/student/Message.vue'),
        meta: { title: '母校留言', requireStudentAuth: true }
      },
      {
        path: 'verify',
        name: 'StudentVerify',
        component: () => import('@/views/student/Verify.vue'),
        meta: { title: '扫码核销', requireStudentAuth: true }
      }
    ]
  }
]
