import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { faCalendar, faClock, faBookOpen, faUserGraduate } from '@fortawesome/free-solid-svg-icons'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { teacherScheduleSession, type TeacherScheduleSessionRequest } from '../api/session-api'
import { getTeacherFocusOnes, type FocusOne } from '@/features/focus-one/api/focus-one-api'
import { notifySuccess, notifyError, handleApiError } from '@/lib/notifications'
import { LottieLoader } from '@/components/ui/lottie-loader'

interface TeacherScheduleSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialFocusOneId?: string // Optional: Pre-select a FocusOne when opening from a specific card
}

export function TeacherScheduleSessionDialog({
  open,
  onOpenChange,
  onSuccess,
  initialFocusOneId,
}: TeacherScheduleSessionDialogProps) {
  const [selectedFocusOne, setSelectedFocusOne] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch teacher's FocusOnes
  const { data: focusOnesData, isLoading: focusOnesLoading } = useQuery({
    queryKey: ['teacherFocusOnes'],
    queryFn: () => getTeacherFocusOnes({ limit: 100 }),
    enabled: open,
  })

  const focusOnes = focusOnesData?.data?.focusOnes || []

  // Get selected FocusOne details
  const selectedFocusOneData = useMemo(() => {
    return focusOnes.find(fo => fo._id === selectedFocusOne)
  }, [focusOnes, selectedFocusOne])

  // Extract subjects from selected FocusOne
  const subjects = useMemo(() => {
    if (!selectedFocusOneData?.teacherSubjectMappings) return []
    const subjectMap = new Map()
    selectedFocusOneData.teacherSubjectMappings.forEach((mapping) => {
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
    return Array.from(subjectMap.values())
  }, [selectedFocusOneData])

  // Calculate minimum date (today)
  const minDate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return ''
    return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [selectedDate])

  // Calculate end time (75 minutes after start time)
  const endTime = useMemo(() => {
    if (!selectedTime) return ''
    const timeParts = selectedTime.split(':')
    if (timeParts.length !== 2) return ''
    const hours = Number(timeParts[0])
    const minutes = Number(timeParts[1])
    if (isNaN(hours) || isNaN(minutes)) return ''
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    const endDate = new Date(startDate.getTime() + 75 * 60 * 1000) // 75 minutes
    return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
  }, [selectedTime])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFocusOne('')
      setSelectedSubject('')
      setSelectedDate('')
      setSelectedTime('')
      setTitle('')
      setDescription('')
      setErrors({})
    }
  }, [open])

  // Set initial FocusOne when dialog opens with initialFocusOneId
  useEffect(() => {
    if (open && initialFocusOneId) {
      if (focusOnes.length > 0) {
        // Check if the initialFocusOneId exists in the focusOnes list
        const focusOneExists = focusOnes.some(fo => fo._id === initialFocusOneId)
        if (focusOneExists) {
          setSelectedFocusOne(initialFocusOneId)
        }
      }
    } else if (open && !initialFocusOneId) {
      // Reset when opening without an initialFocusOneId (from calendar page)
      setSelectedFocusOne('')
      setSelectedSubject('')
      setSelectedDate('')
      setSelectedTime('')
      setTitle('')
      setDescription('')
      setErrors({})
    }
  }, [open, initialFocusOneId, focusOnes])

  // Reset subject when FocusOne changes
  useEffect(() => {
    setSelectedSubject('')
  }, [selectedFocusOne])

  const scheduleMutation = useMutation({
    mutationFn: teacherScheduleSession,
    onSuccess: (response) => {
      notifySuccess(response.message, 'Session scheduled successfully!')
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Failed to schedule session')
      if (fieldErrors) {
        setErrors(fieldErrors as Record<string, string>)
      }
      if (message && !fieldErrors) {
        notifyError(message, 'Failed to schedule session')
      }
    },
  })

  const handleFocusOneChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedFocusOne(value)
    if (errors.focusOne) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.focusOne
        return next
      })
    }
  }, [errors.focusOne])

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

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    if (errors.date) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.date
        return next
      })
    }
  }, [errors.date])

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value)
    if (errors.time) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.time
        return next
      })
    }
  }, [errors.time])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (errors.title) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.title
        return next
      })
    }
  }, [errors.title])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    if (errors.description) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.description
        return next
      })
    }
  }, [errors.description])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!selectedFocusOne) newErrors.focusOne = 'Please select a Focus One program'
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!description.trim()) {
      newErrors.description = 'Reason/description is required'
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Build request
    // If date and time are provided, use them. Otherwise, schedule for immediate (now)
    let startDateTime: Date
    if (selectedDate && selectedTime) {
      startDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
    } else {
      // Immediate meeting - start now
      startDateTime = new Date()
      // Round up to the next minute
      startDateTime.setSeconds(0, 0)
      startDateTime.setMinutes(startDateTime.getMinutes() + 1)
    }
    
    const endDateTime = new Date(startDateTime.getTime() + 75 * 60 * 1000) // 75 minutes

    const request: TeacherScheduleSessionRequest = {
      title: title.trim(),
      description: description.trim(),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      focusOne: selectedFocusOne,
      ...(selectedSubject ? { subject: selectedSubject } : {}),
    }

    scheduleMutation.mutate(request)
  }, [selectedFocusOne, selectedSubject, selectedDate, selectedTime, title, description, scheduleMutation])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Schedule Session</DialogTitle>
          <DialogDescription>
            Schedule a session directly with a student. The session will be created immediately without requiring approval. Leave date and time empty for an immediate meeting starting now.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Focus One Selection */}
          <div className="space-y-2">
            <Label htmlFor="focusOne" className="text-sm font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faUserGraduate} className="h-4 w-4" />
              Focus One Program <span className="text-destructive">*</span>
            </Label>
            {focusOnesLoading ? (
              <div className="flex items-center justify-center py-4">
                <LottieLoader isVisible={true} overlay={false} size="small" />
              </div>
            ) : (
              <select
                id="focusOne"
                value={selectedFocusOne}
                onChange={handleFocusOneChange}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.focusOne ? 'border-destructive' : ''
                }`}
              >
                <option value="">Select a Focus One program</option>
                {focusOnes.map((focusOne) => (
                  <option key={focusOne._id} value={focusOne._id}>
                    {focusOne.student?.name || 'Unknown Student'} - {focusOne.description || focusOne._id}
                  </option>
                ))}
              </select>
            )}
            {errors.focusOne && <p className="text-sm text-destructive">{errors.focusOne}</p>}
          </div>

          {/* Subject Selection (optional) */}
          {selectedFocusOne && subjects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faBookOpen} className="h-4 w-4" />
                Subject (Optional)
              </Label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a subject (optional)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
              Date (Optional - leave empty for immediate meeting)
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={minDate}
              className={errors.date ? 'border-destructive' : ''}
            />
            {selectedDate && (
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            )}
            {!selectedDate && (
              <p className="text-xs text-muted-foreground">
                Leave empty to schedule an immediate meeting starting now
              </p>
            )}
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                Start Time (Optional)
              </Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                min="09:00"
                max="19:45"
                className={errors.time ? 'border-destructive' : ''}
              />
              {selectedTime && endTime && (
                <p className="text-xs text-muted-foreground">
                  End Time: {endTime} (Duration: 1 hour 15 minutes)
                </p>
              )}
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Session Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter session title"
              className={errors.title ? 'border-destructive' : ''}
              required
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 characters
            </p>
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Description/Reason */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Reason/Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter the reason or description for this session (minimum 10 characters)"
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
              required
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters (minimum 10 characters)
            </p>
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={scheduleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={scheduleMutation.isPending || !selectedFocusOne || !title.trim() || !description.trim() || description.trim().length < 10}
            >
              {scheduleMutation.isPending ? (
                <>
                  <LottieLoader className="mr-2 h-4 w-4" isVisible={true} overlay={false} size="small" />
                  <span>Scheduling...</span>
                </>
              ) : (
                'Schedule Session'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

