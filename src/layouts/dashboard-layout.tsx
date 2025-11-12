import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuthStore } from '@/stores/auth-store'

export function DashboardLayout() {
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar onLogout={logout} />
        <main className="flex-1 bg-muted/20 p-4 md:p-6">
          <div className="mx-auto h-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

