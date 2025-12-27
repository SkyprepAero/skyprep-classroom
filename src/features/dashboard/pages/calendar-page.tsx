import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay } from 'date-fns'
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { getSessions, getTeacherSessionRequests, type Session } from '@/features/sessions/api/session-api'
import { useEnrollment } from '@/hooks/use-enrollment'
import { useAuthStore } from '@/stores/auth-store'
import { CalendarHeader } from '../components/calendar-header'
import { MonthView } from '../components/calendar-views/month-view'
import { WeekView } from '../components/calendar-views/week-view'
import { DayView } from '../components/calendar-views/day-view'
import { SessionDetailDialog } from '../components/session-detail-dialog'
import { DaySessionsDialog } from '../components/day-sessions-dialog'
import { TeacherScheduleSessionDialog } from '@/features/sessions/components/teacher-schedule-session-dialog'

export type CalendarView = 'month' | 'week' | 'day'

export function CalendarPage() {
  const { enrollment } = useEnrollment()
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const focusOneId = enrollment?.type === 'focusOne' ? enrollment.enrollment.id : null
  
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

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDaySessions, setSelectedDaySessions] = useState<{ date: Date; sessions: Session[] } | null>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        }
      case 'week':
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 0 }), // Sunday
          end: endOfWeek(currentDate, { weekStartsOn: 0 }),
        }
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        }
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        }
    }
  }, [view, currentDate])

  // Fetch sessions for the date range
  const { data, isLoading, error } = useQuery({
    queryKey: ['calendarSessions', isTeacher, focusOneId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      let result
      
      if (isTeacher) {
        // For teachers, use getAllSessions with teacher filter to get all sessions
        // First, get user ID from auth store (we'll need to pass it differently)
        // For now, use getTeacherSessionRequests with multiple statuses
        const statuses: Array<'requested' | 'accepted' | 'rejected' | 'scheduled'> = ['requested', 'accepted', 'rejected', 'scheduled']
        const allSessions: Session[] = []
        
        // Fetch sessions for each status
        for (const status of statuses) {
          let page = 1
          let hasMore = true
          
          while (hasMore && page <= 10) { // Limit to 10 pages per status
            try {
              const pageResult = await getTeacherSessionRequests({
                page,
                limit: 100,
                status,
              })
              
              allSessions.push(...pageResult.data.sessions)
              
              hasMore = pageResult.data.sessions.length === 100
              page++
            } catch (error) {
              // If fetching fails, continue with other statuses
              hasMore = false
            }
          }
        }
        
        // Remove duplicates (in case a session appears in multiple status queries)
        const uniqueSessions = Array.from(
          new Map(allSessions.map(session => [session._id, session])).values()
        )
        
        result = { sessions: uniqueSessions, pagination: null }
      } else {
        // For students, fetch sessions for their focusOne
        if (!focusOneId) return { sessions: [], pagination: null }
        
        const studentResult = await getSessions({
          focusOne: focusOneId,
          page: 1,
          limit: 1000, // Large limit to get all sessions for the calendar
        })
        
        result = { sessions: studentResult.data.sessions, pagination: studentResult.data.pagination }
      }
      
      // Filter sessions that fall within the date range
      const filteredSessions = result.sessions.filter((session) => {
        const sessionStart = new Date(session.startTime)
        const sessionEnd = new Date(session.endTime)
        return (
          (sessionStart >= dateRange.start && sessionStart <= dateRange.end) ||
          (sessionEnd >= dateRange.start && sessionEnd <= dateRange.end) ||
          (sessionStart <= dateRange.start && sessionEnd >= dateRange.end)
        )
      })
      
      return { sessions: filteredSessions, pagination: result.pagination }
    },
    enabled: isTeacher || !!focusOneId,
  })

  const sessions = data?.sessions || []

  const handlePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(subDays(currentDate, 1))
        break
    }
  }

  const handleNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(addDays(currentDate, 1))
        break
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }


  // Handle dialog success - refresh calendar data
  const handleDialogSuccess = useCallback(() => {
    // Invalidate calendar sessions query to refresh data
    queryClient.invalidateQueries({ queryKey: ['calendarSessions'] })
  }, [queryClient])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">View your sessions in calendar format</p>
        </div>
        <LottieLoader
          isVisible={true}
          overlay={false}
          size="medium"
          message="Loading calendar..."
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">View your sessions in calendar format</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Error loading calendar. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 -mx-4 md:-mx-6">
      <div className="px-4 md:px-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">View your sessions in calendar format</p>
        </div>
        {isTeacher && (
          <Button
            onClick={() => setIsRequestDialogOpen(true)}
            className="shrink-0"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        )}
      </div>

      <Card className="mx-0">
        <CardHeader className="pb-3 px-4 md:px-6">
          <CalendarHeader
            currentDate={currentDate}
            view={view}
            onViewChange={setView}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="min-h-[600px]">
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                sessions={sessions}
                onSessionClick={setSelectedSession}
                onDaySessionsClick={(date, daySessions) => {
                  setSelectedDaySessions({ date, sessions: daySessions })
                }}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                sessions={sessions}
                onSessionClick={setSelectedSession}
              />
            )}
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                sessions={sessions}
                onSessionClick={setSelectedSession}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSession && (
        <SessionDetailDialog
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}

      {selectedDaySessions && (
        <DaySessionsDialog
          date={selectedDaySessions.date}
          sessions={selectedDaySessions.sessions}
          open={!!selectedDaySessions}
          onOpenChange={(open) => !open && setSelectedDaySessions(null)}
          onSessionClick={setSelectedSession}
        />
      )}

      {isTeacher && (
        <TeacherScheduleSessionDialog
          open={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  )
}

