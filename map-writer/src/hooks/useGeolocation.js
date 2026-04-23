import { useState, useEffect, useRef, useCallback } from 'react'

export function useGeolocation({ tracking = false, onPosition } = {}) {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const watchIdRef = useRef(null)

  const handleSuccess = useCallback((pos) => {
    const coords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    }
    setPosition(coords)
    setLoading(false)
    onPosition?.(coords)
  }, [onPosition])

  const handleError = useCallback((err) => {
    setError(err.message)
    setLoading(false)
  }, [])

  const getOnce = useCallback(() => {
    if (!navigator.geolocation) {
      setError('このブラウザは位置情報をサポートしていません')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  }, [handleSuccess, handleError])

  useEffect(() => {
    if (!tracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }
    if (!navigator.geolocation) {
      setError('このブラウザは位置情報をサポートしていません')
      return
    }
    setLoading(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess, handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [tracking, handleSuccess, handleError])

  return { position, error, loading, getOnce }
}
