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
  primaryRole: string
}

export interface AuthPayload {
  token: string
  user: AuthUser
  tokenExpiresAt: string
}

export type AuthSuccessResponse = ApiSuccessResponse<AuthPayload>

export interface GoogleTokenRequest {
  idToken: string
}

export async function login(request: LoginRequest): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/login', request)
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function signup(request: SignupRequest): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/register', request)
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function loginWithGoogleToken(
  request: GoogleTokenRequest,
): Promise<AuthSuccessResponse> {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/google', request)
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}
