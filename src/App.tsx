import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { ThemeProvider, useTheme } from '@/components/theme-provider'
import { SessionAutoLogout } from '@/components/session-auto-logout'
import { AppRoutes } from '@/routes/app-routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,
    },
  },
})

function AppContent() {
  const { theme } = useTheme()

  return (
    <>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <SessionAutoLogout />
      <Toaster richColors position="top-right" theme={theme} />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
