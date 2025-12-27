import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { faUserGraduate, faBookOpen, faChalkboardTeacher, faCalendar, faCalendarPlus } from '@fortawesome/free-solid-svg-icons'
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
import { getTeacherFocusOnes, type FocusOne } from '../api/focus-one-api'
import { TeacherScheduleSessionDialog } from '@/features/sessions/components/teacher-schedule-session-dialog'
import { cn } from '@/lib/utils'

export function TeacherFocusOnesPage() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedFocusOneId, setSelectedFocusOneId] = useState<string | undefined>(undefined)

  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherFocusOnes', page],
    queryFn: () => getTeacherFocusOnes({ page, limit: 10 }),
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
        message="Loading your Focus One programs..."
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            My Focus One Programs
          </h1>
        </section>
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load Focus One programs. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const focusOnes = data?.data?.focusOnes || []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Focus One Programs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all Focus One programs you are assigned to as a teacher
        </p>
      </section>

      {focusOnes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faUserGraduate} className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                You are not assigned to any Focus One programs at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {focusOnes.map((focusOne) => {
            const subjects = focusOne.teacherSubjectMappings?.map(m => m.subject) || []
            const uniqueSubjects = Array.from(
              new Map(subjects.map(s => [s._id, s])).values()
            )

            return (
              <Card key={focusOne._id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">Focus One Program</CardTitle>
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
                  {focusOne.description && (
                    <CardDescription className="mt-1">{focusOne.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {focusOne.student && (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUserGraduate} className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Student</p>
                        <p className="text-sm font-medium">{focusOne.student.name || focusOne.student.email}</p>
                      </div>
                    </div>
                  )}
                  
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

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FontAwesomeIcon icon={faCalendar} className="h-3 w-3" />
                    <span>Started: {formatDate(focusOne.startedAt)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/app/teacher/focus-ones/${focusOne._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        setSelectedFocusOneId(focusOne._id)
                        setIsScheduleDialogOpen(true)
                      }}
                    >
                      <FontAwesomeIcon icon={faCalendarPlus} className="h-3 w-3 mr-2" />
                      Schedule
                    </Button>
                  </div>
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

      {/* Schedule Session Dialog */}
      <TeacherScheduleSessionDialog
        open={isScheduleDialogOpen}
        onOpenChange={(open) => {
          setIsScheduleDialogOpen(open)
          if (!open) {
            setSelectedFocusOneId(undefined)
          }
        }}
        initialFocusOneId={selectedFocusOneId}
        onSuccess={() => {
          // Optionally refresh the FocusOnes list if needed
          queryClient.invalidateQueries({ queryKey: ['teacherFocusOnes'] })
        }}
      />
    </div>
  )
}

