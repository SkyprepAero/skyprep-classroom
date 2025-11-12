import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const testSeries = [
  {
    title: 'Full Length Mock Test 07',
    subject: 'All Subjects',
    date: 'Thu · 9:00 AM',
    duration: '180 mins',
  },
  {
    title: 'Physics Advanced Practice',
    subject: 'Physics',
    date: 'Sat · 10:30 AM',
    duration: '120 mins',
  },
  {
    title: 'Chemistry Rapid Revision',
    subject: 'Chemistry',
    date: 'Mon · 4:00 PM',
    duration: '90 mins',
  },
]

export function TestSeriesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Upcoming Test Series</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Attempt test series to simulate the exam experience and track improvements.
        </p>
      </header>
      <div className="grid gap-4">
        {testSeries.map((test) => (
          <Card key={test.title}>
            <CardHeader className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <div>
                <CardTitle>{test.title}</CardTitle>
                <CardDescription>{test.subject}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 md:mt-0">
                View details
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Schedule:</span> {test.date}
              </div>
              <div>
                <span className="font-medium text-foreground">Duration:</span> {test.duration}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

