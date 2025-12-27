import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { faCalendar, faClock, faUser, faBookOpen, faCheckCircle, faTimesCircle, faVideo, faFilter, faTimes, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { 
  getTeacherSessionRequests, 
  acceptSessionRequest, 
  rejectSessionRequest,
  type Session 
} from '../api/session-api'
import { getTeacherFocusOnes } from '@/features/focus-one/api/focus-one-api'
import { notifySuccess, notifyError, handleApiError } from '@/lib/notifications'
import { cn } from '@/lib/utils'

type StatusFilter = 'requested' | 'accepted' | 'rejected' | 'scheduled' | 'all'

export function TeacherSessionRequestsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('requested')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const queryClient = useQueryClient()

  // Debounce search query to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setPage(1) // Reset to first page when search changes
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch teacher's FocusOnes to extract subjects
  const { data: focusOnesData } = useQuery({
    queryKey: ['teacherFocusOnes'],
    queryFn: () => getTeacherFocusOnes({ limit: 100 }),
  })

  // Extract unique subjects from all FocusOnes
  const subjects = useMemo(() => {
    const focusOnes = focusOnesData?.data?.focusOnes || []
    const subjectMap = new Map()
    
    focusOnes.forEach((focusOne) => {
      const mappings = focusOne.teacherSubjectMappings || []
      mappings.forEach((mapping) => {
        const subject = mapping.subject
        if (subject && subject._id) {
          if (!subjectMap.has(subject._id)) {
            subjectMap.set(subject._id, {
              id: subject._id,
              name: subject.name,
              description: subject.description,
            })
          }
        }
      })
    })
    
    return Array.from(subjectMap.values())
  }, [focusOnesData])

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit: 10,
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
  }, [page, statusFilter, subjectFilter, dateFilter, debouncedSearchQuery])

  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherSessionRequests', queryParams],
    queryFn: () => getTeacherSessionRequests(queryParams),
  })

  const acceptMutation = useMutation({
    mutationFn: (data: { sessionId: string; title?: string; description?: string }) => {
      const request: { title?: string; description?: string } = {}
      if (data.title) request.title = data.title
      if (data.description) request.description = data.description
      return acceptSessionRequest(data.sessionId, request)
    },
    onSuccess: () => {
      notifySuccess('Session request accepted successfully!')
      queryClient.invalidateQueries({ queryKey: ['teacherSessionRequests'] })
      setIsAcceptDialogOpen(false)
      setSelectedSession(null)
      setTitle('')
      setDescription('')
    },
    onError: (error) => {
      const { message } = handleApiError(error, 'Failed to accept session request')
      notifyError(message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) =>
      rejectSessionRequest(sessionId, { reason }),
    onSuccess: () => {
      notifySuccess('Session request rejected')
      queryClient.invalidateQueries({ queryKey: ['teacherSessionRequests'] })
      setIsRejectDialogOpen(false)
      setSelectedSession(null)
      setRejectionReason('')
    },
    onError: (error) => {
      const { message } = handleApiError(error, 'Failed to reject session request')
      notifyError(message)
    },
  })

  const handleAccept = () => {
    if (!selectedSession) return
    const request: { sessionId: string; title?: string; description?: string } = {
      sessionId: selectedSession._id,
    }
    if (title.trim()) request.title = title.trim()
    if (description.trim()) request.description = description.trim()
    acceptMutation.mutate(request)
  }

  const handleReject = () => {
    if (!selectedSession || !rejectionReason.trim()) return
    rejectMutation.mutate({
      sessionId: selectedSession._id,
      reason: rejectionReason.trim(),
    })
  }

  const openAcceptDialog = (session: Session) => {
    setSelectedSession(session)
    setTitle(session.title || '')
    setDescription(session.description || '')
    setIsAcceptDialogOpen(true)
  }

  const openRejectDialog = (session: Session) => {
    setSelectedSession(session)
    setRejectionReason('')
    setIsRejectDialogOpen(true)
  }

  const handleClearFilters = useCallback(() => {
    setStatusFilter('requested')
    setSubjectFilter('')
    setDateFilter('')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setPage(1)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return statusFilter !== 'requested' || subjectFilter !== '' || dateFilter !== '' || debouncedSearchQuery !== ''
  }, [statusFilter, subjectFilter, dateFilter, debouncedSearchQuery])

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

  const formatDuration = (startTime: string, endTime: string) => {
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

  if (isLoading) {
    return (
      <LottieLoader
        isVisible={true}
        overlay={false}
        size="medium"
        message="Loading session requests..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Session Requests
          </h1>
        </section>
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load session requests. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sessions = data?.data?.sessions || []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Session Requests
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and manage session requests from students
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
                {[statusFilter !== 'requested' && statusFilter !== 'all', subjectFilter, dateFilter, debouncedSearchQuery].filter(Boolean).length}
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
            placeholder="Search by session title or student name/email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
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
      </section>

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
                  <option value="accepted">Accepted</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="rejected">Rejected</option>
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
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faCalendar} className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? 'No session requests found matching your filters.' 
                  : 'No pending session requests at this time.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {statusFilter === 'all' 
                ? 'All Session Requests' 
                : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Session Requests`}
            </h2>
            {pagination && (
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
              </p>
            )}
          </div>
          {sessions.map((session) => (
            <Card key={session._id} className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    {session.description && (
                      <CardDescription className="mt-1">{session.description}</CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={session.status === 'requested' ? 'default' : 'secondary'}
                    className="ml-4"
                  >
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Student</p>
                      <p className="text-sm font-medium">
                        {session.requestedBy?.name || session.requestedBy?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {session.subject && (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faBookOpen} className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Subject</p>
                        <p className="text-sm font-medium">{session.subject.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{formatDate(session.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)} ({formatDuration(session.startTime, session.endTime)})
                      </p>
                    </div>
                  </div>
                </div>

                {session.status === 'requested' && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => openAcceptDialog(session)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => openRejectDialog(session)}
                      variant="destructive"
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} requests
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Accept Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Accept Session Request</DialogTitle>
            <DialogDescription>
              Review and customize the session details before accepting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Session Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter session title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={acceptMutation.isPending}
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/200 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Explain your plan for the session"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={acceptMutation.isPending}
                rows={4}
                minLength={10}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 characters (minimum 10 characters)
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> A meet link will be auto sent for the session via email and can be accessed here. It will <strong>NOT</strong> show up on your Google Calendar.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAcceptDialogOpen(false)}
                disabled={acceptMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={acceptMutation.isPending || !title.trim() || !description.trim() || description.trim().length < 10}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {acceptMutation.isPending ? (
                  <>
                    <LottieLoader isVisible={true} className="mr-2 h-4 w-4" />
                    Accepting...
                  </>
                ) : (
                  'Accept Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Session Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this session request. The student will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please explain why this session request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={rejectMutation.isPending}
                rows={5}
                minLength={10}
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground">
                {rejectionReason.length}/500 characters (minimum 10 characters)
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim() || rejectionReason.trim().length < 10}
              >
                {rejectMutation.isPending ? (
                  <>
                    <LottieLoader isVisible={true} className="mr-2 h-4 w-4" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
