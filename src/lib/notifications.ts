import { toast } from 'sonner'

import { toApiClientError } from '@/lib/http/api-error'

export function notifySuccess(message?: string | null, fallback = 'Success', description?: string) {
  const title = message && message.trim().length ? message : fallback
  toast.success(title, description ? { description } : undefined)
}

export function notifyError(message?: string | null, fallback = 'Something went wrong', description?: string) {
  const title = message && message.trim().length ? message : fallback
  toast.error(title, description ? { description } : undefined)
}

export interface NormalizedApiError {
  message: string
  fieldErrors: Record<string, string>
  generalMessages: string[]
}

export function handleApiError(error: unknown, fallbackMessage = 'Something went wrong'): NormalizedApiError {
  const apiError = toApiClientError(error)

  const fieldErrors: Record<string, string> = {}
  const generalMessages: string[] = []

  apiError.errors?.forEach((detail) => {
    if (detail.field) {
      if (detail.message) {
        fieldErrors[detail.field] = detail.message
      }
    } else if (detail.message) {
      generalMessages.push(detail.message)
    }
  })

  const message = apiError.message?.trim()
    ? apiError.message.trim()
    : fallbackMessage

  notifyError(message, fallbackMessage)

  return {
    message,
    fieldErrors,
    generalMessages,
  }
}

