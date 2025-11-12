import { faCheckCircle, faClipboardList, faVideo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const metrics = [
  {
    label: 'Upcoming Tests',
    value: '3',
    icon: faClipboardList,
    description: 'Scheduled across Physics, Chemistry, and Math',
  },
  {
    label: 'Live Sessions Today',
    value: '2',
    icon: faVideo,
    description: 'Join the live sessions starting in 45 minutes',
  },
  {
    label: 'Completed Assignments',
    value: '12',
    icon: faCheckCircle,
    description: 'Assignments submitted on time this month',
  },
]

const sessions = [
  {
    title: 'Organic Chemistry Marathon',
    mentor: 'Dr. Priya Sharma',
    time: 'Today · 5:00 PM',
    type: 'Live Session',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Full Length Mock Test 07',
    mentor: 'Autograded',
    time: 'Tomorrow · 9:00 AM',
    type: 'Test Series',
    accent: 'from-purple-500 to-indigo-500',
  },
]

export function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stay on top of your upcoming classes, test series and assignments.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-medium">{metric.label}</CardTitle>
              <FontAwesomeIcon icon={metric.icon} className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{metric.value}</div>
              <CardDescription className="mt-2">{metric.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.title}>
            <CardHeader>
              <CardTitle>{session.title}</CardTitle>
              <CardDescription>{session.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={cn(
                  'inline-flex items-center rounded-full bg-gradient-to-r px-3 py-1 text-xs font-medium text-white',
                  session.accent,
                )}
              >
                {session.time}
              </div>
              <p className="text-sm text-muted-foreground">
                Mentor: <span className="font-medium text-foreground">{session.mentor}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Review pre-session materials and post your questions in advance to get the most
                out of the session.
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

