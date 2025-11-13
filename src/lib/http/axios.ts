import axios from 'axios'

import { API_TIMEOUT, API_URL, API_VERSION } from '@/config/api'
import { SESSION_REVOKED_MESSAGE_STORAGE_KEY } from '@/lib/auth/logout-reasons'
import { notifyError } from '@/lib/notifications'
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

const SESSION_REVOKED_CODE = 'AUTH_1011'
const SESSION_REVOKED_FALLBACK_MESSAGE =
  'You’ve been logged out because your account was accessed elsewhere.'
let lastSessionRevocationNoticeAt = 0
const SESSION_NOTICE_COOLDOWN_MS = 2000

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.config?.showLoadingOverlay) {
      activeOverlayRequests = Math.max(0, activeOverlayRequests - 1)
      notifyLoadingOverlay()
    }

    const status = error.response?.status

    const errorPayload =
      typeof error.response?.data === 'object' && error.response?.data !== null
        ? (error.response.data as {
            error?: { code?: unknown; message?: unknown; [key: string]: unknown }
          })
        : undefined

    const errorCode =
      typeof errorPayload?.error?.code === 'string' ? errorPayload.error.code : undefined
    const errorMessage =
      typeof errorPayload?.error?.message === 'string' ? errorPayload.error.message : undefined

    if (status === 401 && !error.config?.skipAuthRefresh) {
      if (errorCode === SESSION_REVOKED_CODE) {
        const now = Date.now()
        const messageToPersist = errorMessage || SESSION_REVOKED_FALLBACK_MESSAGE
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(SESSION_REVOKED_MESSAGE_STORAGE_KEY, messageToPersist)
          } catch (storageError) {
            console.warn('Unable to store session revocation message', storageError)
          }
        }

        if (now - lastSessionRevocationNoticeAt > SESSION_NOTICE_COOLDOWN_MS) {
          notifyError(errorMessage, SESSION_REVOKED_FALLBACK_MESSAGE)
          lastSessionRevocationNoticeAt = now
        }

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.setTimeout(() => {
            window.location.assign('/login')
          }, 0)
        }
      }
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

