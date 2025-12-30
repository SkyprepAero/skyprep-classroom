import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar, SIDEBAR_STORAGE_KEY } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { useAuthStore } from '@/stores/auth-store'

export function DashboardLayout() {
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timeout = window.setTimeout(() => {
      setIsTransitioning(false)
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [location.pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  const handleToggleSidebar = () => {
    // On mobile, toggle the mobile sidebar visibility
    // On desktop, toggle the collapsed state
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev)
    } else {
      setIsSidebarCollapsed((prev) => !prev)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <LottieLoader
        isVisible={isTransitioning}
        overlay
        size="small"
        message="Loading your classroom..."
        className="text-primary"
      />
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onLogout={logout}
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            <div
              key={location.pathname}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

