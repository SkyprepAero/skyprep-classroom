import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
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

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must contain at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
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
  password: '',
  confirmPassword: '',
  primaryRole: 'student',
}

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
      password: parsed.data.password,
      primaryRole: parsed.data.primaryRole,
    })
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-background via-background to-background px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create your SkyPrep Classroom account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up to access test series, live sessions and assignments tailored for your class.
          </p>
        </div>
        <Card>
          <CardHeader className="space-y-2 text-center">
            <CardTitle>Sign up</CardTitle>
            <CardDescription>Enter your details to get started.</CardDescription>
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
              {googleMutation.isPending ? (
                <p className="text-center text-xs text-muted-foreground">
                  Completing Google sign-in…
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <input type="hidden" name="primaryRole" value={form.primaryRole} readOnly />
              <div className="space-y-2 text-left">
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
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>
              <div className="space-y-2 text-left">
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
              <div className="space-y-2 text-left">
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
              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

