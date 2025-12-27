import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, startOfMonth, endOfMonth } from 'date-fns'
import { type Session } from '@/features/sessions/api/session-api'
import { CalendarEvent } from '../calendar-event'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  currentDate: Date
  sessions: Session[]
  onSessionClick: (session: Session) => void
  onDaySessionsClick?: (date: Date, sessions: Session[]) => void
}

export function MonthView({ currentDate, sessions, onSessionClick, onDaySessionsClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Group sessions by date
  const sessionsByDate = new Map<string, Session[]>()
  sessions.forEach((session) => {
    const dateKey = format(new Date(session.startTime), 'yyyy-MM-dd')
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, [])
    }
    sessionsByDate.get(dateKey)!.push(session)
  })

  const getSessionsForDate = (date: Date): Session[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return sessionsByDate.get(dateKey) || []
  }

  return (
    <div className="grid grid-cols-7 divide-x divide-y divide-border border-t border-l border-border">
      {/* Weekday headers */}
      {weekDays.map((day) => (
        <div
          key={day}
          className="p-3 text-sm font-medium text-muted-foreground bg-muted/30 text-center"
        >
          {day}
        </div>
      ))}

      {/* Calendar days */}
      {days.map((day) => {
        const daySessions = getSessionsForDate(day)
        const isCurrentMonth = isSameMonth(day, currentDate)
        const isTodayDate = isToday(day)

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'min-h-[100px] p-3 bg-background',
              !isCurrentMonth && 'bg-muted/20 opacity-50',
              isTodayDate && 'bg-primary/5 border-2 border-primary'
            )}
          >
            <div
              className={cn(
                'text-sm font-medium mb-2',
                isTodayDate && 'text-primary font-semibold',
                !isCurrentMonth && 'text-muted-foreground'
              )}
            >
              {format(day, 'd')}
            </div>
            <div className="space-y-0.5 overflow-hidden">
              {daySessions.slice(0, 3).map((session) => (
                <CalendarEvent
                  key={session._id}
                  session={session}
                  onClick={() => onSessionClick(session)}
                />
              ))}
              {daySessions.length > 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onDaySessionsClick) {
                      onDaySessionsClick(day, daySessions)
                    }
                  }}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors cursor-pointer w-full text-left"
                  title={`View all ${daySessions.length} sessions for this day`}
                >
                  +{daySessions.length - 3} more
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

