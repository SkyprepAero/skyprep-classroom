import { format } from 'date-fns'
import { faChevronLeft, faChevronRight, faCalendarDay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Button } from '@/components/ui/button'
import { type CalendarView } from '../pages/calendar-page'
import { cn } from '@/lib/utils'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        return `Week of ${format(currentDate, 'MMMM d, yyyy')}`
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
      default:
        return format(currentDate, 'MMMM yyyy')
    }
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          className="h-8 w-8 p-0"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          className="h-8 w-8 p-0"
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="h-8 px-3"
        >
          <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3 mr-2" />
          Today
        </Button>
        <h2 className="text-xl font-semibold text-foreground ml-2">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('month')}
          className="h-8 px-3"
        >
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('week')}
          className="h-8 px-3"
        >
          Week
        </Button>
        <Button
          variant={view === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('day')}
          className="h-8 px-3"
        >
          Day
        </Button>
      </div>
    </div>
  )
}

