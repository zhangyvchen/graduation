import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 5000
})

request.interceptors.request.use(
  (config) => {
    const auth = localStorage.getItem('graduation_auth')
    if (auth) {
      const authData = JSON.parse(auth)
      if (authData.user && authData.user.token) {
        config.headers.Authorization = `Bearer ${authData.user.token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

export default request