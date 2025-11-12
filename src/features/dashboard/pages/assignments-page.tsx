import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const assignments = [
  {
    title: 'Numerical Aptitude Set 04',
    subject: 'Mathematics',
    dueDate: 'Due in 2 days',
    status: 'In progress',
  },
  {
    title: 'Electrochemistry Worksheet',
    subject: 'Chemistry',
    dueDate: 'Due in 4 days',
    status: 'Not started',
  },
  {
    title: 'Optics Concept Checks',
    subject: 'Physics',
    dueDate: 'Submitted on time',
    status: 'Completed',
  },
]

export function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your assignment progress and complete pending tasks to stay ahead.
        </p>
      </header>
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.title}>
            <CardHeader>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>{assignment.subject}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Status:</span> {assignment.status}
              </div>
              <div>
                <span className="font-medium text-foreground">Due:</span> {assignment.dueDate}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

