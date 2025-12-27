import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { faUserGraduate, faBookOpen, faChalkboardTeacher, faCalendarPlus, faEnvelope, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEnrollment } from '@/hooks/use-enrollment'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { cn } from '@/lib/utils'
import { RequestSessionDialog } from '@/features/sessions/components/request-session-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function FocusOnePage() {
  const navigate = useNavigate()
  const { enrollment, loading, error } = useEnrollment()
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false)

  if (loading) {
    return (
      <LottieLoader
        isVisible={true}
        overlay={false}
        size="medium"
        message="Loading your Focus One program..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Focus One
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One-to-one personalized learning program
          </p>
        </section>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error.message || 'Failed to load enrollment details'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!enrollment || enrollment.type !== 'focusOne') {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Focus One
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One-to-one personalized learning program
          </p>
        </section>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              You are not enrolled in a Focus One program.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { enrollment: focusOne } = enrollment

  // Extract subjects with their teachers from teacherSubjectMappings - Memoized
  const subjectsWithTeachers = useMemo(() => {
    // Try enrollment.teacherSubjectMappings first (user-level mappings)
    const mappings = enrollment.teacherSubjectMappings || focusOne.teacherSubjectMappings || []
    
    // Group by subject and collect teachers
    const subjectMap = new Map()
    mappings.forEach((mapping: any) => {
      const subject = mapping.subject || mapping
      const teacher = mapping.teacher || mapping
      if (subject && subject.id) {
        if (!subjectMap.has(subject.id)) {
          subjectMap.set(subject.id, {
            id: subject.id,
            name: subject.name,
            description: subject.description,
            teachers: []
          })
        }
        // Add teacher to this subject if not already added
        if (teacher && teacher.id) {
          const subjectData = subjectMap.get(subject.id)
          const teacherExists = subjectData.teachers.some((t: any) => t.id === teacher.id)
          if (!teacherExists) {
            subjectData.teachers.push({
              id: teacher.id,
              name: teacher.name,
              email: teacher.email
            })
          }
        }
      }
    })
    
    return Array.from(subjectMap.values())
  }, [enrollment.teacherSubjectMappings, focusOne.teacherSubjectMappings])

  // Extract unique teachers from teacherSubjectMappings - Memoized
  const teachers = useMemo(() => {
    const mappings = enrollment.teacherSubjectMappings || focusOne.teacherSubjectMappings || []
    const teacherMap = new Map()
    mappings.forEach((mapping: any) => {
      const teacher = mapping.teacher || mapping
      if (teacher && teacher.id) {
        if (!teacherMap.has(teacher.id)) {
          teacherMap.set(teacher.id, {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
          })
        }
      }
    })
    return Array.from(teacherMap.values())
  }, [enrollment.teacherSubjectMappings, focusOne.teacherSubjectMappings])

  // Memoize formatted dates
  const formattedEnrolledDate = useMemo(() => {
    if (!enrollment.enrolledAt) return 'N/A'
    return new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [enrollment.enrolledAt])

  const formattedStartDate = useMemo(() => {
    if (!enrollment.startedAt) return null
    return new Date(enrollment.startedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [enrollment.startedAt])

  // Check if session requests are allowed
  const canRequestSession = useMemo(() => {
    // Check if program is active (not paused or cancelled)
    if (focusOne.status !== 'active') {
      return false
    }

    // Check if program is active (isActive flag)
    if (!focusOne.isActive) {
      return false
    }

    // Check if program is cancelled
    if (focusOne.isCancelled) {
      return false
    }

    // TODO: Re-enable in production - Check if program has started (if startedAt exists, today must be >= startedAt)
    // if (focusOne.startedAt) {
    //   const today = new Date()
    //   today.setHours(0, 0, 0, 0)
    //   const startDate = new Date(focusOne.startedAt)
    //   startDate.setHours(0, 0, 0, 0)
    //   
    //   if (today < startDate) {
    //     return false
    //   }
    // }

    // Check if subjects are available
    if (subjectsWithTeachers.length === 0) {
      return false
    }

    return true
  }, [focusOne.status, focusOne.isActive, focusOne.isCancelled, focusOne.startedAt, subjectsWithTeachers.length])

  // Get reason why session requests are disabled
  const sessionDisabledReason = useMemo(() => {
    if (focusOne.status !== 'active') {
      return 'Session requests are not available for paused or cancelled programs'
    }
    if (!focusOne.isActive) {
      return 'Session requests are not available for inactive programs'
    }
    if (focusOne.isCancelled) {
      return 'Session requests are not available for cancelled programs'
    }
    // TODO: Re-enable in production
    // if (focusOne.startedAt) {
    //   const today = new Date()
    //   today.setHours(0, 0, 0, 0)
    //   const startDate = new Date(focusOne.startedAt)
    //   startDate.setHours(0, 0, 0, 0)
    //   
    //   if (today < startDate) {
    //     return `Session requests will be available after ${formattedStartDate || 'the program start date'}`
    //   }
    // }
    if (subjectsWithTeachers.length === 0) {
      return 'No subjects available. Please contact support to assign subjects to your program.'
    }
    return null
  }, [focusOne.status, focusOne.isActive, focusOne.isCancelled, focusOne.startedAt, formattedStartDate, subjectsWithTeachers.length])

  // Memoize callbacks
  const handleOpenDialog = useCallback(() => {
    setIsRequestDialogOpen(true)
  }, [])

  const handleDialogSuccess = useCallback(() => {
    // Optionally refresh data or show success message
  }, [])

  const handleTeacherClick = useCallback((teacher: { id: string; name: string; email: string }) => {
    setSelectedTeacher(teacher)
    setIsTeacherDialogOpen(true)
  }, [])

  const handleCloseTeacherDialog = useCallback(() => {
    setIsTeacherDialogOpen(false)
    setSelectedTeacher(null)
  }, [])

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl shadow-sm">
            <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Focus One Program
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your personalized one-to-one learning experience
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Request Session Card */}
        <Card className="border border-border/60 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-background to-muted/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Schedule a Session</h3>
                <p className="text-sm text-muted-foreground">
                  Book a personalized one-on-one session with your teacher
                </p>
              </div>
              <Button
                onClick={handleOpenDialog}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 w-full"
                disabled={!canRequestSession}
              >
                <FontAwesomeIcon icon={faCalendarPlus} className="h-4 w-4 mr-2" />
                Book Session
              </Button>
              {!canRequestSession && sessionDisabledReason && (
                <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-3 w-full">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {sessionDisabledReason}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Shortcut Card */}
        <Card 
          className="border border-border/60 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-background to-muted/20 cursor-pointer"
          onClick={() => navigate('/app/calendar')}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 w-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <FontAwesomeIcon icon={faCalendar} className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-bold text-foreground">My Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    View all your sessions and manage your schedule
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full"
                onClick={(e) => { 
                  e.stopPropagation()
                  navigate('/app/calendar') 
                }}
              >
                <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 mr-2" />
                Open Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Overview */}
      <Card className="border border-border/60 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FontAwesomeIcon icon={faUserGraduate} className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Program Overview</CardTitle>
              <CardDescription className="mt-1">
                {focusOne.description || 'Your personalized learning program'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
              <p className="text-base font-semibold text-foreground">
                {formattedEnrolledDate}
              </p>
            </div>
            {formattedStartDate && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-base font-semibold text-foreground">
                  {formattedStartDate}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm',
                  enrollment.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                )}
              >
                {enrollment.status || 'active'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      {subjectsWithTeachers.length > 0 && (
        <Card className="border border-border/60 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faBookOpen} className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Subjects</CardTitle>
                <CardDescription className="mt-1">Subjects you are enrolled in and their teachers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjectsWithTeachers.map((subject) => (
                <div
                  key={subject.id}
                  className="group rounded-lg border border-border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                >
                  <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                    {subject.name}
                  </p>
                  {subject.description && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {subject.description}
                    </p>
                  )}
                  {subject.teachers && subject.teachers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Taught by:
                      </p>
                      <div className="space-y-2">
                        {subject.teachers.map((teacher: any) => (
                          <div
                            key={teacher.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {teacher.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p className="font-medium text-foreground truncate">
                              {teacher.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teachers */}
      {teachers.length > 0 && (
        <Card className="border border-border/60 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Your Teachers</CardTitle>
                <CardDescription className="mt-1">Teachers assigned to your program</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleTeacherClick(teacher)}
                  className="group text-left rounded-lg border border-border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                      <span className="text-sm font-bold text-primary">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                        {teacher.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground truncate">
                        {teacher.email}
                      </p>
                      <p className="mt-2 text-xs text-primary font-medium">
                        Click to view details →
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Session Dialog */}
      <RequestSessionDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        focusOneId={focusOne.id}
        subjects={subjectsWithTeachers.map(s => ({ id: s.id, name: s.name, description: s.description }))}
        programStartDate={focusOne.startedAt}
        onSuccess={handleDialogSuccess}
      />

      {/* Teacher Details Dialog */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={handleCloseTeacherDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Teacher Details</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-4 ring-primary/10">
                  <span className="text-2xl font-bold text-primary">
                    {selectedTeacher.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {selectedTeacher.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5" />
                    <span>{selectedTeacher.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Subjects Taught
                </h4>
                <div className="space-y-2">
                  {subjectsWithTeachers
                    .filter(subject => 
                      subject.teachers.some((t: any) => t.id === selectedTeacher.id)
                    )
                    .map(subject => (
                      <div
                        key={subject.id}
                        className="rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <p className="font-medium text-foreground">{subject.name}</p>
                        {subject.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

