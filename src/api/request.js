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
  // ★ 关键修复：与 stores/auth.js 保持一致，统一从 sessionStorage 读
  // auth.login() 写入的 STORAGE_KEY='graduation_auth' 存到 sessionStorage
  // 旧代码读 localStorage('token' / 'student_token')，与写入位置脱节导致 401
  try {
    const authData = sessionStorage.getItem('graduation_auth')
    if (authData) {
      const parsed = JSON.parse(authData)
      token = parsed?.user?.token
    }
  } catch (e) {
    console.error('[request] 解析 sessionStorage 失败:', e)
  }

  // 兜底：兼容旧 localStorage 里的 token（清理期使用，过渡后删掉）
  if (!token) {
    if (pathname.startsWith('/student') || config.url?.includes('/student/')) {
      token = localStorage.getItem('student_token')
    } else {
      token = localStorage.getItem('token')
    }
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
      if (pathname === '/admin/login' || pathname === '/login') {
        return Promise.reject(error)
      }
      // ★ 公共页（/、/growth、/destination、/learning、/report、/ending、/postcard-share）
      //   允许未登录访问，后端 401 可能是接口未配置等原因，不应强制跳登录页
      const publicPrefixes = ['/', '/growth', '/destination', '/learning', '/report', '/ending', '/postcard-share']
      const isPublicPage = pathname === '/'
        || publicPrefixes.some(p => p !== '/' && pathname.startsWith(p))
      if (isPublicPage) {
        console.warn('[request] 公共页接口 401，不跳转登录页:', error.config?.url)
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