import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
  isError?: boolean
  className?: string
  idPrefix?: string
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  isError = false,
  className,
  idPrefix = 'otp-input',
}: OtpInputProps) {
  const digits = useMemo(() => {
    const sanitized = value.replace(/\D/g, '').slice(0, length)
    return Array.from({ length }, (_, index) => sanitized[index] ?? '')
  }, [length, value])

  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!autoFocus || disabled) {
      return
    }

    const firstInput = inputRefs.current[0]
    if (firstInput) {
      firstInput.focus()
      firstInput.select()
    }
  }, [autoFocus, disabled])

  const focusInput = useCallback((index: number) => {
    const target = inputRefs.current[index]
    if (target) {
      target.focus()
      target.select()
      setFocusedIndex(index)
    }
  }, [])

  const emitChange = useCallback(
    (nextDigits: string[]) => {
      onChange(nextDigits.join(''))
    },
    [onChange],
  )

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
      if (disabled) return
      const raw = event.target.value
      const sanitized = raw.replace(/\D/g, '')
      const nextDigits = [...digits]

      if (sanitized.length === 0) {
        nextDigits[index] = ''
        emitChange(nextDigits)
        return
      }

      let lastFilled = index
      for (let i = 0; i < sanitized.length && index + i < length; i += 1) {
        const position = index + i
        const char = sanitized.charAt(i)
        if (char) {
          nextDigits[position] = char
          lastFilled = position
        }
      }

      emitChange(nextDigits)

      focusInput(Math.min(lastFilled + 1, length - 1))
    },
    [disabled, digits, emitChange, focusInput, length],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (disabled) return

      switch (event.key) {
        case 'Backspace': {
          if (digits[index]) {
            const nextDigits = [...digits]
            nextDigits[index] = ''
            emitChange(nextDigits)
            event.preventDefault()
            return
          }
          if (index > 0) {
            focusInput(index - 1)
            const nextDigits = [...digits]
            nextDigits[index - 1] = ''
            emitChange(nextDigits)
            event.preventDefault()
          }
          break
        }
        case 'ArrowLeft': {
          if (index > 0) {
            focusInput(index - 1)
            event.preventDefault()
          }
          break
        }
        case 'ArrowRight': {
          if (index < length - 1) {
            focusInput(index + 1)
            event.preventDefault()
          }
          break
        }
        default:
          break
      }
    },
    [disabled, digits, emitChange, focusInput, length],
  )

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      if (disabled) return
      event.preventDefault()
      const pasted = event.clipboardData.getData('text')
      if (!pasted) {
        return
      }
      const sanitized = pasted.replace(/\D/g, '').slice(0, length)
      if (!sanitized) {
        return
      }

      const nextDigits = [...digits]
      let lastFilled = index
      for (let i = 0; i < sanitized.length && index + i < length; i += 1) {
        const position = index + i
        const char = sanitized.charAt(i)
        if (char) {
          nextDigits[position] = char
          lastFilled = position
        }
      }
      emitChange(nextDigits)
      focusInput(Math.min(lastFilled + 1, length - 1))
    },
    [disabled, digits, emitChange, focusInput, length],
  )

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        disabled ? 'opacity-70' : 'opacity-100',
        className,
      )}
    >
      {digits.map((digit, index) => (
        <input
          key={index} // eslint-disable-line react/no-array-index-key
          ref={(element) => {
            inputRefs.current[index] = element
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(event, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex((prev) => (prev === index ? null : prev))}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => handlePaste(event, index)}
          aria-invalid={isError}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            'h-14 w-12 rounded-xl border bg-background text-center text-lg font-semibold tracking-widest text-foreground shadow-sm transition-all duration-150 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:shadow-lg',
            'data-[focused=true]:scale-105 data-[focused=true]:shadow-md data-[filled=true]:border-primary/70 data-[filled=true]:shadow-md',
            isError
              ? 'border-destructive/70 focus-visible:ring-destructive/60 data-[filled=true]:border-destructive/70'
              : 'border-border/80 hover:border-primary/50',
            disabled ? 'cursor-not-allowed bg-muted/40' : 'cursor-text',
          )}
          data-focused={focusedIndex === index}
          data-filled={Boolean(digit)}
        />
      ))}
    </div>
  )
}

