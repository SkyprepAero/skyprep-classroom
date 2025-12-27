import { format, isToday, addHours, setHours, setMinutes, startOfDay } from 'date-fns'
import { type Session } from '@/features/sessions/api/session-api'
import { CalendarEvent } from '../calendar-event'
import { cn } from '@/lib/utils'

interface DayViewProps {
  currentDate: Date
  sessions: Session[]
  onSessionClick: (session: Session) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function DayView({ currentDate, sessions, onSessionClick }: DayViewProps) {
  const dayStart = startOfDay(currentDate)
  const isTodayDate = isToday(currentDate)

  // Filter sessions for the current day
  const daySessions = sessions.filter((session) => {
    const sessionDate = new Date(session.startTime)
    return format(sessionDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
  })

  // Sort sessions by start time
  const sortedSessions = [...daySessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const getSessionsForHour = (hour: number): Session[] => {
    return sortedSessions.filter((session) => {
      const sessionStart = new Date(session.startTime)
      const sessionEnd = new Date(session.endTime)
      const hourStart = setMinutes(setHours(dayStart, hour), 0)
      const hourEnd = addHours(hourStart, 1)

      return (
        (sessionStart >= hourStart && sessionStart < hourEnd) ||
        (sessionEnd > hourStart && sessionEnd <= hourEnd) ||
        (sessionStart <= hourStart && sessionEnd >= hourEnd)
      )
    })
  }

  return (
    <div className="flex flex-col border-t border-l border-r border-border">
      {/* Day header */}
      <div
        className={cn(
          'p-5 text-center border-b border-border bg-muted/30',
          isTodayDate && 'bg-primary/10'
        )}
      >
        <div className="text-sm font-medium text-muted-foreground">
          {format(currentDate, 'EEEE')}
        </div>
        <div
          className={cn(
            'text-2xl font-semibold mt-1',
            isTodayDate && 'text-primary'
          )}
        >
          {format(currentDate, 'MMMM d, yyyy')}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '600px' }}>
        {HOURS.map((hour) => {
          const hourSessions = getSessionsForHour(hour)

          return (
            <div key={hour} className="grid grid-cols-12 border-b border-border">
              <div className="p-4 border-r border-border text-sm text-muted-foreground text-right pr-5 bg-muted/20 col-span-2">
                {format(setHours(new Date(), hour), 'h a')}
              </div>
              <div
                className={cn(
                  'p-4 col-span-10 min-h-[80px]',
                  isTodayDate && 'bg-primary/5'
                )}
              >
                {hourSessions
                  .filter((session) => {
                    const sessionStart = new Date(session.startTime)
                    return sessionStart.getHours() === hour
                  })
                  .map((session) => (
                    <CalendarEvent
                      key={session._id}
                      session={session}
                      onClick={() => onSessionClick(session)}
                      className="mb-2 max-w-md"
                    />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

