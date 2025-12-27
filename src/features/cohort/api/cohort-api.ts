import apiClient from '@/lib/http/axios'
import { toApiClientError } from '@/lib/http/api-error'
import type { ApiSuccessResponse } from '@/types/api'

export interface Cohort {
  _id: string
  name: string
  slug: string
  description?: string
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
  subjects?: Array<{
    subject: {
      _id: string
      name: string
      description?: string
    }
    isActive: boolean
  }>
  createdAt: string
  updatedAt: string
}

export interface GetTeacherCohortsParams {
  page?: number
  limit?: number
}

export interface TeacherCohortsResponse {
  success: boolean
  message: string
  data: {
    cohorts: Cohort[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export async function getTeacherCohorts(
  params?: GetTeacherCohortsParams,
): Promise<TeacherCohortsResponse> {
  try {
    const { data } = await apiClient.get<TeacherCohortsResponse>(
      '/cohorts/teacher/mine',
      {
        params,
      },
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

export interface GetTeacherCohortResponse {
  success: boolean
  message: string
  data: Cohort
}

export async function getTeacherCohortById(
  cohortId: string,
): Promise<GetTeacherCohortResponse> {
  try {
    const { data } = await apiClient.get<GetTeacherCohortResponse>(
      `/cohorts/teacher/mine/${cohortId}`,
    )
    return data
  } catch (error) {
    throw toApiClientError(error)
  }
}

