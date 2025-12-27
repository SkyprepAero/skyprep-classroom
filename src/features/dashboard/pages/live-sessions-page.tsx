import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { faVideo, faCalendar, faClock, faExclamationTriangle, faFilter, faTimes, faChevronLeft, faChevronRight, faMagnifyingGlass, faUser, faBookOpen, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { getSessions, type Session } from '@/features/sessions/api/session-api'
import { useEnrollment } from '@/hooks/use-enrollment'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'requested' | 'scheduled' | 'ongoing' | 'completed' | 'rejected' | 'cancelled'

export function LiveSessionsPage() {
  const { enrollment } = useEnrollment()
  const focusOneId = enrollment?.type === 'focusOne' ? enrollment.enrollment.id : null

  // Filter states
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search query to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setPage(1) // Reset to first page when search changes
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Extract subjects from enrollment
  const subjects = useMemo(() => {
    if (!enrollment || enrollment.type !== 'focusOne') return []
    
    const mappings = enrollment.teacherSubjectMappings || enrollment.enrollment.teacherSubjectMappings || []
    const subjectMap = new Map()
    
    mappings.forEach((mapping: any) => {
      const subject = mapping.subject || mapping
      if (subject && (subject.id || subject._id)) {
        const id = subject.id || subject._id
        if (!subjectMap.has(id)) {
          subjectMap.set(id, {
            id,
            name: subject.name,
            description: subject.description,
          })
        }
      }
    })
    
    return Array.from(subjectMap.values())
  }, [enrollment])

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      focusOne: focusOneId,
      page,
      limit: 10, // Items per page
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter
    }

    if (subjectFilter) {
      params.subject = subjectFilter
    }

    if (dateFilter) {
      params.date = dateFilter
    }

    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim()
    }

    return params
  }, [focusOneId, page, statusFilter, subjectFilter, dateFilter, debouncedSearchQuery])

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentSessions', queryParams],
    queryFn: () => getSessions(queryParams),
    enabled: !!focusOneId,
  })

  const sessions = data?.data.sessions || []
  const pagination = data?.data.pagination

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMinutes = Math.round(diffMs / (1000 * 60))
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${minutes}m`
    }
  }

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all')
    setSubjectFilter('')
    setDateFilter('')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setPage(1)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return statusFilter !== 'all' || subjectFilter !== '' || dateFilter !== '' || debouncedSearchQuery !== ''
  }, [statusFilter, subjectFilter, dateFilter, debouncedSearchQuery])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const getStatusBadgeVariant = (status: Session['status']) => {
    switch (status) {
      case 'requested':
        return 'secondary'
      case 'scheduled':
      case 'ongoing':
        return 'default'
      case 'completed':
        return 'outline'
      case 'rejected':
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <LottieLoader
        isVisible={true}
        overlay={false}
        size="medium"
        message="Loading your sessions..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Live Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join interactive sessions to resolve doubts and learn smarter strategies.
          </p>
        </header>
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load sessions. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!focusOneId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Live Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join interactive sessions to resolve doubts and learn smarter strategies.
          </p>
        </header>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              You need to be enrolled in a Focus One program to view sessions.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Live Sessions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join interactive sessions to resolve doubts and learn smarter strategies.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {[statusFilter !== 'all', subjectFilter, dateFilter, debouncedSearchQuery].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search sessions by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              // Don't reset page here - let debounce handle it
            }}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                setSearchQuery('')
                setDebouncedSearchQuery('')
                setPage(1)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
            </Button>
          )}
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter)
                    setPage(1)
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label htmlFor="subject-filter">Subject</Label>
                <select
                  id="subject-filter"
                  value={subjectFilter}
                  onChange={(e) => {
                    setSubjectFilter(e.target.value)
                    setPage(1)
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-filter">Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {statusFilter === 'all' ? 'All Sessions' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Sessions`}
            </h2>
            {pagination && (
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
              </p>
            )}
          </div>
          <div className="grid gap-4">
            {sessions.map((session) => {
              const isRejectedOrCancelled = session.status === 'rejected' || session.status === 'cancelled'
              const isUpcoming = session.status === 'scheduled' || session.status === 'ongoing'
              
              // Check if session is on today's date
              const isSessionToday = (() => {
                const sessionDate = new Date(session.startTime)
                const today = new Date()
                return (
                  sessionDate.getDate() === today.getDate() &&
                  sessionDate.getMonth() === today.getMonth() &&
                  sessionDate.getFullYear() === today.getFullYear()
                )
              })()
              
              return (
                <Card
                  key={session._id}
                  className={cn(
                    'transition-all duration-200 hover:shadow-md',
                    isRejectedOrCancelled
                      ? 'border-destructive/50 bg-destructive/5 dark:bg-destructive/10'
                      : isUpcoming
                      ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'
                      : 'border-border/60'
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Title and Status */}
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'mt-1 flex h-10 w-10 items-center justify-center rounded-lg',
                            isRejectedOrCancelled
                              ? 'bg-destructive/10 text-destructive'
                              : isUpcoming
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            <FontAwesomeIcon
                              icon={isRejectedOrCancelled ? faExclamationTriangle : faVideo}
                              className="h-5 w-5"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg leading-tight mb-2">{session.title}</CardTitle>
                            <Badge 
                              variant={getStatusBadgeVariant(session.status)}
                              className={cn(
                                'text-xs',
                                session.status === 'scheduled' || session.status === 'ongoing'
                                  ? 'bg-primary/10 text-primary border-primary/20'
                                  : ''
                              )}
                            >
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        {/* Session Info Grid */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pl-13">
                          {/* Date */}
                          <div className="flex items-start gap-3">
                            <FontAwesomeIcon 
                              icon={faCalendarAlt} 
                              className="h-4 w-4 text-muted-foreground mt-0.5" 
                            />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                              <p className="text-sm font-medium text-foreground">{formatDate(session.startTime)}</p>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex items-start gap-3">
                            <FontAwesomeIcon 
                              icon={faClock} 
                              className="h-4 w-4 text-muted-foreground mt-0.5" 
                            />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Time</p>
                              <p className="text-sm font-medium text-foreground">
                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Duration: {calculateDuration(session.startTime, session.endTime)}
                              </p>
                            </div>
                          </div>

                          {/* Subject */}
                          {session.subject && (
                            <div className="flex items-start gap-3">
                              <FontAwesomeIcon 
                                icon={faBookOpen} 
                                className="h-4 w-4 text-muted-foreground mt-0.5" 
                              />
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Subject</p>
                                <p className="text-sm font-medium text-foreground">{session.subject.name}</p>
                              </div>
                            </div>
                          )}

                          {/* Teacher */}
                          {session.teacher && (
                            <div className="flex items-start gap-3">
                              <FontAwesomeIcon 
                                icon={faUser} 
                                className="h-4 w-4 text-muted-foreground mt-0.5" 
                              />
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Teacher</p>
                                <p className="text-sm font-medium text-foreground">{session.teacher.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Description */}
                    {session.description && (
                      <div className="pl-13">
                        <p className="text-sm text-muted-foreground leading-relaxed">{session.description}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {session.status === 'rejected' && session.rejectionReason && (
                      <div className="pl-13 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs font-semibold text-destructive mb-1.5 uppercase tracking-wide">Rejection Reason</p>
                        <p className="text-sm text-destructive/90 leading-relaxed">{session.rejectionReason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pl-13 pt-2 flex items-center gap-3">
                      {/* Meeting Link - Only show for sessions scheduled/ongoing AND on today's date */}
                      {session.meetingLink && isUpcoming && isSessionToday && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                            'bg-primary text-primary-foreground hover:bg-primary/90',
                            'shadow-sm hover:shadow-md'
                          )}
                        >
                          <FontAwesomeIcon icon={faVideo} className="h-4 w-4" />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                  <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faVideo} className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'No sessions found matching your filters. Try adjusting your search criteria.'
                  : 'No sessions found. Request a session from your Focus One page.'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
