import React, { useState, useCallback, useEffect, useRef } from 'react'
import MapCanvas from './components/MapCanvas'
import DrawingPanel from './components/DrawingPanel'
import StatusBar from './components/StatusBar'
import { useGeolocation } from './hooks/useGeolocation'
import { useDrawingTrack } from './hooks/useDrawingTrack'
import { saveLayers, loadLayers, clearLayers } from './utils/storage'
import { fetchOsrmRoute, straightLinePoints } from './utils/routing'

export default function App() {
  const [layers, setLayers] = useState(() => loadLayers())
  const [isRecording, setIsRecording] = useState(false)
  const { startSession, addPoint, endSession, isActive } = useDrawingTrack()
  const sessionPendingRef = useRef(null)

  // Route mode state
  const [routeMode, setRouteMode] = useState(false)
  const [routeWaypoints, setRouteWaypoints] = useState([])
  const routeWaypointsRef = useRef([])
  const [routePreview, setRoutePreview] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState(null)

  useEffect(() => { saveLayers(layers) }, [layers])

  const handlePosition = useCallback((pos) => {
    if (!isActive()) return
    const session = addPoint(pos)
    if (!session) return

    if (session.mode === 'track') {
      setLayers(prev => {
        const last = prev[prev.length - 1]
        if (last && last.id === session._id) {
          return [...prev.slice(0, -1), { ...last, points: [...session.points] }]
        }
        return prev
      })
    }
  }, [isActive, addPoint])

  const [tracking, setTracking] = useState(false)
  const { position, error, loading, getOnce } = useGeolocation({ tracking, onPosition: handlePosition })

  useEffect(() => {
    getOnce()
    // eslint-disable-next-line
  }, [])

  const handleStart = useCallback(({ mode, content, color, fontSize }) => {
    if (mode === 'stamp') {
      if (!position) { alert('位置情報を取得できていません。しばらく待ってください。'); return }
      const newLayer = {
        id: Date.now().toString(),
        mode: 'stamp',
        content, color, fontSize,
        lat: position.lat,
        lng: position.lng,
      }
      setLayers(prev => [...prev, newLayer])
    } else {
      const id = Date.now().toString()
      const newLayer = { id, mode: 'track', content, color, fontSize, points: [] }
      startSession({ mode, content, color, fontSize })
      newLayer._id = id
      sessionPendingRef.current = id
      setLayers(prev => [...prev, newLayer])
      setTracking(true)
      setIsRecording(true)
    }
  }, [position, startSession])

  const handleStop = useCallback(() => {
    setTracking(false)
    setIsRecording(false)
    endSession()
  }, [endSession])

  const handleRouteReset = useCallback(() => {
    routeWaypointsRef.current = []
    setRouteWaypoints([])
    setRoutePreview([])
    setRouteError(null)
  }, [])

  const handleMapClick = useCallback(async (latLng) => {
    if (!routeMode) return
    routeWaypointsRef.current = [...routeWaypointsRef.current, latLng]
    const snapshot = [...routeWaypointsRef.current]
    setRouteWaypoints(snapshot)
    if (snapshot.length < 2) return

    setRouteLoading(true)
    setRouteError(null)
    try {
      setRoutePreview(await fetchOsrmRoute(snapshot))
    } catch {
      setRouteError('ルート取得失敗 (直線で代替)')
      setRoutePreview(straightLinePoints(snapshot))
    } finally {
      setRouteLoading(false)
    }
  }, [routeMode])

  const handleRouteConfirm = useCallback(({ content, color, fontSize }) => {
    if (routeWaypointsRef.current.length < 2 || routePreview.length === 0) return
    setLayers(prev => [...prev, {
      id: Date.now().toString(),
      mode: 'route',
      content, color, fontSize,
      waypoints: routeWaypointsRef.current,
      routePoints: routePreview,
    }])
    routeWaypointsRef.current = []
    setRouteWaypoints([])
    setRoutePreview([])
    setRouteError(null)
  }, [routePreview])

  const handleModeChange = useCallback((newMode) => {
    if (newMode !== 'route') {
      setRouteMode(false)
      routeWaypointsRef.current = []
      setRouteWaypoints([])
      setRoutePreview([])
      setRouteError(null)
    } else {
      setRouteMode(true)
    }
  }, [])

  const handleClear = useCallback(() => {
    if (window.confirm('全ての描画を削除しますか？')) {
      clearLayers()
      setLayers([])
      if (isRecording) handleStop()
      handleRouteReset()
    }
  }, [isRecording, handleStop, handleRouteReset])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      <MapCanvas
        position={position}
        layers={layers}
        onMapClick={handleMapClick}
        routeMode={routeMode}
        routeWaypoints={routeWaypoints}
        routePreview={routePreview}
        routeLoading={routeLoading}
      />

      <DrawingPanel
        onStart={handleStart}
        onStop={handleStop}
        isRecording={isRecording}
        onClear={handleClear}
        onModeChange={handleModeChange}
        onRouteConfirm={handleRouteConfirm}
        onRouteReset={handleRouteReset}
        routeWaypoints={routeWaypoints}
        routeLoading={routeLoading}
        routeError={routeError}
      />

      <StatusBar
        position={position}
        error={error}
        loading={loading}
        layerCount={layers.length}
      />
    </div>
  )
}
