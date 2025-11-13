import { type ComponentProps } from 'react'
import { useLottie } from 'lottie-react'

import loadingAnimation from '@/animations/loading.json'
import { cn } from '@/lib/utils'

type LottieSize = 'small' | 'medium' | 'large'

const sizeClasses: Record<LottieSize, string> = {
  small: 'h-[256px] w-[256px]',
  medium: 'h-[384px] w-[384px]',
  large: 'h-[512px] w-[512px]',
}

const sizeStyles: Record<LottieSize, { width: number; height: number }> = {
  small: { width: 256, height: 256 },
  medium: { width: 384, height: 384 },
  large: { width: 512, height: 512 },
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

