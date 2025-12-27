import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { faCalendar, faClock, faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { requestSession, type RequestSessionRequest, getAvailableSlots, type AvailableSlot } from '../api/session-api'
import { notifySuccess, notifyError, handleApiError } from '@/lib/notifications'
import { LottieLoader } from '@/components/ui/lottie-loader'

interface RequestSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  focusOneId: string
  subjects?: Array<{
    id: string
    name: string
    description?: string
  }>
  programStartDate?: string // ISO date string of program start date
  onSuccess?: () => void
}

// Helper function to convert time slot to HH:MM format for comparison
const slotToTimeFormat = (slot: AvailableSlot) => {
  const startDate = new Date(slot.startTime)
  const endDate = new Date(slot.endTime)
  const startHour = startDate.getHours()
  const startMin = startDate.getMinutes()
  const endHour = endDate.getHours()
  const endMin = endDate.getMinutes()
  
  return {
    startTime: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
    endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
    startTimeFormatted: slot.startTimeFormatted,
    endTimeFormatted: slot.endTimeFormatted,
    startDateTime: startDate,
    endDateTime: endDate,
  }
}

// Get minimum date (at least one day after program start date, or tomorrow if no start date, skipping Sundays)
const getMinDate = (programStartDate?: string): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let minDate: Date
  
  if (programStartDate) {
    // Program has a start date - minimum is one day after start date
    const startDate = new Date(programStartDate)
    startDate.setHours(0, 0, 0, 0)
    minDate = new Date(startDate)
    minDate.setDate(startDate.getDate() + 1) // One day after start date
  } else {
    // No start date - minimum is tomorrow
    minDate = new Date(today)
    minDate.setDate(today.getDate() + 1)
  }
  
  // Skip Sundays
  if (minDate.getDay() === 0) {
    minDate.setDate(minDate.getDate() + 1)
  }
  
  // Ensure it's at least tomorrow (cannot schedule for today)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (tomorrow.getDay() === 0) {
    tomorrow.setDate(tomorrow.getDate() + 1)
  }
  
  if (minDate < tomorrow) {
    minDate = tomorrow
  }
  
  const isoString = minDate.toISOString().split('T')[0]
  return isoString || ''
}

// Format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}


export function RequestSessionDialog({
  open,
  onOpenChange,
  focusOneId,
  subjects = [],
  programStartDate,
  onSuccess,
}: RequestSessionDialogProps) {
  type SelectedSlot = {
    startTime: string
    endTime: string
    startTimeFormatted: string
    endTimeFormatted: string
    startDateTime: Date
    endDateTime: Date
  }

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch available slots when subject and date are selected
  const { data: availableSlotsData, isLoading: isLoadingSlots, error: slotsError } = useQuery({
    queryKey: ['availableSlots', focusOneId, selectedSubject, selectedDate],
    queryFn: () => {
      if (!selectedSubject || !selectedDate) {
        return Promise.resolve(null)
      }
      return getAvailableSlots({
        focusOne: focusOneId,
        subject: selectedSubject,
        date: selectedDate,
        duration: 75, // 1 hour 15 minutes sessions
      })
    },
    enabled: !!selectedSubject && !!selectedDate && open,
    staleTime: 30000, // Consider data fresh for 30 seconds
  })

  // Calculate minimum date based on program start date
  const minDate = useMemo(() => getMinDate(programStartDate), [programStartDate])
  const minDateObj = useMemo(() => new Date(minDate + 'T00:00:00'), [minDate])
  
  // Initialize selectedDate when dialog opens (default to minimum date)
  useEffect(() => {
    if (open) {
      setSelectedDate(minDate)
    }
  }, [open, minDate])
  
  // Memoize formatted date string from selected date
  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return minDateObj
    return new Date(selectedDate + 'T00:00:00')
  }, [selectedDate, minDateObj])
  
  const formattedDate = useMemo(() => formatDate(selectedDateObj), [selectedDateObj])
  
  // Memoize available slots
  const availableSlots = useMemo(() => {
    if (!availableSlotsData?.data?.availableSlots) {
      return []
    }
    return availableSlotsData.data.availableSlots.map(slotToTimeFormat)
  }, [availableSlotsData])

  // Memoize selected subject data
  const selectedSubjectData = useMemo(
    () => subjects.find(s => s.id === selectedSubject),
    [subjects, selectedSubject]
  )
  
  // Memoize formatted times from selected slot
  const formattedStartTime = useMemo(() => {
    if (!selectedSlot) return ''
    return selectedSlot.startTimeFormatted
  }, [selectedSlot])

  const formattedEndTime = useMemo(() => {
    if (!selectedSlot) return ''
    return selectedSlot.endTimeFormatted
  }, [selectedSlot])

  const duration = useMemo(() => {
    if (!selectedSlot) return ''
    // Sessions are 75 minutes (1 hour 15 minutes)
    return '1 hour 15 minutes'
  }, [selectedSlot])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedSlot(null)
      setSelectedSubject('')
      setSelectedDate('')
      setErrors({})
    }
  }, [open])

  // Reset selected slot when subject or date changes
  useEffect(() => {
    setSelectedSlot(null)
  }, [selectedSubject, selectedDate])

  // Note: We don't auto-select the first slot anymore since we're using a dropdown

  const requestMutation = useMutation({
    mutationFn: requestSession,
    onSuccess: (response) => {
      notifySuccess(response.message, 'Session request submitted successfully!')
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Failed to request session')
      if (fieldErrors) {
        setErrors(fieldErrors as Record<string, string>)
      }
      if (message && !fieldErrors) {
        notifyError(message, 'Failed to request session')
      }
    },
  })

  // Memoize handlers to prevent unnecessary re-renders
  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedSubject(value)
    if (errors.subject) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.subject
        return next
      })
    }
  }, [errors.subject])

  const handleSlotChange = useCallback((slotIndex: number) => {
    if (availableSlots[slotIndex]) {
      setSelectedSlot(availableSlots[slotIndex])
      if (errors.slot) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.slot
          return next
        })
      }
    }
  }, [availableSlots, errors.slot])

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelectedDate(value)
    
    // Validate date
    if (value) {
      const selected = new Date(value + 'T00:00:00')
      selected.setHours(0, 0, 0, 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Check if same day (cannot schedule for today)
      if (selected.getTime() === today.getTime()) {
        setErrors((prev) => ({ ...prev, date: 'Sessions must be scheduled at least one day in advance' }))
        return
      }
      
      // Check if before today
      if (selected < today) {
        setErrors((prev) => ({ ...prev, date: 'Cannot schedule sessions in the past' }))
        return
      }
      
      // Check if before minimum date (one day after program start)
      if (selected < minDateObj) {
        const minDateFormatted = formatDate(minDateObj)
        setErrors((prev) => ({ ...prev, date: `Sessions can only be scheduled from ${minDateFormatted} onwards (at least one day after program start date)` }))
        return
      }
      
      // Check if Sunday
      if (selected.getDay() === 0) {
        setErrors((prev) => ({ ...prev, date: 'Sessions cannot be scheduled on Sundays' }))
        return
      }
      
      // Clear date error if valid
      if (errors.date) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.date
          return next
        })
      }
    }
  }, [errors.date, minDateObj])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    
    // Subject is required
    if (!selectedSubject.trim()) {
      newErrors.subject = 'Please select a subject'
    }
    
    // Date is required
    if (!selectedDate) {
      newErrors.date = 'Please select a date'
    } else {
      const selected = new Date(selectedDate + 'T00:00:00')
      selected.setHours(0, 0, 0, 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Check if same day (cannot schedule for today)
      if (selected.getTime() === today.getTime()) {
        newErrors.date = 'Sessions must be scheduled at least one day in advance'
      }
      // Check if before today
      else if (selected < today) {
        newErrors.date = 'Cannot schedule sessions in the past'
      }
      // Check if before minimum date (one day after program start)
      else if (selected < minDateObj) {
        const minDateFormatted = formatDate(minDateObj)
        newErrors.date = `Sessions can only be scheduled from ${minDateFormatted} onwards (at least one day after program start date)`
      }
      // Check if Sunday
      else if (selected.getDay() === 0) {
        newErrors.date = 'Sessions cannot be scheduled on Sundays'
      }
    }

    // Validate slot is selected
    if (!selectedSlot) {
      newErrors.slot = 'Please select an available time slot'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!selectedSlot) {
      return
    }

    // Auto-generate title based on subject and date/time
    const subjectName = selectedSubjectData?.name || 'Session'
    const autoTitle = `${subjectName} Session - ${formattedDate} at ${formattedStartTime}`

    const request: RequestSessionRequest = {
      title: autoTitle,
      startTime: selectedSlot.startDateTime.toISOString(),
      endTime: selectedSlot.endDateTime.toISOString(),
      focusOne: focusOneId,
      subject: selectedSubject,
    }

    requestMutation.mutate(request)
  }, [selectedSubject, selectedDate, selectedSlot, selectedSubjectData, formattedDate, formattedStartTime, focusOneId, requestMutation, minDateObj])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Schedule a Session</DialogTitle>
          <DialogDescription>
            Book a personalized one-on-one session with your teacher.
            Select a date (at least one day after your program start date), choose a time between 9 AM and 9 PM. Sessions are not available on Sundays.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject Selection - Required and First */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faBookOpen} className="h-4 w-4" />
              Subject <span className="text-red-500">*</span>
            </Label>
            {subjects.length > 0 ? (
              <>
                <select
                  id="subject"
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  disabled={requestMutation.isPending}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.subject ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
              </>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No subjects available. Please contact support to assign subjects to your program.
                </p>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="sessionDate" className="text-sm font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
              Session Date <span className="text-red-500">*</span>
            </Label>
            <input
              id="sessionDate"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={minDate}
              disabled={requestMutation.isPending}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.date ? 'border-red-500' : ''}`}
            />
            {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
            {selectedDate && !errors.date && (
              <p className="text-xs text-muted-foreground">
                Selected: {formattedDate}
              </p>
            )}
            {!selectedDate && (
              <p className="text-xs text-muted-foreground">
                Sessions can be scheduled for any date at least one day after your program start date (Sundays excluded)
              </p>
            )}
          </div>

          {/* Available Time Slots Selection */}
          {selectedSubject && selectedDate && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                Available Time Slots <span className="text-red-500">*</span>
              </Label>
              
              {isLoadingSlots && (
                <div className="flex items-center justify-center p-8">
                  <LottieLoader className="h-8 w-8" isVisible={true} />
                  <span className="ml-2 text-sm text-muted-foreground">Loading available slots...</span>
                </div>
              )}

              {slotsError && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Failed to load available slots. Please try again.
                  </p>
                </div>
              )}

              {!isLoadingSlots && !slotsError && availableSlots.length === 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    No available time slots for this date. All teachers have reached their maximum of 4 sessions per day or all slots are booked. Please try a different date.
                  </p>
                </div>
              )}

              {!isLoadingSlots && !slotsError && availableSlots.length > 0 && (
                <>
                  <select
                    value={selectedSlot ? `${selectedSlot.startTime}-${selectedSlot.endTime}` : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) {
                        const [startTime, endTime] = value.split('-')
                        const slot = availableSlots.find(
                          s => s.startTime === startTime && s.endTime === endTime
                        )
                        if (slot) {
                          const slotIndex = availableSlots.findIndex(
                            s => s.startTime === startTime && s.endTime === endTime
                          )
                          handleSlotChange(slotIndex)
                        }
                      } else {
                        setSelectedSlot(null)
                      }
                    }}
                    disabled={requestMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot, index) => (
                      <option
                        key={index}
                        value={`${slot.startTime}-${slot.endTime}`}
                      >
                        {slot.startTimeFormatted} - {slot.endTimeFormatted}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select an available time slot. Sessions are 1 hour 15 minutes. Teachers can take up to 4 sessions per day with 15-minute breaks between sessions.
                  </p>
                </>
              )}

              {errors.slot && <p className="text-sm text-red-600">{errors.slot}</p>}
            </div>
          )}

          {(!selectedSubject || !selectedDate) && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                Available Time Slots
              </Label>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Please select a subject and date to see available time slots
                </p>
              </div>
            </div>
          )}

          {/* Session Summary */}
          {selectedSubject && selectedSubjectData && selectedSlot && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Session Summary</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Subject:</span> {selectedSubjectData.name}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {formattedDate}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {formattedStartTime} - {formattedEndTime}
                </p>
                <p>
                  <span className="font-medium">Duration:</span> {duration}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={requestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={requestMutation.isPending || !selectedSubject || !selectedSlot || isLoadingSlots || availableSlots.length === 0}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {requestMutation.isPending ? (
                <>
                  <LottieLoader className="mr-2 h-4 w-4" isVisible={true} />
                  Submitting...
                </>
              ) : (
                'Request Session'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

