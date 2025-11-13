import { useMemo } from 'react'
import {
  faBookOpen,
  faClock,
  faHouse,
  faLayerGroup,
  faRightFromBracket,
  faVideo,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NavLink } from 'react-router-dom'

import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import lightLogo from '@/assets/logo.png'
import darkLogo from '@/assets/skyprep-logo-dark.png'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { notifySuccess } from '@/lib/notifications'

export const SIDEBAR_STORAGE_KEY = 'skyprep-sidebar-collapsed'

const navigation = [
  {
    label: 'Overview',
    icon: faHouse,
    to: '/app',
  },
  {
    label: 'Test Series',
    icon: faLayerGroup,
    to: '/app/test-series',
  },
  {
    label: 'Live Sessions',
    icon: faVideo,
    to: '/app/live-sessions',
  },
  { 
    label: 'Assignments',
    icon: faClock,
    to: '/app/assignments',
  },
  {
    label: 'Resources',
    icon: faBookOpen,
    to: '/app/resources',
  },
]

interface SidebarProps {
  isCollapsed: boolean
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const { theme } = useTheme()
  const logoSrc = theme === 'dark' ? darkLogo : lightLogo
  const logout = useAuthStore((state) => state.logout)
  const widthClasses = useMemo(() => (isCollapsed ? 'w-24' : 'w-72'), [isCollapsed])
  const labelVisibilityClasses = useMemo(
    () => (isCollapsed ? 'max-w-0 opacity-0' : 'max-w-full opacity-100'),
    [isCollapsed],
  )

  const handleLogout = () => {
    logout()
    notifySuccess('You have been logged out.', 'See you soon!')
  }

  return (
    <aside
      className={cn(
        'relative hidden flex-col border-r border-border bg-gradient-to-b from-background via-background/90 to-muted/30 shadow-lg transition-[width] duration-300 ease-in-out md:flex',
        widthClasses,
      )}
    >
        <div className="mb-6 flex items-center rounded-xl border border-border/60 bg-gradient-to-r from-background/80 via-background/70 to-muted/40 px-3 py-3 shadow-sm backdrop-blur">
          <img
            src={logoSrc}
            alt="SkyPrep Classroom"
            className="h-10 w-10 rounded-lg border border-border bg-card object-cover shadow-md transition-transform duration-300 ease-out"
          />
          <div
            className={cn(
              'ml-3 overflow-hidden transition-all duration-300 ease-out',
              labelVisibilityClasses,
            )}
          >
            <div className="text-lg font-semibold text-primary">SkyPrep Classroom</div>
            <p className="text-xs text-muted-foreground">Shaping aviators with precision</p>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col px-4">
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isCollapsed ? 'justify-center' : 'gap-3',
                    isActive
                      ? 'bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30'
                      : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground hover:shadow-sm',
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className={cn(
                    'h-4 w-4 transition-transform duration-150 ease-out group-hover:scale-110 group-hover:text-foreground',
                  )}
                />
                <span
                  className={cn(
                    'whitespace-nowrap transition-all duration-300 ease-out',
                    labelVisibilityClasses,
                  )}
                >
                  {item.label}
                </span>
                {isCollapsed ? (
                  <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 rounded-md border border-border/60 bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-all duration-150 group-hover:translate-x-2 group-hover:opacity-100">
                    {item.label}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur transition-opacity duration-200">
            {!isCollapsed ? (
              <div className="space-y-3 transition-all duration-300 ease-out">
                <p className="text-sm font-semibold text-foreground">Need help?</p>
                <p className="text-xs text-muted-foreground">
                  Join onboarding sessions or review the quick start guide to get up to speed.
                </p>
                <Button variant="outline" className="w-full text-xs">
                  Open guide
                </Button>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center transition-all duration-300 ease-out">
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="h-4 w-4 text-muted-foreground"
                  title="Open guide"
                />
              </div>
            )}
          </div>

          <div className="mt-6 pb-6">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-center gap-2 rounded-lg border border-border/70 bg-background/80 text-sm font-medium text-muted-foreground transition-all hover:border-destructive/40 hover:text-destructive',
                isCollapsed ? 'px-0' : 'px-3',
              )}
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
              <span
                className={cn(
                  'whitespace-nowrap transition-all duration-300 ease-out',
                  labelVisibilityClasses,
                )}
              >
                Sign out
              </span>
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
    </aside>
  )
}

