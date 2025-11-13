import { faEnvelope, faUserGraduate } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Your Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your classroom identity and personal preferences.
          </p>
        </div>
        <Button variant="outline">Edit profile</Button>
      </div>

      <Card className="border border-border/80 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Profile overview</CardTitle>
            <CardDescription>
              Update your personal information so mentors and peers can recognize you.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FontAwesomeIcon icon={faUserGraduate} className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Name</span>
            </div>
            <p className="text-base font-medium text-foreground">{user?.name ?? '—'}</p>
          </div>
          <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Email</span>
            </div>
            <p className="text-base font-medium text-foreground">{user?.email ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/80 bg-card/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Classroom preferences</CardTitle>
          <CardDescription>
            Customize how you appear across test series, live sessions, and collaborative spaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-dashed border-border/70 p-5">
            <p className="text-sm text-muted-foreground">
              Coming soon: update stage name, academic track, notification settings, and more.
            </p>
          </div>
          <Button variant="ghost" className="justify-start text-primary" disabled>
            Stay tuned for additional profile controls
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

