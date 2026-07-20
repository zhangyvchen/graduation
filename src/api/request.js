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
  const token = localStorage.getItem('token') || localStorage.getItem('student_token')
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
      if (pathname === '/admin/login' || pathname === '/login') {
        return Promise.reject(error)
      }
      if (localStorage.getItem('student_token')) {
        localStorage.removeItem('student_token')
        localStorage.removeItem('student_info')
        if (pathname.startsWith('/student')) {
          window.location.href = '/login'
        }
      } else {
        if (pathname.startsWith('/admin')) {
          window.location.href = '/admin/login'
        } else {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default request