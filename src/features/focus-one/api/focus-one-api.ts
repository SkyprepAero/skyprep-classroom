import apiClient from '@/lib/http/axios'
import { toApiClientError } from '@/lib/http/api-error'
import type { ApiSuccessResponse } from '@/types/api'

export interface FocusOne {
  _id: string
  description?: string
  student?: {
    _id: string
    name: string
    email: string
  }
  teacherSubjectMappings?: Array<{
    teacher: {
      _id: string
      name: string
      email: string
    }
    subject: {
      _id: string
      name: string
      description?: string
    }
  }>
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  isActive: boolean
  enrolledAt?: string
  startedAt?: string
  createdAt: string
  updatedAt: string
}

export interface GetTeacherFocusOnesParams {
  page?: number
  limit?: number
}

export interface TeacherFocusOnesResponse {
  success: boolean
  message: string
  data: {
    focusOnes: FocusOne[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export async function getTeacherFocusOnes(
  params?: GetTeacherFocusOnesParams,
): Promise<TeacherFocusOnesResponse> {
  try {
    const { data } = await apiClient.get<TeacherFocusOnesResponse>(
      '/focus-ones/teacher/mine',
      {
        params,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export interface GetTeacherFocusOneResponse {
  success: boolean
  message: string
  data: FocusOne
}

export async function getTeacherFocusOneById(
  focusOneId: string,
): Promise<GetTeacherFocusOneResponse> {
  try {
    const { data } = await apiClient.get<GetTeacherFocusOneResponse>(
      `/focus-ones/teacher/mine/${focusOneId}`,
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

