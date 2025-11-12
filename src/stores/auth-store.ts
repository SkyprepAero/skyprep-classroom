import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  tokenExpiresAt: number | null
  isAuthenticated: boolean
  login: (payload: { user: AuthUser; token: string; tokenExpiresAt?: string | number | null }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      login: ({ user, token, tokenExpiresAt }) => {
        const expiresMs =
          tokenExpiresAt !== undefined && tokenExpiresAt !== null
            ? typeof tokenExpiresAt === 'string'
              ? Number.isNaN(new Date(tokenExpiresAt).getTime())
                ? null
                : new Date(tokenExpiresAt).getTime()
              : tokenExpiresAt
            : null
        set({
          user,
          token,
          tokenExpiresAt: typeof expiresMs === 'number' ? expiresMs : null,
          isAuthenticated: true,
        })
      },
      logout: () =>
        set({
          user: null,
          token: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'skyprep-classroom-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

export const authStore = {
  getState: () => useAuthStore.getState(),
  getToken: () => useAuthStore.getState().token,
  getTokenExpiresAt: () => useAuthStore.getState().tokenExpiresAt,
  clear: () => useAuthStore.getState().logout(),
}

