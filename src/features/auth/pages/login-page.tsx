import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { login, loginWithGoogleToken } from '@/features/auth/api/auth-api'
import { useAuthStore } from '@/stores/auth-store'
import { handleApiError, notifyError, notifySuccess } from '@/lib/notifications'
import { waitForGoogleIdentity, type GoogleCredentialResponse } from '@/lib/google-client'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormState = z.infer<typeof loginSchema>
type LoginErrors = Partial<Record<keyof LoginFormState, string>> & { root?: string }

const initialState: LoginFormState = {
  email: '',
  password: '',
}

export function LoginPage() {
  const [form, setForm] = useState<LoginFormState>(initialState)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const loginUser = useAuthStore((state) => state.login)
  const location = useLocation()
  const navigate = useNavigate()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setErrors({})
      loginUser(data.data)
      notifySuccess(data.message, 'Signed in successfully')
      const redirectState = location.state as
        | { from?: { pathname?: string } }
        | undefined
      const redirectTo = redirectState?.from?.pathname ?? '/app'
      navigate(redirectTo, { replace: true })
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Unable to sign in')
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
            text: 'signin_with',
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
    const field = name as keyof LoginErrors
    setErrors((prev) => {
      const next: LoginErrors = { ...prev }
      if (field in next) {
        delete (next as Record<string, string | undefined>)[field as string]
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

    const parsed = loginSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const nextErrors: LoginErrors = {}
      if (fieldErrors.email?.[0]) {
        nextErrors.email = fieldErrors.email[0]
      }
      if (fieldErrors.password?.[0]) {
        nextErrors.password = fieldErrors.password[0]
      }
      setErrors(nextErrors)
      return
    }

    mutation.mutate(parsed.data)
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-gradient-to-br from-background via-background to-background px-4 py-12">
      <LottieLoader
        isVisible={mutation.isPending || googleMutation.isPending}
        overlay
        size="small"
        message={
          googleMutation.isPending ? 'Completing Google sign-in…' : 'Signing you in…'
        }
      />
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome back to SkyPrep Classroom
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your test series, live sessions and personalized classroom dashboard.
          </p>
        </div>
        <Card>
          <CardHeader className="space-y-2 text-center">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter the email you registered with and your password.
            </CardDescription>
            {errors.root ? (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.root}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-3">
              <div className="flex justify-center">
                {googleClientId ? (
                  <div ref={googleButtonRef} className="w-full" />
                ) : (
                  <Button type="button" variant="outline" className="w-full" disabled>
                    <FontAwesomeIcon icon={faGoogle} className="mr-2 h-4 w-4" />
                    Google sign-in unavailable
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2 text-left">
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
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email}</p>
                ) : null}
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Create one now
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

