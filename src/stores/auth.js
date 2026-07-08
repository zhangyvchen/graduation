import { reactive } from 'vue'

const STORAGE_KEY = 'graduation_auth'

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
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
    localStorage.removeItem(STORAGE_KEY)
  }

  const isAdmin = () => {
    return state.role === 'admin'
  }

  const isStudent = () => {
    return state.role === 'student'
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