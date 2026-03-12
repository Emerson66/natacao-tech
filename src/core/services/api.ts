import axios, { type InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

function limparSessao() {
  localStorage.removeItem('user')
  localStorage.removeItem('role')
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  delete api.defaults.headers.common['Authorization']
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 40_000,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryConfig
    const status = error.response?.status

    if (status === 403) {
      const errorMsg =
        error.response?.data?.mensagem ||
        error.response?.data?.message ||
        'Você não tem permissão para realizar esta ação.'
      window.dispatchEvent(new CustomEvent('api-error', { detail: errorMsg }))
      return Promise.reject(error)
    }

    const endpointsIgnorados = ['/auth/login', '/auth/refresh', '/auth/logout']
    const isUrlIgnorada = endpointsIgnorados.some((url) =>
      config.url?.includes(url)
    )

    if (status === 401 && !isUrlIgnorada) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (config.headers && typeof config.headers.set === 'function') {
              config.headers.set('Authorization', `Bearer ${token}`)
            } else {
              config.headers!.Authorization = `Bearer ${token}`
            }
            return api(config)
          })
          .catch((err) => Promise.reject(err))
      }

      const currentRefreshToken = localStorage.getItem('refreshToken')

      if (!currentRefreshToken) {
        limparSessao()
        if (router.currentRoute.value.path !== '/login') router.push('/login')
        return Promise.reject(new Error('Refresh Token ausente'))
      }

      isRefreshing = true

      try {
        const refreshResponse = await axios.post(
          '/auth/refresh',
          { refreshToken: currentRefreshToken },
          { baseURL: api.defaults.baseURL }
        )

        const newToken = refreshResponse.data.token
        const newRefreshToken = refreshResponse.data.refreshToken

        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${newToken}`)
        } else {
          config.headers!.Authorization = `Bearer ${newToken}`
        }

        processQueue(null, newToken)
        return api(config)
      } catch (refreshError) {
        processQueue(refreshError, null)
        limparSessao()
        if (router.currentRoute.value.path !== '/login') router.push('/login')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const isTimeout =
      error.code === 'ECONNABORTED' || error.message?.includes('timeout')
    const isNetworkError = !error.response && error.code !== 'ERR_CANCELED'

    if ((isTimeout || isNetworkError) && config) {
      config._retryCount = (config._retryCount ?? 0) + 1
      if (config._retryCount <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        return api(config)
      }
    }

    return Promise.reject(error)
  }
)

export default api
