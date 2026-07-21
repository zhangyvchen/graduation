import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Accept': 'application/json;charset=UTF-8',
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

request.interceptors.request.use(config => {
  const pathname = window.location.pathname
  let token
  // 根据当前路由决定用哪个 token，避免 admin token 污染学生请求
  if (pathname.startsWith('/student') || config.url?.includes('/student/')) {
    token = localStorage.getItem('student_token')
  } else {
    // 管理端用 token 键
    token = localStorage.getItem('token')
  }
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    // 调试：打印 401/403 详细信息
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('[request error]', error.response.status, error.config?.url, 'token=', localStorage.getItem('token')?.slice(0, 20))
    }
    if (error.response && error.response.status === 401) {
      const pathname = window.location.pathname
      // 已在登录页时不要重复跳转
      if (pathname === '/admin/login' || pathname === '/student/login' || pathname === '/login') {
        return Promise.reject(error)
      }
      // 区分学生端和管理端
      if (localStorage.getItem('student_token')) {
        localStorage.removeItem('student_token')
        localStorage.removeItem('student_info')
        if (pathname.startsWith('/student')) {
          window.location.href = '/student/login'
        }
      } else {
        if (pathname.startsWith('/admin')) {
          window.location.href = '/admin/login'
        } else if (pathname.startsWith('/student')) {
          window.location.href = '/student/login'
        } else {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default request