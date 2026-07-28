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
  // ★ 关键修复：与 stores/auth.js 保持一致，优先从 localStorage 读
  // auth.login() 写入的 STORAGE_KEY='graduation_auth' 主要存到 localStorage
  // 旧代码读 localStorage('token' / 'student_token')，与写入位置脱节导致 401
  let role = null
  let authData = null
  try {
    // 主存储在 localStorage（持久化，关闭 tab 后仍可恢复登录态）
    authData = localStorage.getItem('graduation_auth')
    // 兜底：兼容旧 sessionStorage 登录态
    if (!authData) {
      authData = sessionStorage.getItem('graduation_auth')
    }
    if (authData) {
      const parsed = JSON.parse(authData)
      token = parsed?.user?.token
      role = parsed?.role
    }
  } catch (e) {
    console.error('[request] 解析 auth 存储失败:', e)
  }

  // 兜底：兼容旧 localStorage 里的 token（清理期使用，过渡后删掉）
  if (!token) {
    if (pathname.startsWith('/student') || config.url?.includes('/student/')) {
      token = localStorage.getItem('student_token')
    } else {
      token = localStorage.getItem('token')
    }
  }

  // ★ 公共接口（登录、注册、核销等）不应携带 token，避免旧/过期 token 干扰
  const publicUrlPatterns = [
    '/admin/login',
    '/student/login',
    '/student/auth/login',
    '/student/auth/register',
    '/admin/reset-password',
    '/verify/'
  ]
  const isPublicUrl = publicUrlPatterns.some(p => config.url?.startsWith(p))
  if (token && !isPublicUrl) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  // ★ 诊断：每个请求打印 token 状态 + 路径，便于定位"为什么 401/403"
  if (config.url?.includes('/admin/verify/') || config.url?.includes('/admin/student/') || config.url === '/admin/login') {
    console.log('[request]', config.method?.toUpperCase(), config.url, 'token=' + (token ? token.slice(0, 20) + '...' : 'NULL'), 'role=' + (role || '?'), 'sendAuth=' + (!isPublicUrl && !!token))
  }

  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    // 调试：打印 401/403 详细信息
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('[request error]', error.response.status, error.config?.url,
        'token=', localStorage.getItem('token')?.slice(0, 20),
        'resp=', typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
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