import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { faCheckCircle, faVideo, faCalendar, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useEnrollment } from '@/hooks/use-enrollment'
import { getSessions, getTeacherSessionRequests, type Session } from '@/features/sessions/api/session-api'
import { LottieLoader } from '@/components/ui/lottie-loader'

export function DashboardHomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { enrollment } = useEnrollment()
  
  // Check if user is a teacher
  const isTeacher = useMemo(() => {
    if (!user) return false
    const primaryRoleName = typeof user.primaryRole === 'string' 
      ? user.primaryRole 
      : user.primaryRole?.name
    if (primaryRoleName?.toLowerCase() === 'teacher') return true
    if (user.roles?.some(role => {
      const roleName = typeof role === 'string' ? role : role.name
      return roleName?.toLowerCase() === 'teacher'
    })) return true
    return false
  }, [user])
  
  const enrollmentType = user?.enrollmentType || null
  const showCalendar = isTeacher || enrollmentType === 'focusOne' || enrollmentType === 'cohort'
  const focusOneId = enrollment?.type === 'focusOne' ? enrollment.enrollment.id : null

  // Fetch sessions for students
  const { data: studentSessionsData, isLoading: isLoadingStudentSessions } = useQuery({
    queryKey: ['studentDashboardSessions', focusOneId],
    queryFn: () => {
      const params: { page: number; limit: number; focusOne?: string } = {
        page: 1,
        limit: 100, // Get enough sessions for statistics
      }
      if (focusOneId) {
        params.focusOne = focusOneId
      }
      return getSessions(params)
    },
    enabled: !isTeacher && !!focusOneId,
  })

  // Fetch session requests for teachers
  const { data: teacherRequestsData, isLoading: isLoadingTeacherRequests } = useQuery({
    queryKey: ['teacherDashboardRequests'],
    queryFn: () => getTeacherSessionRequests({
      page: 1,
      limit: 100,
      status: 'requested',
    }),
    enabled: isTeacher,
  })

  // Fetch all sessions for teachers (for statistics)
  const { data: teacherSessionsData, isLoading: isLoadingTeacherSessions } = useQuery({
    queryKey: ['teacherDashboardSessions'],
    queryFn: async () => {
      const statuses: Array<'requested' | 'accepted' | 'scheduled'> = ['requested', 'accepted', 'scheduled']
      const allSessions: Session[] = []
      
      for (const status of statuses) {
        let page = 1
        let hasMore = true
        
        while (hasMore && page <= 5) {
          try {
            const result = await getTeacherSessionRequests({
              page,
              limit: 100,
              status,
            })
            allSessions.push(...result.data.sessions)
            hasMore = result.data.sessions.length === 100
            page++
          } catch (error) {
            hasMore = false
          }
        }
      }
      
      const uniqueSessions = Array.from(
        new Map(allSessions.map(session => [session._id, session])).values()
      )
      
      return { sessions: uniqueSessions }
    },
    enabled: isTeacher,
  })

  const studentSessions = studentSessionsData?.data.sessions || []
  const teacherRequests = teacherRequestsData?.data.sessions || []
  const teacherSessions = teacherSessionsData?.sessions || []

  // Calculate today's date for filtering
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  // Helper functions for statistics
  const isSessionToday = (sessionDate: string) => {
    const date = new Date(sessionDate)
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Calculate statistics for students
  const studentStats = useMemo(() => {
    const now = new Date()
    const sessionsToday = studentSessions.filter(s => {
      const sessionDate = new Date(s.startTime)
      return isSessionToday(s.startTime) && 
             (s.status === 'scheduled' || s.status === 'ongoing') &&
             new Date(s.endTime) > now
    })

    const upcomingSessions = studentSessions.filter(s => {
      const sessionDate = new Date(s.startTime)
      return sessionDate > now && 
             (s.status === 'scheduled' || s.status === 'accepted' || s.status === 'requested')
    })

    const completedSessions = studentSessions.filter(s => s.status === 'completed')

    return {
      today: sessionsToday.length,
      upcoming: upcomingSessions.length,
      completed: completedSessions.length,
    }
  }, [studentSessions, today])

  // Calculate statistics for teachers
  const teacherStats = useMemo(() => {
    const now = new Date()
    const pendingRequests = teacherRequests.length

    const sessionsToday = teacherSessions.filter(s => {
      return isSessionToday(s.startTime) && 
             (s.status === 'scheduled' || s.status === 'ongoing') &&
             new Date(s.endTime) > now
    })

    const upcomingSessions = teacherSessions.filter(s => {
      const sessionDate = new Date(s.startTime)
      return sessionDate > now && 
             (s.status === 'scheduled' || s.status === 'accepted')
    })

    return {
      pendingRequests,
      today: sessionsToday.length,
      upcoming: upcomingSessions.length,
    }
  }, [teacherRequests, teacherSessions, today])

  const isLoading = isTeacher 
    ? (isLoadingTeacherRequests || isLoadingTeacherSessions)
    : isLoadingStudentSessions


  if (isLoading) {
    return (
      <LottieLoader
        isVisible={true}
        overlay={false}
        size="medium"
        message="Loading dashboard..."
      />
    )
  }

  // Define metrics based on user role
  const metrics = isTeacher
    ? [
        {
          label: 'Pending Requests',
          value: teacherStats.pendingRequests.toString(),
          icon: faExclamationCircle,
          description: 'Session requests awaiting your response',
          onClick: () => navigate('/app/session-requests'),
        },
        {
          label: 'Sessions Today',
          value: teacherStats.today.toString(),
          icon: faVideo,
          description: 'Sessions scheduled for today',
        },
        {
          label: 'Upcoming Sessions',
          value: teacherStats.upcoming.toString(),
          icon: faCalendar,
          description: 'Sessions scheduled for the future',
        },
      ]
    : [
        {
          label: 'Sessions Today',
          value: studentStats.today.toString(),
          icon: faVideo,
          description: 'Sessions scheduled for today',
        },
        {
          label: 'Upcoming Sessions',
          value: studentStats.upcoming.toString(),
          icon: faCalendar,
          description: 'Sessions scheduled for the future',
        },
        {
          label: 'Completed Sessions',
          value: studentStats.completed.toString(),
          icon: faCheckCircle,
          description: 'Sessions you have completed',
        },
      ]

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isTeacher 
            ? 'Manage your session requests and upcoming classes.' 
            : 'Stay on top of your upcoming classes and sessions.'}
        </p>
      </section>

      {/* Quick Actions / Shortcuts */}
      {showCalendar && (
        <section>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/app/calendar')}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FontAwesomeIcon icon={faCalendar} className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">My Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    View all your sessions and manage your schedule
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={(e) => { e.stopPropagation(); navigate('/app/calendar') }}>
                Open Calendar
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Statistics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card 
            key={metric.label} 
            className={cn(
              "overflow-hidden transition-all",
              metric.onClick && "cursor-pointer hover:shadow-md"
            )}
            onClick={metric.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-medium">{metric.label}</CardTitle>
              <FontAwesomeIcon icon={metric.icon} className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{metric.value}</div>
              <CardDescription className="mt-2">{metric.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

