import { AxiosError } from 'axios'

import type { ApiErrorDetail, ApiErrorResponse } from '@/types/api'

export interface ApiClientErrorOptions {
  status?: number
  errors?: ApiErrorDetail[]
  code?: string
  details?: Record<string, unknown>
}

export class ApiClientError extends Error {
  status?: number
  errors?: ApiErrorDetail[]
  code?: string
  details?: Record<string, unknown>

  constructor(message: string, options: ApiClientErrorOptions = {}) {
    super(message)
    this.name = 'ApiClientError'
    if (options.status !== undefined) {
      this.status = options.status
    }
    if (options.errors) {
      this.errors = options.errors
    }
    if (options.code) {
      this.code = options.code
    }
    if (options.details) {
      this.details = options.details
    }
  }
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorResponse | undefined
    if (payload && payload.success === false) {
      const status = error.response?.status
      const detailErrors: ApiErrorDetail[] = []

      if (Array.isArray(payload.errors)) {
        detailErrors.push(...payload.errors)
      }

      const details = payload.error?.details
      if (details && typeof details === 'object' && 'validationErrors' in details) {
        const validationErrors = (details as { validationErrors?: unknown }).validationErrors
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((message) => {
            if (typeof message === 'string') {
              detailErrors.push({ message })
            }
          })
        }
      }

      const message =
        payload.error?.message ||
        payload.message ||
        error.response?.statusText ||
        'Request failed'

      const options: ApiClientErrorOptions = {}
      if (status !== undefined) {
        options.status = status
      }
      if (detailErrors.length) {
        options.errors = detailErrors
      }
      if (payload.error?.code && typeof payload.error.code === 'string') {
        options.code = payload.error.code
      }
      if (payload.error?.details && typeof payload.error.details === 'object') {
        options.details = payload.error.details as Record<string, unknown>
      }

      return new ApiClientError(message, options)
    }

    const message =
      (typeof error.response?.data === 'object' &&
        error.response?.data !== null &&
        'message' in (error.response?.data as Record<string, unknown>) &&
        typeof (error.response?.data as Record<string, unknown>).message === 'string' &&
        (error.response?.data as Record<string, string>).message) ||
      error.message ||
      'Request failed'

    const options: ApiClientErrorOptions = {}
    if (error.response?.status !== undefined) {
      options.status = error.response.status
    }

    return new ApiClientError(message, options)
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message)
  }

  return new ApiClientError('Something went wrong')
}

