import { format } from 'date-fns'
import { type Session } from '@/features/sessions/api/session-api'
import { cn } from '@/lib/utils'

interface CalendarEventProps {
  session: Session
  onClick?: () => void
  className?: string
}

const getStatusColor = (status: Session['status']) => {
  switch (status) {
    case 'requested':
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-900 dark:text-yellow-100'
    case 'accepted':
    case 'scheduled':
      return 'bg-blue-500/20 border-blue-500/50 text-blue-900 dark:text-blue-100'
    case 'ongoing':
      return 'bg-green-500/20 border-green-500/50 text-green-900 dark:text-green-100'
    case 'completed':
      return 'bg-gray-500/20 border-gray-500/50 text-gray-900 dark:text-gray-100'
    case 'rejected':
    case 'cancelled':
      return 'bg-red-500/20 border-red-500/50 text-red-900 dark:text-red-100'
    default:
      return 'bg-gray-500/20 border-gray-500/50 text-gray-900 dark:text-gray-100'
  }
}

export function CalendarEvent({ session, onClick, className }: CalendarEventProps) {
  const startTime = format(new Date(session.startTime), 'h:mm a')
  const endTime = format(new Date(session.endTime), 'h:mm a')

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-md border px-1.5 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity',
        'truncate overflow-hidden',
        getStatusColor(session.status),
        className
      )}
      title={`${session.title} (${startTime} - ${endTime})`}
    >
      <div className="font-medium truncate leading-tight">{session.title}</div>
      <div className="text-[10px] opacity-75 mt-0.5 leading-tight">
        {startTime} - {endTime}
      </div>
      {session.subject && (
        <div className="text-[10px] opacity-60 truncate mt-0.5 leading-tight">
          {session.subject.name}
        </div>
      )}
    </div>
  )
}

