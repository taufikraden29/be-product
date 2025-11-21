import { useEffect, useRef, useState } from 'react'

interface UseAutoRefreshOptions {
  interval?: number // in milliseconds, default 60000 (1 minute)
  enabled?: boolean // whether auto-refresh is enabled, default true
  onRefresh?: () => void // callback when refresh happens
}

interface UseAutoRefreshReturn {
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
  lastRefresh: Date | null
  nextRefresh: Date | null
  secondsUntilRefresh: number
  forceRefresh: () => void
}

export function useAutoRefresh(
  fetchFunction: () => Promise<void>,
  options: UseAutoRefreshOptions = {}
): UseAutoRefreshReturn {
  const {
    interval = 60000, // 1 minute default
    enabled: initialEnabled = true,
    onRefresh
  } = options

  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(interval / 1000)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const performRefresh = async () => {
    try {
      console.log('🔄 Auto-refresh triggered')
      await fetchFunction()
      setLastRefresh(new Date())
      setSecondsUntilRefresh(interval / 1000)
      startTimeRef.current = Date.now()
      
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('❌ Auto-refresh error:', error)
    }
  }

  const forceRefresh = () => {
    performRefresh()
  }

  useEffect(() => {
    if (!isEnabled) {
      // Clear intervals if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      return
    }

    console.log(`🚀 Auto-refresh enabled - interval: ${interval / 1000}s`)
    
    // Initial fetch
    performRefresh()

    // Set up refresh interval
    intervalRef.current = setInterval(() => {
      performRefresh()
    }, interval)

    // Set up countdown timer (update every second)
    startTimeRef.current = Date.now()
    countdownRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current
        const remaining = Math.max(0, interval - elapsed)
        setSecondsUntilRefresh(Math.ceil(remaining / 1000))
      }
    }, 1000)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [isEnabled, interval])

  const nextRefresh = lastRefresh 
    ? new Date(lastRefresh.getTime() + interval)
    : null

  return {
    isEnabled,
    setEnabled: setIsEnabled,
    lastRefresh,
    nextRefresh,
    secondsUntilRefresh,
    forceRefresh
  }
}
