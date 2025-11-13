import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import {
  faCloudSun,
  faCompass,
  faEye,
  faEyeSlash,
  faPlaneDeparture,
} from '@fortawesome/free-solid-svg-icons'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithGoogleToken, signup } from '@/features/auth/api/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import { handleApiError, notifyError, notifySuccess } from '@/lib/notifications'
import { waitForGoogleIdentity, type GoogleCredentialResponse } from '@/lib/google-client'
import { LottieLoader } from '@/components/ui/lottie-loader'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must contain at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phoneNumber: z
      .string()
      .min(10, 'Phone number must include at least 10 digits')
      .max(15, 'Phone number cannot exceed 15 digits')
      .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'),
    city: z.string().min(2, 'City must contain at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
    primaryRole: z.literal('student'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      })
    }
  })

type SignupFormState = z.infer<typeof signupSchema>
type SignupErrors = Partial<Record<keyof SignupFormState, string>> & { root?: string }

const initialState: SignupFormState = {
  name: '',
  email: '',
  phoneNumber: '',
  city: '',
  password: '',
  confirmPassword: '',
  primaryRole: 'student',
}

const flightHighlights: Array<{ icon: IconDefinition; heading: string; copy: string }> = [
  {
    icon: faPlaneDeparture,
    heading: 'Launch-ready schedule',
    copy: 'View your next live session, assignment, and test briefing in one glance so you never miss a departure.',
  },
  {
    icon: faCloudSun,
    heading: 'Adaptive flight paths',
    copy: 'Content adjusts with your performance, guiding you toward the topics that need a clearer sky.',
  },
  {
    icon: faCompass,
    heading: 'Progress navigation',
    copy: 'Track milestones from taxi to touchdown with insights that keep your study crew aligned.',
  },
]

export function SignupPage() {
  const [form, setForm] = useState<SignupFormState>(initialState)
  const [errors, setErrors] = useState<SignupErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const loginUser = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setErrors({})
      loginUser(data.data)
      notifySuccess(data.message, 'Account created successfully')
      navigate('/app', { replace: true })
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Unable to create account')
      setErrors({
        ...fieldErrors,
        ...(message ? { root: message } : {}),
      })
    },
  })

  const googleMutation = useMutation({
    mutationFn: loginWithGoogleToken,
    onSuccess: (data) => {
      loginUser(data.data)
      notifySuccess(data.message, 'Signed in successfully')
      navigate('/app', { replace: true })
    },
    onError: (error) => {
      handleApiError(error, 'Unable to sign in with Google')
    },
  })

  const handleGoogleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        notifyError('Google did not return a credential', 'Unable to sign in with Google')
        return
      }
      googleMutation.mutate({ idToken: response.credential })
    },
    [googleMutation],
  )

  useEffect(() => {
    let cancelled = false
    let identity: Awaited<ReturnType<typeof waitForGoogleIdentity>> | null = null

    if (!googleClientId) {
      return
    }

    waitForGoogleIdentity()
      .then((id) => {
        if (cancelled) return
        identity = id
        id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          auto_select: false,
        })
        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = ''
          id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
          })
        }
      })
      .catch((error) => {
        if (cancelled) return
        notifyError(error.message, 'Google sign-in unavailable')
      })

    return () => {
      cancelled = true
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = ''
      }
      identity?.cancel?.()
      identity?.disableAutoSelect?.()
    }
  }, [googleClientId, handleGoogleCredential])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      const next: SignupErrors = { ...prev }
      if (name in next) {
        delete (next as Record<string, string | undefined>)[name]
      }
      if ('root' in next) {
        delete next.root
      }
      return next
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})

    const parsed = signupSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const nextErrors: SignupErrors = {}
      if (fieldErrors.name?.[0]) {
        nextErrors.name = fieldErrors.name[0]
      }
      if (fieldErrors.email?.[0]) {
        nextErrors.email = fieldErrors.email[0]
      }
      if (fieldErrors.phoneNumber?.[0]) {
        nextErrors.phoneNumber = fieldErrors.phoneNumber[0]
      }
      if (fieldErrors.city?.[0]) {
        nextErrors.city = fieldErrors.city[0]
      }
      if (fieldErrors.password?.[0]) {
        nextErrors.password = fieldErrors.password[0]
      }
      if (fieldErrors.confirmPassword?.[0]) {
        nextErrors.confirmPassword = fieldErrors.confirmPassword[0]
      }
      setErrors(nextErrors)
      return
    }

    mutation.mutate({
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase(),
      phoneNumber: parsed.data.phoneNumber,
      city: parsed.data.city.trim(),
      password: parsed.data.password,
      primaryRole: parsed.data.primaryRole,
    })
  }

  return (
    <div className="relative min-h-screen bg-background">
      <LottieLoader
        isVisible={mutation.isPending || googleMutation.isPending}
        overlay
        size="small"
        message={
          googleMutation.isPending ? 'Completing Google sign-in…' : 'Creating your account…'
        }
      />
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden flex-col justify-between bg-slate-900 px-12 py-16 text-slate-100 md:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_60%)]" />
          </div>
          <div className="relative flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">
                <FontAwesomeIcon icon={faPlaneDeparture} className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.55em] text-sky-200/70">SkyPrep</p>
                <p className="text-base font-semibold text-white/90">Flight Classroom</p>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-semibold leading-snug text-white">
                Chart a learning journey that keeps pace with your ambitions
              </h1>
              <p className="mt-5 max-w-lg text-base text-slate-200/80">
                Access live sessions, curated assignments, and performance insights engineered to keep
                every cadet aligned from first briefing to final touchdown.
              </p>
              <p className="mt-4 max-w-lg text-sm text-slate-200/70">
                Your cockpit dashboard blends class announcements, resource drops, and instructor notes so
                you can plan a smarter flight path through every subject.
              </p>
            </div>
            <div className="relative mt-10 space-y-5">
              <h2 className="text-sm uppercase tracking-[0.35em] text-slate-200/60">
                Flight deck essentials
              </h2>
              <ul className="space-y-4">
                {flightHighlights.map((item) => (
                  <li key={item.heading} className="flex gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sky-200">
                      <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-white">{item.heading}</p>
                      <p className="text-sm text-slate-200/70">{item.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative mt-16 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200/75 backdrop-blur">
            <p>
              Tip: Bookmark your dashboard or install it as a PWA for quick access before each session.
              Need clearance from support? Reach the operations crew at{' '}
              <a href="mailto:support@skyprepaero.com" className="font-medium text-sky-200 underline">
                support@skyprepaero.com
              </a>
              .
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-12 md:px-12">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-3xl font-semibold text-foreground">Create your SkyPrep account</h2>
              <p className="text-sm text-muted-foreground">
                Let’s get you cleared for takeoff. Add your details below to join your classroom squadron.
              </p>
            </div>
            {errors.root ? (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.root}
              </div>
            ) : null}
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col gap-3">
                  {googleClientId ? (
                    <div
                      ref={googleButtonRef}
                      className="w-full [&>div]:mx-auto [&>div]:w-full [&>div]:max-w-md"
                    />
                  ) : (
                    <Button type="button" variant="outline" className="w-full" disabled>
                      <FontAwesomeIcon icon={faGoogle} className="mr-2 h-4 w-4" />
                      Google sign-in unavailable
                    </Button>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </div>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
                  <input type="hidden" name="primaryRole" value={form.primaryRole} readOnly />
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ananya Gupta"
                      autoComplete="name"
                    />
                    {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="student@academy.com"
                    />
                    {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      placeholder="+919876543210"
                    />
                    {errors.phoneNumber ? (
                      <p className="text-xs text-destructive">{errors.phoneNumber}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      autoComplete="address-level2"
                    />
                    {errors.city ? <p className="text-xs text-destructive">{errors.city}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.password ? (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.confirmPassword ? (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    ) : null}
                  </div>
                  <Button className="w-full md:col-span-2" type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Creating account…' : 'Create account'}
                  </Button>
                  <p className="md:col-span-2 text-xs text-muted-foreground text-center">
                    By registering, you agree to our{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

