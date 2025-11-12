export type GoogleCredentialResponse = {
  credential: string
  select_by?: string
  clientId?: string
}

export interface GoogleAccountsId {
  initialize(options: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    prompt_parent_id?: string
    context?: 'signin' | 'signup' | 'use'
  }): void
  renderButton(
    parent: HTMLElement,
    options?: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'small' | 'medium' | 'large'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number | string
    },
  ): void
  prompt(momentListener?: (notification: unknown) => void): void
  cancel?(): void
  disableAutoSelect?(): void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId
      }
    }
  }
}

let googleIdentityPromise: Promise<GoogleAccountsId> | null = null

export function waitForGoogleIdentity(): Promise<GoogleAccountsId> {
  if (googleIdentityPromise) {
    return googleIdentityPromise
  }

  const promise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const id = window.google?.accounts?.id
      if (id) {
        resolve(id)
        return true
      }
      return false
    }

    if (check()) {
      return
    }

    const interval = window.setInterval(() => {
      if (check()) {
        window.clearInterval(interval)
        window.clearTimeout(timeout)
      } else if (Date.now() - start > 10_000) {
        window.clearInterval(interval)
        window.clearTimeout(timeout)
        reject(new Error('Google Identity Services failed to load'))
      }
    }, 50)

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval)
      reject(new Error('Google Identity Services timed out'))
    }, 10_000)
  })

  googleIdentityPromise = promise.catch((error) => {
    googleIdentityPromise = null
    throw error
  })

  return googleIdentityPromise
}

