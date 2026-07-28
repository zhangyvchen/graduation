import { reactive } from 'vue'

const STORAGE_KEY = 'graduation_auth'

const loadFromStorage = () => {
  // ★ 关键修复：用 localStorage 而不是 sessionStorage
  //   sessionStorage 在 tab 关闭后清空，导致用户重新打开浏览器就掉登录
  //   localStorage 持久化（除非主动清理），适合登录态
  try {
    // 先从 localStorage 读（主）
    let saved = localStorage.getItem(STORAGE_KEY)
    // 兜底从 sessionStorage 读（兼容旧登录态）
    if (!saved) {
      saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        // 同步到 localStorage，下次从 localStorage 读
        localStorage.setItem(STORAGE_KEY, saved)
      }
    }
    if (saved) {
      const parsed = JSON.parse(saved)
      // 容错：必须有 user 和 token 才算登录
      if (parsed && parsed.user && parsed.user.token) {
        return parsed
      }
    }
  } catch (e) {
    console.error('[auth] Failed to load auth state:', e)
  }
  return {
    isLoggedIn: false,
    user: null,
    role: null
  }
}

const initialState = loadFromStorage()

const state = reactive({
  isLoggedIn: initialState.isLoggedIn,
  user: initialState.user,
  role: initialState.role
})

const saveToStorage = () => {
  try {
    // ★ 改用 localStorage（持久化）
    const data = {
      isLoggedIn: state.isLoggedIn,
      user: state.user,
      role: state.role
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // 同步写一份到 sessionStorage（保留旧逻辑兼容）
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('[auth] Failed to save auth state:', e)
  }
}

export const useAuth = () => {
  const login = (userData) => {
    if (!userData || !userData.token) {
      console.error('[auth] login 失败: 缺少 token, userData=', userData)
      return
    }
    state.isLoggedIn = true
    state.user = userData
    state.role = userData.role || 'student'
    saveToStorage()
    console.log('[auth] login 成功: role=', state.role, ', token 前缀=', userData.token?.slice(0, 20))
  }

  const logout = () => {
    state.isLoggedIn = false
    state.user = null
    state.role = null
    // ★ 同步清理：localStorage（主）+ 旧 key 兜底
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem('student_token')
    localStorage.removeItem('student_info')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('student_token')
    sessionStorage.removeItem('student_info')
  }

  const isAdmin = () => {
    return state.role?.toUpperCase() === 'ADMIN'
  }

  const isStudent = () => {
    return state.role?.toUpperCase() === 'STUDENT'
  }

  const isAssistant = () => {
    return state.role?.toUpperCase() === 'ASSISTANT'
  }

  return {
    state,
    login,
    logout,
    isAdmin,
    isStudent,
    isAssistant
  }
}

export default state
