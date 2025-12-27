import { faUsers, faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEnrollment } from '@/hooks/use-enrollment'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { cn } from '@/lib/utils'

export function CohortPage() {
  const { enrollment, loading, error } = useEnrollment()

  if (loading) {
    return (
      <LottieLoader
        isVisible={true}
        overlay={false}
        size="medium"
        message="Loading your Cohort program..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cohort
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group learning program
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

  if (!enrollment || enrollment.type !== 'cohort') {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Cohort
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group learning program
          </p>
        </section>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              You are not enrolled in a Cohort program.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { enrollment: cohort } = enrollment

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {cohort.name || 'Cohort Program'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {cohort.description || 'Your group learning program'}
        </p>
      </section>

      {/* Program Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-primary" />
            <CardTitle>Program Overview</CardTitle>
          </div>
          <CardDescription>
            Cohort details and schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1',
                  cohort.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : cohort.status === 'completed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                )}
              >
                {cohort.status || 'active'}
              </span>
            </div>
            {cohort.startDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(cohort.startDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {cohort.endDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(cohort.endDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
              <p className="text-sm font-semibold text-foreground">
                {enrollment.enrolledAt
                  ? new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
            {enrollment.startedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Start Date</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(enrollment.startedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {enrollment.joinedViaWaitlist && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Waitlist</p>
                <p className="text-sm font-semibold text-foreground">Joined via waitlist</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      {cohort.subjects && cohort.subjects.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBookOpen} className="h-5 w-5 text-primary" />
              <CardTitle>Subjects</CardTitle>
            </div>
            <CardDescription>Subjects covered in this cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cohort.subjects
                .filter((subject) => subject.isActive !== false)
                .map((subject) => (
                  <div
                    key={subject.id}
                    className="rounded-lg border border-border bg-card p-4 shadow-sm"
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

