import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import logo from '@/assets/logo.png'

const features = [
  {
    title: 'Test Series',
    description: 'Structured practice papers with instant analytics to track progress over time.',
  },
  {
    title: 'Live Sessions',
    description: 'Join interactive classroom sessions with mentors and peer collaboration.',
  },
  {
    title: 'Assignments',
    description: 'Get guided assignments and real-time feedback to improve retention.',
  },
  {
    title: 'Resource Library',
    description: 'Curated notes, recordings, and study guides accessible anytime, anywhere.',
  },
]

export function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      navigate('/app')
    } else {
      navigate('/signup')
    }
  }

  const primaryCtaLabel = isAuthenticated ? 'Enter classroom' : 'Create free account'
  const secondaryCta = isAuthenticated ? '/app' : '/login'
  const secondaryLabel = isAuthenticated ? 'Open dashboard' : 'Sign in'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SkyPrep Classroom"
            className="h-10 w-10 rounded-md border border-border bg-card object-cover shadow-sm"
          />
          <span className="text-lg font-semibold text-primary">SkyPrep Classroom</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={secondaryCta}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {secondaryLabel}
          </Link>
          <Button onClick={handlePrimaryCta}>{primaryCtaLabel}</Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-12">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              The smart hub for student success
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Empower every learner with a unified classroom experience.
            </h1>
            <p className="text-base text-muted-foreground">
              SkyPrep Classroom brings live sessions, test series, assignments, and collaborative
              resources into one beautiful interface. Stay organized, learn faster, and celebrate
              progress with your peers and mentors.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={handlePrimaryCta}>
                {primaryCtaLabel}
              </Button>
              {!isAuthenticated ? (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/login">Sign in with your account</Link>
                </Button>
              ) : (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/app">Jump to dashboard</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="relative h-full w-full">
            <div className="absolute right-10 top-10 h-20 w-20 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="rounded-lg border border-border bg-background/60 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Live Test Tracker</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Keep tabs on upcoming test series, mock exams, and performance scores.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Session Spotlight</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Never miss a live class again—join via one-click access right from your dashboard.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Progress Insights</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Visualize strengths and gaps with intuitive charts, heatmaps, and mentor feedback.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-foreground">Everything your batch needs</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Interactive tools built for educators, mentors, and students to collaborate effortlessly
            before, during, and after class.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card/60 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-primary">{feature.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground group-hover:text-foreground/80">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-2xl border border-border bg-card/80 p-10 text-center shadow-lg">
          <h2 className="text-3xl font-semibold text-foreground">Ready to accelerate learning?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Create a free account and invite students in minutes. Already part of a classroom?
            Jump straight into your personalized dashboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={handlePrimaryCta}>
              {primaryCtaLabel}
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to={secondaryCta}>{secondaryLabel}</Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-background/80 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} SkyPrep Classroom. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-primary">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-primary">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

