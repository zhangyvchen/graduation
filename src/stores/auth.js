import { reactive } from 'vue'

const state = reactive({
  isLoggedIn: false,
  user: null,
  role: null
})

export const useAuth = () => {
  const login = (userData) => {
    state.isLoggedIn = true
    state.user = userData
    state.role = userData.role || 'student'
  }

  const logout = () => {
    state.isLoggedIn = false
    state.user = null
    state.role = null
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