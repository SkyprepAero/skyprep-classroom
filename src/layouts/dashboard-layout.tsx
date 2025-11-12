import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { useAuthStore } from '@/stores/auth-store'

export function DashboardLayout() {
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(true)

  useEffect(() => {
    setIsTransitioning(true)
    const timeout = window.setTimeout(() => {
      setIsTransitioning(false)
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-background">
      <LottieLoader
        isVisible={isTransitioning}
        overlay
        size="small"
        message="Loading your classroom..."
        className="text-primary"
      />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar onLogout={logout} />
        <main className="flex-1 bg-muted/20 p-4 md:p-6">
          <div className="mx-auto h-full max-w-6xl">
            <div
              key={location.pathname}
              className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

