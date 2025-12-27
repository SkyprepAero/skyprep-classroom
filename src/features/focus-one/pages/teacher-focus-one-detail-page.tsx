import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { faUserGraduate, faBookOpen, faChalkboardTeacher, faCalendar, faArrowLeft, faEnvelope, faPhone, faMapMarkerAlt, faClock, faVideo } from '@fortawesome/free-solid-svg-icons'
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
import { LottieLoader } from '@/components/ui/lottie-loader'
import { getTeacherFocusOneById } from '../api/focus-one-api'
import { getSessions, type Session } from '@/features/sessions/api/session-api'
import { cn } from '@/lib/utils'

export function TeacherFocusOneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherFocusOne', id],
    queryFn: () => getTeacherFocusOneById(id!),
    enabled: !!id,
  })

  // Fetch session requests for this FocusOne
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['focusOneSessions', id],
    queryFn: () => getSessions({ focusOne: id, limit: 10, status: 'requested' }),
    enabled: !!id,
  })

  const sessions = sessionsData?.data.sessions || []

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const getStatusBadgeVariant = (status: Session['status']) => {
    switch (status) {
      case 'requested':
        return 'yellow'
      case 'scheduled':
        return 'blue'
      case 'completed':
        return 'green'
      case 'rejected':
      case 'cancelled':
        return 'red'
      default:
        return 'gray'
    }
  }

  if (isLoading) {
    return (
      <LottieLoader
        isVisible={true}
        overlay={false}
        size="medium"
        message="Loading Focus One details..."
      />
    )
  }

  if (error || !data?.data) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/teacher/focus-ones')}
          className="mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
          Back to Focus Ones
        </Button>
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load Focus One details. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const focusOne = data.data
  const subjects = focusOne.teacherSubjectMappings?.map(m => m.subject) || []
  const uniqueSubjects = Array.from(
    new Map(subjects.map(s => [s._id, s])).values()
  )
  const teachers = focusOne.teacherSubjectMappings?.map(m => m.teacher) || []
  const uniqueTeachers = Array.from(
    new Map(teachers.map(t => [t._id, t])).values()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/teacher/focus-ones')}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Focus One Program Details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View detailed information about this Focus One program
          </p>
        </div>
      </div>

      {/* Program Overview */}
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faUserGraduate} className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Program Overview</CardTitle>
                {focusOne.description && (
                  <CardDescription className="mt-1">{focusOne.description}</CardDescription>
                )}
              </div>
            </div>
            <Badge
              variant={focusOne.status === 'active' ? 'default' : 'secondary'}
              className={cn(
                focusOne.status === 'active' && focusOne.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : focusOne.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : ''
              )}
            >
              {focusOne.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
              <p className="text-base font-semibold text-foreground">
                {formatDate(focusOne.enrolledAt)}
              </p>
            </div>
            {focusOne.startedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-base font-semibold text-foreground">
                  {formatDate(focusOne.startedAt)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Information */}
      {focusOne.student && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faUserGraduate} className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Student Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base font-semibold text-foreground">
                  {focusOne.student.name || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-foreground">{focusOne.student.email}</p>
              </div>
              {focusOne.student.phoneNumber && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">{focusOne.student.phoneNumber}</p>
                </div>
              )}
              {focusOne.student.city && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">{focusOne.student.city}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      {uniqueSubjects.length > 0 && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faBookOpen} className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Subjects</CardTitle>
            </div>
            <CardDescription className="ml-11">Subjects in this program</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueSubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="rounded-lg border border-gray-200 bg-card p-4 shadow-sm hover:border-primary transition-colors duration-200"
                >
                  <p className="font-semibold text-foreground">{subject.name}</p>
                  {subject.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{subject.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teachers */}
      {uniqueTeachers.length > 0 && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Assigned Teachers</CardTitle>
            </div>
            <CardDescription className="ml-11">Teachers assigned to this program</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueTeachers.map((teacher) => (
                <div
                  key={teacher._id}
                  className="rounded-lg border border-gray-200 bg-card p-4 shadow-sm hover:border-primary transition-colors duration-200 flex items-center gap-3"
                >
                  <div className="flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700 flex items-center justify-center text-blue-800 dark:text-blue-100 font-bold text-lg shadow-sm">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-semibold text-foreground">{teacher.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{teacher.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Requests */}
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faCalendar} className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Session Requests</CardTitle>
                <CardDescription className="mt-1">Pending session requests for this program</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/session-requests')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LottieLoader className="h-8 w-8" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No pending session requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session._id}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(session.status)} className="capitalize">
                          {session.status}
                        </Badge>
                        {session.subject && (
                          <span className="text-sm text-muted-foreground">
                            <FontAwesomeIcon icon={faBookOpen} className="h-3 w-3 mr-1" />
                            {session.subject.name}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-foreground">{session.title}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendar} className="h-3 w-3" />
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                          <span>
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </span>
                        </div>
                        {session.requestedBy && (
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faUserGraduate} className="h-3 w-3" />
                            <span>{session.requestedBy.name || session.requestedBy.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/session-requests`)}
                      className="ml-4"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              {sessions.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/app/session-requests')}
                  >
                    View all {sessions.length} requests
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

