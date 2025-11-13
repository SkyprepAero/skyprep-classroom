import apiClient from '@/lib/http/axios'
import { toApiClientError } from '@/lib/http/api-error'
import type { AuthUser } from '@/stores/auth-store'
import type { ApiSuccessResponse } from '@/types/api'

export interface LoginRequest {
  email: string
  password: string
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
