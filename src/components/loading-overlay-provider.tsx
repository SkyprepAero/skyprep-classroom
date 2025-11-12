import { createContext, useContext, useEffect, useState } from 'react'

import { LottieLoader } from '@/components/ui/lottie-loader'
import { subscribeLoadingOverlay } from '@/lib/http/axios'

const LoadingOverlayContext = createContext<{ isVisible: boolean }>({ isVisible: false })

export function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('large')

  useEffect(() => {
    const unsubscribe = subscribeLoadingOverlay((visible) => {
      setIsVisible(visible)
      setSize('large')
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <LoadingOverlayContext.Provider value={{ isVisible }}>
      <LottieLoader
        isVisible={isVisible}
        overlay
        size={size}
        message="Working on it..."
      />
      {children}
    </LoadingOverlayContext.Provider>
  )
}

export function useLoadingOverlay() {
  return useContext(LoadingOverlayContext)
}

