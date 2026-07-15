import { reactive } from 'vue'

const STORAGE_KEY = 'graduation_auth'

const loadFromStorage = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load auth state:', e)
  }
  return {
    isLoggedIn: false,
    user: null,
    role: null
  }
}

const savedState = loadFromStorage()

const state = reactive({
  isLoggedIn: savedState.isLoggedIn,
  user: savedState.user,
  role: savedState.role
})

const saveToStorage = () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      isLoggedIn: state.isLoggedIn,
      user: state.user,
      role: state.role
    }))
  } catch (e) {
    console.error('Failed to save auth state:', e)
  }
}

export const useAuth = () => {
  const login = (userData) => {
    state.isLoggedIn = true
    state.user = userData
    state.role = userData.role || 'student'
    saveToStorage()
  }

  const logout = () => {
    state.isLoggedIn = false
    state.user = null
    state.role = null
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem('student_token')
    localStorage.removeItem('student_info')
  }

  const isAdmin = () => {
    return state.role?.toUpperCase() === 'ADMIN'
  }

  const isStudent = () => {
    return state.role?.toUpperCase() === 'STUDENT'
  }

  return {
    state,
    login,
    logout,
    isAdmin,
    isStudent
  }
}

export default state