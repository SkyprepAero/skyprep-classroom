import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { faCalendar, faClock, faUser, faBookOpen, faVideo, faCheckCircle, faTimesCircle, faBan, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { type Session, acceptSessionRequest, rejectSessionRequest, cancelSession, rescheduleSession, getAvailableSlots, type AvailableSlot } from '@/features/sessions/api/session-api'
import { useAuthStore } from '@/stores/auth-store'
import { useEnrollment } from '@/hooks/use-enrollment'
import { notifySuccess, notifyError, handleApiError } from '@/lib/notifications'
import { cn } from '@/lib/utils'

interface SessionDetailDialogProps {
  session: Session
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function SessionDetailDialog({ session, open, onOpenChange }: SessionDetailDialogProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
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
  
  // Check if user is the student who requested this session
  const isStudent = useMemo(() => {
    if (!user || !session.requestedBy) return false
    return session.requestedBy._id === user.id
  }, [user, session.requestedBy])
  
  // Check if user can cancel/reschedule (student who requested OR teacher assigned)
  const canCancelOrReschedule = useMemo(() => {
    if (!user) return false
    // Student can cancel/reschedule if they requested it
    if (isStudent) return true
    // Teacher can cancel/reschedule if they're assigned
    if (isTeacher && session.teacher && session.teacher._id === user.id) return true
    return false
  }, [user, isStudent, isTeacher, session.teacher])
  
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<AvailableSlot | null>(null)

  const acceptMutation = useMutation({
    mutationFn: (data: { sessionId: string; title?: string; description?: string }) => {
      const request: { title?: string; description?: string } = {}
      if (data.title) request.title = data.title
      if (data.description) request.description = data.description
      return acceptSessionRequest(data.sessionId, request)
    },
    onSuccess: () => {
      notifySuccess('Session request accepted successfully!')
      queryClient.invalidateQueries({ queryKey: ['calendarSessions'] })
      queryClient.invalidateQueries({ queryKey: ['teacherSessionRequests'] })
      setIsAcceptDialogOpen(false)
      setTitle('')
      setDescription('')
      onOpenChange(false) // Close the detail dialog
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
      queryClient.invalidateQueries({ queryKey: ['calendarSessions'] })
      queryClient.invalidateQueries({ queryKey: ['teacherSessionRequests'] })
      setIsRejectDialogOpen(false)
      setRejectionReason('')
      onOpenChange(false) // Close the detail dialog
    },
    onError: (error) => {
      const { message } = handleApiError(error, 'Failed to reject session request')
      notifyError(message)
    },
  })

  const handleAccept = () => {
    const request: { sessionId: string; title?: string; description?: string } = {
      sessionId: session._id,
    }
    if (title.trim()) request.title = title.trim()
    if (description.trim()) request.description = description.trim()
    acceptMutation.mutate(request)
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) return
    rejectMutation.mutate({
      sessionId: session._id,
      reason: rejectionReason.trim(),
    })
  }

  const openAcceptDialog = () => {
    setTitle(session.title || '')
    setDescription(session.description || '')
    setIsAcceptDialogOpen(true)
  }

  const openRejectDialog = () => {
    setRejectionReason('')
    setIsRejectDialogOpen(true)
  }

  const openCancelDialog = () => {
    setCancellationReason('')
    setIsCancelDialogOpen(true)
  }

  const openRescheduleDialog = () => {
    // Set initial date to current session date
    const sessionDate = new Date(session.startTime)
    const dateString = sessionDate.toISOString().split('T')[0]
    setRescheduleDate(dateString || '')
    setRescheduleTime('')
    setSelectedRescheduleSlot(null)
    setIsRescheduleDialogOpen(true)
  }

  // Fetch available slots for rescheduling
  const focusOneId = enrollment?.type === 'focusOne' ? enrollment.enrollment.id : null
  const { data: availableSlotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['availableSlots', focusOneId, session.subject?._id, rescheduleDate],
    queryFn: () => {
      if (!focusOneId || !session.subject?._id || !rescheduleDate) {
        return Promise.resolve(null)
      }
      return getAvailableSlots({
        focusOne: focusOneId,
        subject: session.subject._id,
        date: rescheduleDate,
        duration: 75,
      })
    },
    enabled: isRescheduleDialogOpen && !!focusOneId && !!session.subject?._id && !!rescheduleDate,
    staleTime: 30000,
  })

  const availableSlots = availableSlotsData?.data?.availableSlots || []

  const cancelMutation = useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) =>
      cancelSession(sessionId, { reason }),
    onSuccess: () => {
      notifySuccess('Session cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['calendarSessions'] })
      queryClient.invalidateQueries({ queryKey: ['teacherSessionRequests'] })
      queryClient.invalidateQueries({ queryKey: ['studentSessions'] })
      setIsCancelDialogOpen(false)
      setCancellationReason('')
      onOpenChange(false)
    },
    onError: (error) => {
      const { message } = handleApiError(error, 'Failed to cancel session')
      notifyError(message)
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ sessionId, startTime, endTime }: { sessionId: string; startTime: string; endTime: string }) =>
      rescheduleSession(sessionId, { startTime, endTime }),
    onSuccess: () => {
      notifySuccess('Session rescheduled successfully')
      queryClient.invalidateQueries({ queryKey: ['calendarSessions'] })
      queryClient.invalidateQueries({ queryKey: ['teacherSessionRequests'] })
      queryClient.invalidateQueries({ queryKey: ['studentSessions'] })
      setIsRescheduleDialogOpen(false)
      setRescheduleDate('')
      setRescheduleTime('')
      setSelectedRescheduleSlot(null)
      onOpenChange(false)
    },
    onError: (error) => {
      const { message } = handleApiError(error, 'Failed to reschedule session')
      notifyError(message)
    },
  })

  const handleCancel = () => {
    if (!cancellationReason.trim()) return
    cancelMutation.mutate({
      sessionId: session._id,
      reason: cancellationReason.trim(),
    })
  }

  const handleReschedule = () => {
    if (!selectedRescheduleSlot) return
    rescheduleMutation.mutate({
      sessionId: session._id,
      startTime: selectedRescheduleSlot.startTime,
      endTime: selectedRescheduleSlot.endTime,
    })
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
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

  // Check if session is today
  const isSessionToday = useMemo(() => {
    const sessionDate = new Date(session.startTime)
    const today = new Date()
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    )
  }, [session.startTime])

  const showAcceptRejectButtons = isTeacher && session.status === 'requested'
  const showCancelRescheduleButtons = canCancelOrReschedule && (session.status === 'requested' || session.status === 'scheduled')

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{session.title}</DialogTitle>
                <Badge variant={getStatusBadgeVariant(session.status)} className="mt-1">
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
              {/* Description */}
              {session.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{session.description}</p>
                </div>
              )}

              {/* Session Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="h-5 w-5 text-muted-foreground mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="text-sm font-medium">{formatDate(session.startTime)}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="h-5 w-5 text-muted-foreground mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Time</p>
                    <p className="text-sm font-medium">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {calculateDuration(session.startTime, session.endTime)}
                    </p>
                  </div>
                </div>

                {/* Subject */}
                {session.subject && (
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon
                      icon={faBookOpen}
                      className="h-5 w-5 text-muted-foreground mt-0.5"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Subject</p>
                      <p className="text-sm font-medium">{session.subject.name}</p>
                    </div>
                  </div>
                )}

                {/* Student (for teachers) or Teacher (for students) */}
                {isTeacher && session.requestedBy && (
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="h-5 w-5 text-muted-foreground mt-0.5"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Student</p>
                      <p className="text-sm font-medium">{session.requestedBy.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{session.requestedBy.email}</p>
                    </div>
                  </div>
                )}

                {!isTeacher && session.teacher && (
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="h-5 w-5 text-muted-foreground mt-0.5"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Teacher</p>
                      <p className="text-sm font-medium">{session.teacher.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{session.teacher.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {session.status === 'rejected' && session.rejectionReason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-semibold text-destructive mb-2">Rejection Reason</p>
                  <p className="text-sm text-destructive/90">{session.rejectionReason}</p>
                </div>
              )}

              {/* Cancellation Reason */}
              {session.status === 'cancelled' && session.cancellationReason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-semibold text-destructive mb-2">Cancellation Reason</p>
                  <p className="text-sm text-destructive/90">{session.cancellationReason}</p>
                </div>
              )}

              {/* Accept/Reject Buttons (for teachers viewing requested sessions) */}
              {showAcceptRejectButtons && (
                <div className="pt-4 border-t border-border">
                  <div className="flex gap-3">
                    <Button
                      onClick={openAcceptDialog}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={openRejectDialog}
                      variant="destructive"
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Cancel/Reschedule Buttons (for students and teachers on requested/scheduled sessions) */}
              {showCancelRescheduleButtons && (
                <div className="pt-4 border-t border-border">
                  <div className="flex gap-3">
                    <Button
                      onClick={openRescheduleDialog}
                      variant="outline"
                      disabled={cancelMutation.isPending || rescheduleMutation.isPending}
                    >
                      <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button
                      onClick={openCancelDialog}
                      variant="destructive"
                      disabled={cancelMutation.isPending || rescheduleMutation.isPending}
                    >
                      <FontAwesomeIcon icon={faBan} className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Meeting Link - Only show for sessions scheduled/ongoing AND on today's date */}
              {session.meetingLink && (session.status === 'scheduled' || session.status === 'ongoing') && isSessionToday && (
                <div className="pt-4 border-t border-border">
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
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this session. The {isStudent ? 'teacher' : 'student'} will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">
                Cancellation Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="cancellationReason"
                placeholder="Please explain why this session is being cancelled..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                disabled={cancelMutation.isPending}
                rows={5}
                minLength={10}
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground">
                {cancellationReason.length}/500 characters (minimum 10 characters)
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCancelDialogOpen(false)}
                disabled={cancelMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelMutation.isPending || !cancellationReason.trim() || cancellationReason.trim().length < 10}
              >
                {cancelMutation.isPending ? (
                  <>
                    <LottieLoader isVisible={true} className="mr-2 h-4 w-4" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Session'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              Select a new date and time for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rescheduleDate">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rescheduleDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value)
                  setSelectedRescheduleSlot(null)
                }}
                min={new Date().toISOString().split('T')[0]}
                disabled={rescheduleMutation.isPending}
                required
              />
            </div>

            {rescheduleDate && (
              <div className="space-y-2">
                <Label htmlFor="rescheduleTime">
                  Available Time Slots <span className="text-red-500">*</span>
                </Label>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-4">
                    <LottieLoader isVisible={true} size="small" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No available time slots for the selected date.
                  </p>
                ) : (
                  <select
                    id="rescheduleTime"
                    value={selectedRescheduleSlot ? selectedRescheduleSlot.startTime : ''}
                    onChange={(e) => {
                      const slot = availableSlots.find(s => s.startTime === e.target.value)
                      if (slot) {
                        setSelectedRescheduleSlot(slot)
                      } else {
                        setSelectedRescheduleSlot(null)
                      }
                    }}
                    disabled={rescheduleMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.startTime} value={slot.startTime}>
                        {slot.startTimeFormatted} - {slot.endTimeFormatted}
                      </option>
                    ))}
                  </select>
                )}
                {selectedRescheduleSlot && (
                  <p className="text-xs text-muted-foreground">
                    Session duration: 1 hour 15 minutes
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRescheduleDialogOpen(false)}
                disabled={rescheduleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={rescheduleMutation.isPending || !selectedRescheduleSlot || !rescheduleDate}
              >
                {rescheduleMutation.isPending ? (
                  <>
                    <LottieLoader isVisible={true} className="mr-2 h-4 w-4" />
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule Session'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
