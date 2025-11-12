import axios from 'axios'

import { API_TIMEOUT, API_URL, API_VERSION } from '@/config/api'
import { authStore } from '@/stores/auth-store'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean
  }
}

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-Version': API_VERSION,
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = authStore.getToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    if (status === 401 && !error.config?.skipAuthRefresh) {
      authStore.clear()
    }

    return Promise.reject(error)
  },
)

export default axiosInstance

