import { useRef, useCallback } from 'react'

/**
 * Manages a drawing session:
 * - "stamp" mode: place text/emoji at a fixed location
 * - "track" mode: accumulate GPS positions while user moves → polyline
 */
export function useDrawingTrack() {
  const sessionRef = useRef(null)

  const startSession = useCallback(({ mode, content, color, fontSize }) => {
    sessionRef.current = { mode, content, color, fontSize, points: [] }
  }, [])

  const addPoint = useCallback((latLng) => {
    if (!sessionRef.current) return null
    sessionRef.current.points.push({ ...latLng, t: Date.now() })
    return sessionRef.current
  }, [])

  const endSession = useCallback(() => {
    const s = sessionRef.current
    sessionRef.current = null
    return s
  }, [])

  const isActive = useCallback(() => !!sessionRef.current, [])

  return { startSession, addPoint, endSession, isActive }
}
