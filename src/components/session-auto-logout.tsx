import { useEffect, useRef } from 'react'

import { useAuthStore } from '@/stores/auth-store'
import { notifyError } from '@/lib/notifications'

export function SessionAutoLogout() {
  const logout = useAuthStore((state) => state.logout)
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasNotifiedRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!isAuthenticated || !tokenExpiresAt) {
      hasNotifiedRef.current = false
      return
    }

    const msUntilExpiry = tokenExpiresAt - Date.now()
    if (msUntilExpiry <= 0) {
      if (!hasNotifiedRef.current) {
        notifyError('Session expired', 'Please sign in again.')
        hasNotifiedRef.current = true
      }
      logout()
      return
    }

    timeoutRef.current = window.setTimeout(() => {
      if (!hasNotifiedRef.current) {
        notifyError('Session expired', 'Please sign in again.')
        hasNotifiedRef.current = true
      }
      logout()
    }, msUntilExpiry)

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isAuthenticated, tokenExpiresAt, logout])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return null
}

