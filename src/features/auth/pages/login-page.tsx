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
import { OtpInput } from '@/components/ui/otp-input'
import {
  login,
  loginWithGoogleToken,
  verifyLoginPasscode,
  type AuthVerificationMetadata,
} from '@/features/auth/api/auth-api'
import { SESSION_REVOKED_MESSAGE_STORAGE_KEY } from '@/lib/auth/logout-reasons'
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

function maskEmail(email: string): string {
  const [localPartRaw, domain] = email.split('@')
  if (!domain || !localPartRaw) {
    return email
  }
  if (localPartRaw.length <= 2) {
    return `${localPartRaw[0] ?? ''}***@${domain}`
  }
  const maskedLocal = `${localPartRaw[0]}${'*'.repeat(Math.max(localPartRaw.length - 2, 1))}${localPartRaw.slice(-1)}`
  return `${maskedLocal}@${domain}`
}

function secondsUntil(timestamp?: string | null, nowMs: number = Date.now()): number {
  if (!timestamp) return 0
  const targetMs = new Date(timestamp).getTime()
  if (Number.isNaN(targetMs)) return 0
  return Math.max(0, Math.ceil((targetMs - nowMs) / 1000))
}

function formatSeconds(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const remaining = clamped % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

export function LoginPage() {
  const [form, setForm] = useState<LoginFormState>(initialState)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isAwaitingPasscode, setIsAwaitingPasscode] = useState(false)
  const [verification, setVerification] = useState<AuthVerificationMetadata | null>(null)
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const loginUser = useAuthStore((state) => state.login)
  const location = useLocation()
  const navigate = useNavigate()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedMessage = window.sessionStorage.getItem(SESSION_REVOKED_MESSAGE_STORAGE_KEY)
      if (storedMessage) {
        setErrors((prev) => ({
          ...prev,
          root: storedMessage,
        }))
        window.sessionStorage.removeItem(SESSION_REVOKED_MESSAGE_STORAGE_KEY)
        setPasscodeError(null)
      }
    } catch (storageError) {
      console.warn('Unable to read session revocation message', storageError)
    }
  }, [])

  const completeLogin = useCallback(
    (payload: Parameters<typeof loginUser>[0], message: string) => {
      if (!payload.token) {
        notifyError('Login did not return a session token', 'Unable to sign in')
        return
      }

      loginUser(payload)
      notifySuccess(message, 'Signed in successfully')

      const redirectState = location.state as { from?: { pathname?: string } } | undefined
      const redirectTo = redirectState?.from?.pathname ?? '/app'
      navigate(redirectTo, { replace: true })
    },
    [location.state, loginUser, navigate],
  )

  const clearRootError = useCallback(() => {
    setErrors((prev) => {
      if (!prev.root) {
        return prev
      }
      const next = { ...prev }
      delete next.root
      return next
    })
  }, [])

  const verificationEmail = verification?.email ?? form.email
  const envPasscodeLength = Number.parseInt(
    import.meta.env.VITE_EMAIL_PASSCODE_LENGTH ?? '',
    10,
  )
  const configuredPasscodeLength = Number.isNaN(envPasscodeLength) ? 6 : envPasscodeLength
  const passcodeMaxLength = configuredPasscodeLength

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      const payload = response.data

      setErrors({})
      setPasscodeError(null)

      if (payload.requiresPasscode && !payload.token) {
        const nextVerification: AuthVerificationMetadata = {
          ...(payload.verification ?? {}),
        }
        if (!nextVerification.email) {
          nextVerification.email = payload.user.email ?? form.email
        }
        setVerification(nextVerification)
        setIsAwaitingPasscode(true)
        setPasscode('')
        setNow(Date.now())
        notifySuccess(response.message, 'Verification code sent successfully')
        return
      }

      if (payload.token) {
        setIsAwaitingPasscode(false)
        setVerification(null)
        setPasscode('')
        completeLogin(payload, response.message)
        return
      }

      notifyError('Login response was missing a session token', 'Unable to sign in')
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Unable to sign in')
      const nextErrors: LoginErrors = {}
      if (fieldErrors.email) {
        nextErrors.email = fieldErrors.email
      }
      if (fieldErrors.password) {
        nextErrors.password = fieldErrors.password
      }
      if (message) {
        nextErrors.root = message
      }
      setErrors(nextErrors)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: verifyLoginPasscode,
    onSuccess: (response) => {
      setIsAwaitingPasscode(false)
      setVerification(null)
      setPasscode('')
      setPasscodeError(null)
      setErrors({})
      completeLogin(response.data, response.message)
    },
    onError: (error) => {
      const { message } = handleApiError(error, 'Unable to verify code')
      const fallback = message || 'Unable to verify code'
      setPasscodeError(fallback)
      setErrors({ root: fallback })
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

  useEffect(() => {
    if (!isAwaitingPasscode) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isAwaitingPasscode])

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

  const handlePasscodeChange = (nextValue: string) => {
    const digitsOnly = nextValue.replace(/\D/g, '').slice(0, passcodeMaxLength)
    setPasscode(digitsOnly)
    if (passcodeError) {
      setPasscodeError(null)
    }
    clearRootError()
  }

  const handlePasscodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (verifyMutation.isPending) {
      return
    }
    clearRootError()
    setPasscodeError(null)

    const trimmed = passcode.trim()
    if (!trimmed) {
      setPasscodeError('Enter the verification code sent to your email.')
      return
    }

    if (passcodeMaxLength > 0 && trimmed.length !== passcodeMaxLength) {
      setPasscodeError(`Enter the ${passcodeMaxLength}-digit code sent to your email.`)
      return
    }

    if (!verificationEmail) {
      notifyError('We could not determine which email to verify.', 'Unable to verify code')
      return
    }

    verifyMutation.mutate({
      email: verificationEmail,
      passcode: trimmed,
    })
  }

  const handleResend = () => {
    if (mutation.isPending) {
      return
    }
    if (!form.email || !form.password) {
      notifyError(
        'Please return to the previous step and re-enter your email and password to request a new code.',
        'Resend unavailable',
      )
      return
    }
    clearRootError()
    setPasscodeError(null)
    setPasscode('')
    setNow(Date.now())
    mutation.mutate({
      email: form.email,
      password: form.password,
    })
  }

  const handleBackToCredentials = () => {
    setIsAwaitingPasscode(false)
    setVerification(null)
    setPasscode('')
    setPasscodeError(null)
    setNow(Date.now())
    setErrors({})
  }

  const resendSecondsRemaining = isAwaitingPasscode
    ? secondsUntil(verification?.resendAvailableAt, now)
    : 0
  const expiresInSeconds = isAwaitingPasscode ? secondsUntil(verification?.expiresAt, now) : 0
  const codeExpired = Boolean(
    isAwaitingPasscode && verification?.expiresAt && expiresInSeconds === 0,
  )
  const maskedVerificationEmail = verificationEmail ? maskEmail(verificationEmail) : ''

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
        isVisible={mutation.isPending || googleMutation.isPending || verifyMutation.isPending}
        overlay
        size="small"
        message={
          googleMutation.isPending
            ? 'Completing Google sign-in…'
            : verifyMutation.isPending
              ? 'Verifying your code…'
              : 'Signing you in…'
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
            <CardTitle>{isAwaitingPasscode ? 'Verify your login' : 'Sign in'}</CardTitle>
            <CardDescription>
              {isAwaitingPasscode ? (
                maskedVerificationEmail ? (
                  <>
                    Enter the passcode sent to{' '}
                    <span className="font-medium text-foreground">{maskedVerificationEmail}</span>.
                  </>
                ) : (
                  'Enter the passcode we emailed you.'
                )
              ) : (
                'Enter the email you registered with and your password.'
              )}
            </CardDescription>
            {errors.root ? (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.root}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {isAwaitingPasscode ? (
              <div className="space-y-6">
                <form className="space-y-4" onSubmit={handlePasscodeSubmit} noValidate>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="passcode-0">Verification code</Label>
                    <OtpInput
                      idPrefix="passcode"
                      length={passcodeMaxLength}
                      value={passcode}
                      onChange={handlePasscodeChange}
                      autoFocus
                      disabled={verifyMutation.isPending}
                      isError={Boolean(passcodeError)}
                      className="mt-2 justify-center"
                    />
                    {passcodeError ? (
                      <p className="text-xs text-destructive">{passcodeError}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {codeExpired
                        ? 'This code has expired. Request a new one.'
                        : `Code expires in ${formatSeconds(expiresInSeconds)}.`}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={handleResend}
                      disabled={resendSecondsRemaining > 0 || mutation.isPending}
                    >
                      {resendSecondsRemaining > 0
                        ? `Resend in ${formatSeconds(resendSecondsRemaining)}`
                        : 'Resend code'}
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={
                      verifyMutation.isPending ||
                      passcode.length !== passcodeMaxLength ||
                      codeExpired
                    }
                  >
                    {verifyMutation.isPending ? 'Verifying…' : 'Verify and continue'}
                  </Button>
                </form>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBackToCredentials}
                  disabled={verifyMutation.isPending || mutation.isPending}
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <>
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
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          className="h-4 w-4"
                        />
                      </Button>
                    </div>
                    {errors.password ? (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    ) : null}
                  </div>
              <div className="text-right text-xs">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

