import { useMemo } from 'react'
import {
  faBookOpen,
  faCalendar,
  faCalendarCheck,
  faClock,
  faHouse,
  faLayerGroup,
  faRightFromBracket,
  faVideo,
  faUserGraduate,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import lightLogo from '@/assets/logo.png'
import darkLogo from '@/assets/skyprep-logo-dark.png'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { notifySuccess } from '@/lib/notifications'
import { getTeacherSessionRequests } from '@/features/sessions/api/session-api'

export const SIDEBAR_STORAGE_KEY = 'skyprep-sidebar-collapsed'

interface SidebarProps {
  isCollapsed: boolean
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const { theme } = useTheme()
  const logoSrc = theme === 'dark' ? darkLogo : lightLogo
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const enrollmentType = user?.enrollmentType || null
  // Check if user is a teacher by primaryRole name or by roles array
  const isTeacher = useMemo(() => {
    if (!user) return false
    // Handle primaryRole as object (new format) or string (old format)
    const primaryRoleName = typeof user.primaryRole === 'string' 
      ? user.primaryRole 
      : user.primaryRole?.name
    if (primaryRoleName?.toLowerCase() === 'teacher') return true
    // Check roles array (case-insensitive)
    if (user.roles?.some(role => {
      const roleName = typeof role === 'string' ? role : role.name
      return roleName?.toLowerCase() === 'teacher'
    })) return true
    return false
  }, [user])
  const widthClasses = useMemo(() => (isCollapsed ? 'w-24' : 'w-72'), [isCollapsed])
  const labelVisibilityClasses = useMemo(
    () => (isCollapsed ? 'max-w-0 opacity-0' : 'max-w-full opacity-100'),
    [isCollapsed],
  )

  // Fetch pending session requests count for teachers
  const { data: pendingRequestsData } = useQuery({
    queryKey: ['teacherPendingRequestsCount'],
    queryFn: () => getTeacherSessionRequests({
      page: 1,
      limit: 1, // We only need to know if there are any, but API requires limit
      status: 'requested',
    }),
    enabled: isTeacher,
    refetchInterval: 30000, // Refetch every 30 seconds to keep count updated
  })

  const pendingRequestsCount = pendingRequestsData?.data?.pagination?.totalItems || 0
  const hasPendingRequests = pendingRequestsCount > 0

  // Build navigation items based on enrollment type
  const navigation = useMemo(() => {
    const baseNav = [
      {
        label: 'Overview',
        icon: faHouse,
        to: '/app',
      },
    ]

    // Show Calendar for teachers and enrolled students (second position)
    if (isTeacher || enrollmentType === 'focusOne' || enrollmentType === 'cohort') {
      baseNav.push({
        label: 'My Calendar',
        icon: faCalendar,
        to: '/app/calendar',
      })
    }

    baseNav.push({
      label: 'Test Series',
      icon: faLayerGroup,
      to: '/app/test-series',
    })

    // Add enrollment-specific navigation for students
    if (!isTeacher) {
      if (enrollmentType === 'focusOne') {
        baseNav.push({
          label: 'Focus One',
          icon: faUserGraduate,
          to: '/app/focus-one',
        })
      } else if (enrollmentType === 'cohort') {
        baseNav.push({
          label: 'Cohort',
          icon: faUsers,
          to: '/app/cohort',
        })
      }
    } else {
      // For teachers, show Focus One and Cohort links
      baseNav.push(
        {
          label: 'Focus One',
          icon: faUserGraduate,
          to: '/app/teacher/focus-ones',
        },
        {
          label: 'Cohort',
          icon: faUsers,
          to: '/app/teacher/cohorts',
        }
      )
    }

    // Only show Live Sessions and Assignments if user is enrolled in Focus One or Cohort
    if (enrollmentType === 'focusOne' || enrollmentType === 'cohort') {
      baseNav.push(
        {
          label: 'Live Sessions',
          icon: faVideo,
          to: '/app/live-sessions',
        },
        { 
          label: 'Assignments',
          icon: faClock,
          to: '/app/assignments',
        }
      )
    }

    // Add Resources (available to all)
    baseNav.push({
      label: 'Resources',
      icon: faBookOpen,
      to: '/app/resources',
    })

    // Add Session Requests for teachers
    if (isTeacher) {
      baseNav.push({
        label: 'Session Requests',
        icon: faCalendarCheck,
        to: '/app/session-requests',
        badge: hasPendingRequests ? pendingRequestsCount : undefined,
      })
    }

    return baseNav
  }, [enrollmentType, isTeacher, hasPendingRequests, pendingRequestsCount])

  const handleLogout = () => {
    logout()
    notifySuccess('You have been logged out.', 'See you soon!')
  }

  return (
    <aside
      className={cn(
        'relative hidden flex-col border-r border-border bg-gradient-to-b from-background via-background/90 to-muted/30 shadow-lg transition-[width] duration-300 ease-in-out md:flex overflow-hidden',
        widthClasses,
      )}
    >
        <div className="flex-shrink-0 mb-6 mx-4 mt-4 flex items-center rounded-xl border border-border/60 bg-gradient-to-r from-background/80 via-background/70 to-muted/40 px-3 py-3 shadow-sm backdrop-blur">
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

        <div className="relative flex flex-1 flex-col overflow-y-auto px-4">
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
                <div className="relative">
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={cn(
                      'h-4 w-4 transition-transform duration-150 ease-out group-hover:scale-110 group-hover:text-foreground',
                    )}
                  />
                  {item.badge && isCollapsed && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
                  )}
                </div>
                <span
                  className={cn(
                    'whitespace-nowrap transition-all duration-300 ease-out',
                    labelVisibilityClasses,
                  )}
                >
                  {item.label}
                </span>
                {item.badge && !isCollapsed && (
                  <Badge 
                    variant="destructive" 
                    className={cn(
                      'ml-auto h-5 min-w-5 px-1.5 text-xs flex items-center justify-center transition-all duration-300 ease-out',
                      labelVisibilityClasses,
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
                {isCollapsed ? (
                  <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 rounded-md border border-border/60 bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-all duration-150 group-hover:translate-x-2 group-hover:opacity-100">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

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

