import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { OtpInput } from '@/components/ui/otp-input'
import {
  requestPasswordReset,
  verifyPasswordReset,
  resetPassword,
  type AuthVerificationMetadata,
} from '@/features/auth/api/auth-api'
import { handleApiError, notifyError, notifySuccess } from '@/lib/notifications'
import { useAuthStore } from '@/stores/auth-store'

const envPasscodeLength = Number.parseInt(import.meta.env.VITE_EMAIL_PASSCODE_LENGTH ?? '6', 10)
const passcodeLength = Number.isNaN(envPasscodeLength) ? 6 : envPasscodeLength

const envPasswordMin = Number.parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH ?? '6', 10)
const passwordMinLength = Number.isNaN(envPasswordMin) ? 6 : envPasswordMin

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters.`),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
})

type EmailFormState = z.infer<typeof emailSchema>
type PasswordFormState = z.infer<typeof passwordSchema>

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

type Step = 'email' | 'verify' | 'reset'

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [emailForm, setEmailForm] = useState<EmailFormState>({ email: '' })
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordFormState>>({})
  const [verification, setVerification] = useState<AuthVerificationMetadata | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const loginUser = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const maskedEmail = useMemo(
    () => (emailForm.email ? maskEmail(emailForm.email) : ''),
    [emailForm.email],
  )

  useEffect(() => {
    if (step === 'verify') {
      const intervalId = window.setInterval(() => {
        setNow(Date.now())
      }, 1000)
      return () => window.clearInterval(intervalId)
    }
  }, [step])

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (response) => {
      const payload = response.data
      setVerification(payload.verification ?? null)
      setStep('verify')
      setSuccessMessage(response.message)
      notifySuccess(response.message, 'Check your email for the passcode.')
      setPasscode('')
      setPasscodeError(null)
      setNow(Date.now())
    },
    onError: (error) => {
      const { message } = handleApiError(error, 'Unable to request password reset')
      setEmailError(message)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: verifyPasswordReset,
    onSuccess: (response) => {
      const payload = response.data
      setResetToken(payload.resetToken)
      setStep('reset')
      notifySuccess(response.message, 'Verification successful')
      setPasswordForm({
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordErrors({})
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Unable to verify passcode')
      if (fieldErrors.passcode) {
        setPasscodeError(fieldErrors.passcode)
      } else {
        setPasscodeError(message)
      }
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      const payload = response.data
      if (!payload.token) {
        notifyError('Password reset did not return a session token.', 'Unable to sign in')
        return
      }
      notifySuccess(response.message, 'Password updated successfully')
      loginUser(payload)
      navigate('/app', { replace: true })
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Unable to reset password')
      const nextErrors: Partial<PasswordFormState> = {}
      if (fieldErrors.newPassword) nextErrors.newPassword = fieldErrors.newPassword
      setPasswordErrors(nextErrors)
      if (message && !Object.keys(nextErrors).length) {
        notifyError(message, 'Unable to reset password')
      }
    },
  })

  const resendSecondsRemaining =
    step === 'verify' ? secondsUntil(verification?.resendAvailableAt, now) : 0
  const expiresInSeconds = step === 'verify' ? secondsUntil(verification?.expiresAt, now) : 0
  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEmailError(null)
    setSuccessMessage(null)

    const parsed = emailSchema.safeParse(emailForm)
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? 'Enter a valid email address.')
      return
    }

    requestMutation.mutate(parsed.data)
  }

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setPasswordErrors((prev) => {
      if (!prev[name as keyof PasswordFormState]) {
        return prev
      }
      const next = { ...prev }
      delete next[name as keyof PasswordFormState]
      return next
    })
  }

  const handlePasscodeChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, passcodeLength)
    setPasscode(digitsOnly)
    if (passcodeError) {
      setPasscodeError(null)
    }
  }, [passcodeLength, passcodeError])

  const handleVerifySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasscodeError(null)

    if (!passcode || passcode.length !== passcodeLength) {
      setPasscodeError(`Enter the ${passcodeLength}-digit code sent to your email.`)
      return
    }

    verifyMutation.mutate({
      email: emailForm.email,
      passcode,
    })
  }

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordErrors({})

    const parsed = passwordSchema.safeParse(passwordForm)
    if (!parsed.success) {
      const nextErrors: Partial<PasswordFormState> = {}
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0]
        if (typeof field === 'string' && !(field in nextErrors)) {
          nextErrors[field as keyof PasswordFormState] = issue.message
        }
      })
      setPasswordErrors(nextErrors)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({
        confirmPassword: 'Passwords do not match.',
      })
      return
    }

    if (!resetToken) {
      notifyError('Reset token is missing. Please start over.', 'Unable to reset password')
      return
    }

    resetMutation.mutate({
      resetToken,
      newPassword: passwordForm.newPassword,
    })
  }

  const handleBackToEmail = () => {
    setStep('email')
    setVerification(null)
    setPasscode('')
    setPasscodeError(null)
    setSuccessMessage(null)
  }

  const handleBackToVerify = () => {
    setStep('verify')
    setResetToken(null)
    setPasswordForm({
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordErrors({})
  }

  const handleResend = () => {
    if (resendSecondsRemaining > 0 || requestMutation.isPending) return
    requestMutation.mutate({ email: emailForm.email })
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
      <LottieLoader
        isVisible={requestMutation.isPending || verifyMutation.isPending || resetMutation.isPending}
        overlay
        size="small"
        message={
          resetMutation.isPending
            ? 'Updating password…'
            : verifyMutation.isPending
              ? 'Verifying passcode…'
              : 'Sending passcode…'
        }
      />
      <div className="mx-auto w-full max-w-md">
        <Card className="shadow-xl shadow-primary/5">
          <CardHeader className="space-y-2 text-center">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate('/login')}
                aria-label="Back to login"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-semibold flex-1">Reset your password</CardTitle>
              <div className="w-8" />
            </div>
            <CardDescription>
              {step === 'email'
                ? 'Enter the email linked to your SkyPrep account to receive a verification code.'
                : step === 'verify'
                  ? 'Enter the passcode sent to your email to verify your identity.'
                  : 'Choose a new password for your account.'}
            </CardDescription>
            {successMessage && step === 'verify' ? (
              <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {successMessage}
              </div>
            ) : null}
            {emailError && step === 'email' ? (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {emailError}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form className="space-y-4" onSubmit={handleEmailSubmit} noValidate>
                <div className="space-y-2 text-left">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={emailForm.email}
                    onChange={(event) => {
                      setEmailForm({ email: event.target.value })
                      setEmailError(null)
                    }}
                    placeholder="student@academy.com"
                    autoComplete="email"
                  />
                </div>
                <Button className="w-full" type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? 'Sending instructions…' : 'Send verification code'}
                </Button>
              </form>
            ) : step === 'verify' ? (
              <div className="space-y-6">
                <form className="space-y-4" onSubmit={handleVerifySubmit} noValidate>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="passcode-0">Verification code</Label>
                    <OtpInput
                      idPrefix="reset-passcode"
                      length={passcodeLength}
                      value={passcode}
                      onChange={handlePasscodeChange}
                      autoFocus
                      disabled={verifyMutation.isPending}
                      isError={Boolean(passcodeError)}
                      className="justify-center"
                    />
                    {passcodeError ? (
                      <p className="text-xs text-destructive">{passcodeError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        We sent a {passcodeLength}-digit code to{' '}
                        <span className="font-medium text-foreground">{maskedEmail}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {verification?.expiresAt
                        ? `Code expires in ${formatSeconds(expiresInSeconds)}.`
                        : 'Code expires soon.'}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={handleResend}
                      disabled={resendSecondsRemaining > 0 || requestMutation.isPending}
                    >
                      {resendSecondsRemaining > 0
                        ? `Resend in ${formatSeconds(resendSecondsRemaining)}`
                        : 'Resend code'}
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={verifyMutation.isPending || passcode.length !== passcodeLength}
                  >
                    {verifyMutation.isPending ? 'Verifying…' : 'Verify and continue'}
                  </Button>
                </form>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleBackToEmail}
                    disabled={verifyMutation.isPending || requestMutation.isPending}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                    Use a different email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <form className="space-y-4" onSubmit={handlePasswordSubmit} noValidate>
                  <div className="grid gap-4 text-left">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                      />
                      {passwordErrors.newPassword ? (
                        <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                      {passwordErrors.confirmPassword ? (
                        <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? 'Resetting password…' : 'Reset password'}
                  </Button>
                </form>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleBackToVerify}
                    disabled={resetMutation.isPending}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                    Back to verification
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

