import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addHours, setHours, setMinutes } from 'date-fns'
import { type Session } from '@/features/sessions/api/session-api'
import { CalendarEvent } from '../calendar-event'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  currentDate: Date
  sessions: Session[]
  onSessionClick: (session: Session) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function WeekView({ currentDate, sessions, onSessionClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Group sessions by date and hour
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

  const getSessionsForHour = (date: Date, hour: number, sessions: Session[]): Session[] => {
    return sessions.filter((session) => {
      const sessionStart = new Date(session.startTime)
      const sessionEnd = new Date(session.endTime)
      const hourStart = setMinutes(setHours(date, hour), 0)
      const hourEnd = addHours(hourStart, 1)
      
      return (
        (sessionStart >= hourStart && sessionStart < hourEnd) ||
        (sessionEnd > hourStart && sessionEnd <= hourEnd) ||
        (sessionStart <= hourStart && sessionEnd >= hourEnd)
      )
    })
  }

  return (
    <div className="flex flex-col border-t border-l border-border">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-border">
        <div className="p-4 border-r border-border bg-muted/30"></div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'p-4 text-center border-r border-border bg-muted/30',
              isToday(day) && 'bg-primary/10 font-semibold'
            )}
          >
            <div className="text-sm font-medium text-muted-foreground">
              {format(day, 'EEE')}
            </div>
            <div
              className={cn(
                'text-lg font-semibold mt-1',
                isToday(day) && 'text-primary'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '600px' }}>
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-border">
            <div className="p-3 border-r border-border text-xs text-muted-foreground text-right pr-4 bg-muted/20">
              {format(setHours(new Date(), hour), 'h a')}
            </div>
            {weekDays.map((day) => {
              const daySessions = getSessionsForDate(day)
              const hourSessions = getSessionsForHour(day, hour, daySessions)

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={cn(
                    'p-2 border-r border-border min-h-[60px]',
                    isToday(day) && 'bg-primary/5'
                  )}
                >
                  {hourSessions.map((session) => {
                    const sessionStart = new Date(session.startTime)
                    const sessionHour = sessionStart.getHours()
                    const sessionMinute = sessionStart.getMinutes()
                    const isStartHour = sessionHour === hour

                    if (!isStartHour) return null

                    return (
                      <CalendarEvent
                        key={session._id}
                        session={session}
                        onClick={() => onSessionClick(session)}
                        className="mb-1"
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

