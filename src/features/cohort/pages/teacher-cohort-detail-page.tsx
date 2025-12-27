import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { faUsers, faBookOpen, faCalendar, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
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
import { getTeacherCohortById } from '../api/cohort-api'
import { cn } from '@/lib/utils'

export function TeacherCohortDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherCohort', id],
    queryFn: () => getTeacherCohortById(id!),
    enabled: !!id,
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <LottieLoader
        isVisible={true}
        overlay={false}
        size="medium"
        message="Loading Cohort details..."
      />
    )
  }

  if (error || !data?.data) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/teacher/cohorts')}
          className="mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
          Back to Cohorts
        </Button>
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load Cohort details. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cohort = data.data
  const subjects = cohort.subjects?.filter(s => s.isActive).map(s => s.subject) || []
  const uniqueSubjects = Array.from(
    new Map(subjects.map(s => [s._id, s])).values()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/teacher/cohorts')}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cohort Program Details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View detailed information about this Cohort program
          </p>
        </div>
      </div>

      {/* Program Overview */}
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{cohort.name}</CardTitle>
                {cohort.description && (
                  <CardDescription className="mt-1">{cohort.description}</CardDescription>
                )}
              </div>
            </div>
            <Badge
              variant={cohort.status === 'active' ? 'default' : 'secondary'}
              className={cn(
                cohort.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : cohort.status === 'planned'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : ''
              )}
            >
              {cohort.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {cohort.startDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-base font-semibold text-foreground">
                  {formatDate(cohort.startDate)}
                </p>
              </div>
            )}
            {cohort.endDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                <p className="text-base font-semibold text-foreground">
                  {formatDate(cohort.endDate)}
                </p>
              </div>
            )}
            {cohort.capacity && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                <p className="text-base font-semibold text-foreground">
                  {cohort.capacity} students
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
            <CardDescription className="ml-11">Subjects in this cohort</CardDescription>
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
    </div>
  )
}


