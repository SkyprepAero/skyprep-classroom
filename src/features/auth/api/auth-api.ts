import apiClient from '@/lib/http/axios'
import { toApiClientError } from '@/lib/http/api-error'
import type { AuthUser } from '@/stores/auth-store'
import type { ApiSuccessResponse } from '@/types/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyPasswordResetRequest {
  email: string
  passcode: string
}

export interface ResetPasswordRequest {
  resetToken: string
  newPassword: string
}

export interface SetupPasswordRequest {
  setupToken: string
  newPassword: string
  name?: string
  phoneNumber?: string
  city?: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
  phoneNumber: string
  city: string
  primaryRole: string
}

export interface AuthVerificationMetadata {
  purpose?: string
  email?: string
  expiresAt?: string
  resendAvailableAt?: string
  verifiedAt?: string
}

export interface AuthPayload {
  token: string | null
  user: AuthUser
  tokenExpiresAt: string | null
  requiresPasscode?: boolean
  verification?: AuthVerificationMetadata
}

export type AuthSuccessResponse = ApiSuccessResponse<AuthPayload>

export interface ForgotPasswordRequestPayload {
  requiresPasscode: boolean
  verification?: AuthVerificationMetadata | null
}

export type ForgotPasswordRequestResponse = ApiSuccessResponse<ForgotPasswordRequestPayload>

export interface VerifyPasswordResetPayload {
  email: string
  resetToken: string
  resetTokenExpiresAt: string
}

export type VerifyPasswordResetResponse = ApiSuccessResponse<VerifyPasswordResetPayload>

export interface GoogleTokenRequest {
  idToken: string
}

export async function login(request: LoginRequest): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/login', request, {
      showLoadingOverlay: true,
    })
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function signup(request: SignupRequest): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/register', request, {
      showLoadingOverlay: true,
    })
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function loginWithGoogleToken(
  request: GoogleTokenRequest,
): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/google', request, {
      showLoadingOverlay: true,
    })
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export interface VerifyLoginPasscodeRequest {
  email: string
  passcode: string
}

export async function verifyLoginPasscode(
  request: VerifyLoginPasscodeRequest,
): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/login/passcode', request, {
      showLoadingOverlay: true,
    })
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function requestPasswordReset(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordRequestResponse> {
  try {
    const { data } = await apiClient.post<ForgotPasswordRequestResponse>(
      '/auth/forgot-password',
      request,
      {
        showLoadingOverlay: true,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function verifyPasswordReset(
  request: VerifyPasswordResetRequest,
): Promise<VerifyPasswordResetResponse> {
  try {
    const { data } = await apiClient.post<VerifyPasswordResetResponse>(
      '/auth/forgot-password/verify',
      request,
      {
        showLoadingOverlay: true,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>(
      '/auth/forgot-password/reset',
      request,
      {
        showLoadingOverlay: true,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function setupPassword(
  request: SetupPasswordRequest,
): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>(
      '/auth/setup-password',
      request,
      {
        showLoadingOverlay: true,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export interface EnrollmentDetails {
  type: 'focusOne' | 'cohort'
  enrollment: {
    id: string
    name?: string
    slug?: string
    description?: string
    status?: string
    isActive?: boolean
    isCancelled?: boolean
    pausedAt?: string
    resumedAt?: string
    startDate?: string
    endDate?: string
    subjects?: Array<{
      id: string
      name: string
      description?: string
      isActive?: boolean
    }>
    teachers?: Array<{
      id: string
      name: string
      email: string
    }>
    teacherSubjectMappings?: Array<{
      teacher: {
        id: string
        name: string
        email: string
      }
      subject: {
        id: string
        name: string
        description?: string
      }
    }>
    student?: {
      id: string
      name: string
      email: string
    } | null
    enrolledAt?: string
    startedAt?: string
  }
  teacherSubjectMappings?: Array<{
    teacher: {
      id: string
      name: string
      email: string
    }
    subject: {
      id: string
      name: string
      description?: string
    }
  }>
  status: string
  enrolledAt: string
  startedAt?: string
  joinedViaWaitlist?: boolean
}

export interface EnrollmentResponse {
  success: boolean
  message: string
  data: EnrollmentDetails | null
}

export async function getMyEnrollment(): Promise<EnrollmentResponse> {
  try {
    const { data } = await apiClient.get<EnrollmentResponse>('/auth/me/enrollment')
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}
