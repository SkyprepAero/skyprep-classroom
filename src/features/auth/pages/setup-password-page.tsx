import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { faArrowLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LottieLoader } from '@/components/ui/lottie-loader'
import { setupPassword } from '@/features/auth/api/auth-api'
import { handleApiError, notifyError, notifySuccess } from '@/lib/notifications'
import { useAuthStore } from '@/stores/auth-store'

const envPasswordMin = Number.parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH ?? '6', 10)
const passwordMinLength = Number.isNaN(envPasswordMin) ? 6 : envPasswordMin

const passwordSchema = z
  .object({
    name: z.string().max(50, 'Name cannot be more than 50 characters').optional().or(z.literal('')),
    phoneNumber: z.string().max(15, 'Phone number cannot be more than 15 characters').optional().or(z.literal('')),
    city: z.string().max(50, 'City cannot be more than 50 characters').optional().or(z.literal('')),
    newPassword: z
      .string()
      .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters.`),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type PasswordFormState = z.infer<typeof passwordSchema>

export function SetupPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const loginUser = useAuthStore((state) => state.login)

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    name: '',
    phoneNumber: '',
    city: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordFormState>>({})
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Check if token exists in URL
  useEffect(() => {
    if (!token) {
      setTokenError('Invalid or missing setup token. Please check your email for the correct link.')
    }
  }, [token])

  const setupMutation = useMutation({
    mutationFn: setupPassword,
    onSuccess: (response) => {
      const payload = response.data
      if (!payload.token) {
        notifyError('Password setup did not return a session token.', 'Unable to sign in')
        return
      }
      notifySuccess(response.message, 'Password set successfully!')
      loginUser(payload)
      navigate('/app', { replace: true })
    },
    onError: (error) => {
      const { message, fieldErrors } = handleApiError(error, 'Unable to setup password')
      if (fieldErrors?.setupToken || message?.toLowerCase().includes('token')) {
        setTokenError(message || 'Invalid or expired setup token. Please contact support.')
      }
      const nextErrors: Partial<PasswordFormState> = {}
      if (fieldErrors?.name) nextErrors.name = fieldErrors.name
      if (fieldErrors?.phoneNumber) nextErrors.phoneNumber = fieldErrors.phoneNumber
      if (fieldErrors?.city) nextErrors.city = fieldErrors.city
      if (fieldErrors?.newPassword) nextErrors.newPassword = fieldErrors.newPassword
      if (fieldErrors?.confirmPassword) nextErrors.confirmPassword = fieldErrors.confirmPassword
      setPasswordErrors(nextErrors)
      if (message && !Object.keys(nextErrors).length && !message.toLowerCase().includes('token')) {
        notifyError(message, 'Unable to setup password')
      }
    },
  })

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
    setTokenError(null)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordErrors({})
    setTokenError(null)

    if (!token) {
      setTokenError('Setup token is missing. Please check your email for the correct link.')
      return
    }

    const parsed = passwordSchema.safeParse(passwordForm)
    if (!parsed.success) {
      const errors: Partial<PasswordFormState> = {}
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof PasswordFormState
        if (path) {
          errors[path] = issue.message
        }
      })
      setPasswordErrors(errors)
      return
    }

    setupMutation.mutate({
      setupToken: token,
      newPassword: parsed.data.newPassword,
      ...(parsed.data.name && { name: parsed.data.name.trim() }),
      ...(parsed.data.phoneNumber && { phoneNumber: parsed.data.phoneNumber.trim() }),
      ...(parsed.data.city && { city: parsed.data.city.trim() }),
    })
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Setup Link</CardTitle>
            <CardDescription>
              The password setup link is invalid or missing. Please check your email for the
              correct link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome to SkyPrep! Please set a secure password and complete your profile details to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{tokenError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={passwordForm.name}
                onChange={handlePasswordChange}
                placeholder="Enter your full name"
                disabled={setupMutation.isPending}
                className={passwordErrors.name ? 'border-red-500' : ''}
              />
              {passwordErrors.name && (
                <p className="text-sm text-red-600">{passwordErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={passwordForm.phoneNumber}
                onChange={handlePasswordChange}
                placeholder="Enter your phone number"
                disabled={setupMutation.isPending}
                className={passwordErrors.phoneNumber ? 'border-red-500' : ''}
              />
              {passwordErrors.phoneNumber && (
                <p className="text-sm text-red-600">{passwordErrors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                type="text"
                value={passwordForm.city}
                onChange={handlePasswordChange}
                placeholder="Enter your city"
                disabled={setupMutation.isPending}
                className={passwordErrors.city ? 'border-red-500' : ''}
              />
              {passwordErrors.city && (
                <p className="text-sm text-red-600">{passwordErrors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  disabled={setupMutation.isPending}
                  className={`pr-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={setupMutation.isPending}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-600">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm your password"
                  disabled={setupMutation.isPending}
                  className={`pr-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={setupMutation.isPending}
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-600">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? (
                  <>
                    <LottieLoader className="mr-2 h-4 w-4" />
                    Setting Password...
                  </>
                ) : (
                  'Set Password'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

