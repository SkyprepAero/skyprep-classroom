import { type ComponentProps } from 'react'
import { useLottie } from 'lottie-react'

import loadingAnimation from '@/animations/loading.json'
import { cn } from '@/lib/utils'

type LottieSize = 'small' | 'medium' | 'large'

const sizeClasses: Record<LottieSize, string> = {
  small: 'h-64 w-64',
  medium: 'h-128 w-128',
  large: 'h-200 w-200',
}

const sizeStyles: Record<LottieSize, { width: number; height: number }> = {
  small: { width: 128, height: 128 },
  medium: { width: 192, height: 192 },
  large: { width: 256, height: 256 },
}

export interface LottieLoaderProps extends ComponentProps<'div'> {
  isVisible: boolean
  size?: LottieSize
  overlay?: boolean
  message?: string
}

export function LottieLoader({
  isVisible,
  size = 'medium',
  overlay = true,
  message,
  className,
  ...props
}: LottieLoaderProps) {
  if (!isVisible) return null

  const { View } = useLottie({
    animationData: loadingAnimation,
    loop: true,
    autoplay: true,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet',
    },
  })

  const content = (
    <div
      className={cn('flex flex-col items-center justify-center', className)}
      {...props}
    >
      <div
        className={cn(sizeClasses[size], 'drop-shadow-lg')}
        style={sizeStyles[size]}
      >
        {View}
      </div>
      {message ? (
        <p className="mt-4 text-sm text-muted-foreground text-center">{message}</p>
      ) : null}
    </div>
  )

  if (!overlay) return content

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {content}
    </div>
  )
}

