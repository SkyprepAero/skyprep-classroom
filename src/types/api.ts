export interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
}

export interface ApiErrorDetail {
  field?: string
  message: string
}

export interface ApiErrorBody {
  code?: string
  message?: string
  details?:
    | {
        validationErrors?: string[]
        [key: string]: unknown
      }
    | Record<string, unknown>
}

export interface ApiErrorResponse {
  success: false
  message?: string
  error?: ApiErrorBody
  errors?: ApiErrorDetail[]
  stack?: string
}

