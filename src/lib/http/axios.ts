import axios from 'axios'

import { API_TIMEOUT, API_URL, API_VERSION } from '@/config/api'
import { authStore } from '@/stores/auth-store'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean
    showLoadingOverlay?: boolean
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

let activeOverlayRequests = 0
const loadingListeners = new Set<(isVisible: boolean) => void>()

export function subscribeLoadingOverlay(listener: (isVisible: boolean) => void) {
  loadingListeners.add(listener)
  return () => loadingListeners.delete(listener)
}

function notifyLoadingOverlay() {
  const isVisible = activeOverlayRequests > 0
  loadingListeners.forEach((listener) => listener(isVisible))
}

axiosInstance.interceptors.request.use((config) => {
  if (config.showLoadingOverlay) {
    activeOverlayRequests += 1
    notifyLoadingOverlay()
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.config?.showLoadingOverlay) {
      activeOverlayRequests = Math.max(0, activeOverlayRequests - 1)
      notifyLoadingOverlay()
    }

    const status = error.response?.status

    if (status === 401 && !error.config?.skipAuthRefresh) {
      authStore.clear()
    }

    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config?.showLoadingOverlay) {
      activeOverlayRequests = Math.max(0, activeOverlayRequests - 1)
      notifyLoadingOverlay()
    }
    return response
  },
  (error) => Promise.reject(error),
)

export default axiosInstance

