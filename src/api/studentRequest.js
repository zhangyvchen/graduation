import axios from 'axios'

const studentRequest = axios.create({
  baseURL: '/api',
  timeout: 30000
})

studentRequest.interceptors.request.use(config => {
  const token = localStorage.getItem('student_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

studentRequest.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('student_token')
      localStorage.removeItem('student_info')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default studentRequest
