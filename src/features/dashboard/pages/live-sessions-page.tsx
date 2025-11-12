import { faVideo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const liveSessions = [
  {
    title: 'Strategies for Differential Calculus',
    mentor: 'Prof. Raghav Menon',
    time: 'Today · 5:30 PM',
    duration: '90 mins',
  },
  {
    title: 'Previous Year Paper Discussion - Physics',
    mentor: 'Dr. Neha Patil',
    time: 'Tomorrow · 6:00 PM',
    duration: '75 mins',
  },
]

export function LiveSessionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Live Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join interactive sessions to resolve doubts and learn smarter strategies.
        </p>
      </header>
      <div className="grid gap-4">
        {liveSessions.map((session) => (
          <Card key={session.title}>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faVideo} className="h-4 w-4 text-primary" />
                  {session.title}
                </CardTitle>
                <CardDescription>{session.mentor}</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Starts:</span> {session.time}
                </div>
                <div>
                  <span className="font-medium text-foreground">Duration:</span> {session.duration}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Make sure to revise the pre-session notes beforehand. You can post questions in
                the live chat during the session.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

