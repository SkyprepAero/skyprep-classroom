import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

export function PublicRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}

