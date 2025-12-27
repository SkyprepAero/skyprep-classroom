import { useEffect, useState, useRef } from 'react'
import { getMyEnrollment, type EnrollmentDetails } from '@/features/auth/api/auth-api'
import { useAuthStore } from '@/stores/auth-store'

export function useEnrollment() {
  const user = useAuthStore((state) => state.user)
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!user?.enrollmentType || !user?.id) {
      setEnrollment(null)
      isFetchingRef.current = false
      return
    }

    // Prevent duplicate concurrent fetches
    if (isFetchingRef.current) {
      return
    }

    let cancelled = false
    isFetchingRef.current = true

    const fetchEnrollment = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getMyEnrollment()
        // Only update state if component is still mounted and not cancelled
        if (!cancelled && isMountedRef.current) {
          if (response.data) {
            setEnrollment(response.data)
          } else {
            setEnrollment(null)
          }
        }
      } catch (err) {
        // Only update state if component is still mounted and not cancelled
        if (!cancelled && isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to fetch enrollment'))
          setEnrollment(null)
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setLoading(false)
        }
        isFetchingRef.current = false
      }
    }

    fetchEnrollment()

    // Cleanup function
    return () => {
      cancelled = true
      isFetchingRef.current = false
    }
  }, [user?.enrollmentType, user?.id])

  return {
    enrollment,
    loading,
    error,
    enrollmentType: user?.enrollmentType || null,
  }
}

