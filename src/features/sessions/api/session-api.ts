import apiClient from '@/lib/http/axios'
import { toApiClientError } from '@/lib/http/api-error'
import type { ApiSuccessResponse } from '@/types/api'

export interface RequestSessionRequest {
  title: string
  description?: string
  startTime: string // ISO 8601 date string
  endTime: string // ISO 8601 date string
  focusOne: string // FocusOne ID
  subject?: string // Subject ID (optional)
}

export interface Session {
  _id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  focusOne?: {
    _id: string
    description?: string
    student?: {
      _id: string
      name: string
      email: string
    }
  }
  subject?: {
    _id: string
    name: string
    description?: string
  }
  teacher?: {
    _id: string
    name: string
    email: string
  }
  status: 'requested' | 'accepted' | 'rejected' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  requestedBy?: {
    _id: string
    name: string
    email: string
  }
  requestedAt?: string
  acceptedBy?: {
    _id: string
    name: string
    email: string
  }
  acceptedAt?: string
  rejectedBy?: {
    _id: string
    name: string
    email: string
  }
  rejectedAt?: string
  rejectionReason?: string
  cancellationReason?: string
  cancelledBy?: {
    _id: string
    name: string
    email: string
  }
  cancelledAt?: string
  meetingLink?: string
  meetingPlatform?: 'zoom' | 'google-meet' | 'teams' | 'other'
  createdAt: string
  updatedAt: string
}

export interface RequestSessionResponse {
  success: boolean
  message: string
  data: Session
}

export async function requestSession(
  request: RequestSessionRequest,
): Promise<RequestSessionResponse> {
  try {
    const { data } = await apiClient.post<RequestSessionResponse>(
      '/sessions/request',
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

export interface GetTeacherSessionRequestsParams {
  page?: number
  limit?: number
  status?: 'requested' | 'accepted' | 'rejected' | 'scheduled'
  subject?: string // Subject ID
  date?: string // YYYY-MM-DD format for single date filter
  search?: string // Search term for session title/name
}

export interface TeacherSessionRequestsResponse {
  success: boolean
  message: string
  data: {
    sessions: Session[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export async function getTeacherSessionRequests(
  params?: GetTeacherSessionRequestsParams,
): Promise<TeacherSessionRequestsResponse> {
  try {
    const { data } = await apiClient.get<TeacherSessionRequestsResponse>(
      '/sessions/teacher/requests',
      {
        params,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export interface AcceptSessionRequest {
  title?: string
  description?: string
}

export interface AcceptSessionResponse {
  success: boolean
  message: string
  data: Session
}

export async function acceptSessionRequest(
  sessionId: string,
  request?: AcceptSessionRequest,
): Promise<AcceptSessionResponse> {
  try {
    const { data } = await apiClient.post<AcceptSessionResponse>(
      `/sessions/${sessionId}/accept`,
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

export interface RejectSessionResponse {
  success: boolean
  message: string
  data: Session
}

export interface RejectSessionRequest {
  reason: string
}

export async function rejectSessionRequest(
  sessionId: string,
  request: RejectSessionRequest,
): Promise<RejectSessionResponse> {
  try {
    const { data } = await apiClient.post<RejectSessionResponse>(
      `/sessions/${sessionId}/reject`,
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

export interface CancelSessionRequest {
  reason: string
}

export interface CancelSessionResponse {
  success: boolean
  message: string
  data: Session
}

export async function cancelSession(
  sessionId: string,
  request: CancelSessionRequest,
): Promise<CancelSessionResponse> {
  try {
    const { data } = await apiClient.post<CancelSessionResponse>(
      `/sessions/${sessionId}/cancel`,
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

export interface RescheduleSessionRequest {
  startTime: string // ISO 8601 date string
  endTime: string // ISO 8601 date string
}

export interface RescheduleSessionResponse {
  success: boolean
  message: string
  data: Session
}

export async function rescheduleSession(
  sessionId: string,
  request: RescheduleSessionRequest,
): Promise<RescheduleSessionResponse> {
  try {
    const { data } = await apiClient.post<RescheduleSessionResponse>(
      `/sessions/${sessionId}/reschedule`,
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

export interface GetSessionsParams {
  page?: number
  limit?: number
  focusOne?: string
  cohort?: string
  status?: string
  subject?: string
  date?: string // YYYY-MM-DD format for single date filter
  search?: string // Search term for session title/name
}

export interface GetSessionsResponse {
  success: boolean
  message: string
  data: {
    sessions: Session[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export async function getSessions(
  params?: GetSessionsParams,
): Promise<GetSessionsResponse> {
  try {
    const { data } = await apiClient.get<GetSessionsResponse>(
      '/sessions',
      {
        params,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export interface GetAvailableSlotsParams {
  focusOne: string
  subject: string
  date: string // YYYY-MM-DD format
  duration?: number // Duration in minutes, default 75
}

export interface AvailableSlot {
  startTime: string // ISO 8601 date string
  endTime: string // ISO 8601 date string
  startTimeFormatted: string // Formatted time string (e.g., "9:00 AM")
  endTimeFormatted: string // Formatted time string (e.g., "10:00 AM")
}

export interface GetAvailableSlotsResponse {
  success: boolean
  message: string
  data: {
    date: string
    availableSlots: AvailableSlot[]
    totalSlots: number
    slotDurationMinutes: number
  }
}

export async function getAvailableSlots(
  params: GetAvailableSlotsParams,
): Promise<GetAvailableSlotsResponse> {
  try {
    const { data } = await apiClient.get<GetAvailableSlotsResponse>(
      '/sessions/available-slots',
      {
        params,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export interface TeacherScheduleSessionRequest {
  title: string
  description: string // Reason for the session
  startTime: string // ISO 8601 date string
  endTime: string // ISO 8601 date string
  focusOne: string // FocusOne ID
  subject?: string // Subject ID (optional)
}

export interface TeacherScheduleSessionResponse {
  success: boolean
  message: string
  data: Session
}

export async function teacherScheduleSession(
  request: TeacherScheduleSessionRequest,
): Promise<TeacherScheduleSessionResponse> {
  try {
    const { data } = await apiClient.post<TeacherScheduleSessionResponse>(
      '/sessions/teacher/schedule',
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

