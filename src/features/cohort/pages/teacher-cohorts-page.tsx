import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { faUsers, faBookOpen, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { getTeacherCohorts, type Cohort } from '../api/cohort-api'
import { cn } from '@/lib/utils'

export function TeacherCohortsPage() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherCohorts', page],
    queryFn: () => getTeacherCohorts({ page, limit: 10 }),
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
        message="Loading your Cohort programs..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            My Cohort Programs
          </h1>
        </section>
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load Cohort programs. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cohorts = data?.data?.cohorts || []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Cohort Programs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all Cohort programs you are assigned to as a teacher
        </p>
      </section>

      {cohorts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faUsers} className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                You are not assigned to any Cohort programs at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((cohort) => {
            const subjects = cohort.subjects?.filter(s => s.isActive).map(s => s.subject) || []
            const uniqueSubjects = Array.from(
              new Map(subjects.map(s => [s._id, s])).values()
            )

            return (
              <Card key={cohort._id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{cohort.name}</CardTitle>
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
                  {cohort.description && (
                    <CardDescription className="mt-1">{cohort.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {uniqueSubjects.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faBookOpen} className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Subjects</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSubjects.map((subject) => (
                          <Badge key={subject._id} variant="outline" className="text-xs">
                            {subject.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {cohort.startDate && (
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="h-3 w-3" />
                        <span>Start: {formatDate(cohort.startDate)}</span>
                      </div>
                    )}
                    {cohort.endDate && (
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="h-3 w-3" />
                        <span>End: {formatDate(cohort.endDate)}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/app/teacher/cohorts/${cohort._id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} programs
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
    </div>
  )
}

