import { format } from 'date-fns'
import { faCalendar, faClock, faBookOpen, faUser, faVideo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { type Session } from '@/features/sessions/api/session-api'
import { cn } from '@/lib/utils'

interface DaySessionsDialogProps {
  date: Date
  sessions: Session[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionClick?: (session: Session) => void
}

const getStatusBadgeVariant = (status: Session['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'requested':
      return 'outline'
    case 'accepted':
    case 'scheduled':
      return 'default'
    case 'ongoing':
      return 'default'
    case 'completed':
      return 'secondary'
    case 'rejected':
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function DaySessionsDialog({ date, sessions, open, onOpenChange, onSessionClick }: DaySessionsDialogProps) {
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  // Check if a session is on today's date
  const isSessionToday = (sessionStartTime: string) => {
    const sessionDate = new Date(sessionStartTime)
    const today = new Date()
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    )
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${minutes}m`
    }
  }

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Sessions for {format(date, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} scheduled for this day
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No sessions scheduled for this day</p>
            </div>
          ) : (
            sortedSessions.map((session) => (
              <div
                key={session._id}
                onClick={() => {
                  if (onSessionClick) {
                    onSessionClick(session)
                    onOpenChange(false)
                  }
                }}
                className={cn(
                  'rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200',
                  onSessionClick && 'cursor-pointer hover:shadow-md hover:border-primary/50'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{session.title}</h3>
                        {session.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusBadgeVariant(session.status)}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Details Grid */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="h-4 w-4 text-muted-foreground flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">Time</p>
                          <p className="text-sm font-medium">
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {calculateDuration(session.startTime, session.endTime)}
                          </p>
                        </div>
                      </div>

                      {/* Subject */}
                      {session.subject && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faBookOpen}
                            className="h-4 w-4 text-muted-foreground flex-shrink-0"
                          />
                          <div>
                            <p className="text-xs text-muted-foreground">Subject</p>
                            <p className="text-sm font-medium">{session.subject.name}</p>
                          </div>
                        </div>
                      )}

                      {/* Teacher */}
                      {session.teacher && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faUser}
                            className="h-4 w-4 text-muted-foreground flex-shrink-0"
                          />
                          <div>
                            <p className="text-xs text-muted-foreground">Teacher</p>
                            <p className="text-sm font-medium">{session.teacher.name}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    {session.status === 'rejected' && session.rejectionReason && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs font-semibold text-destructive mb-1">Rejection Reason</p>
                        <p className="text-xs text-destructive/90">{session.rejectionReason}</p>
                      </div>
                    )}

                    {/* Meeting Link - Only show for sessions scheduled/ongoing AND on today's date */}
                    {session.meetingLink && (session.status === 'scheduled' || session.status === 'ongoing') && isSessionToday(session.startTime) && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                          'bg-primary text-primary-foreground hover:bg-primary/90',
                          'shadow-sm hover:shadow-md'
                        )}
                      >
                        <FontAwesomeIcon icon={faVideo} className="h-3 w-3" />
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

