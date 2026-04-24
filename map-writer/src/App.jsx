import React, { useState, useCallback, useEffect, useRef } from 'react'
import MapCanvas from './components/MapCanvas'
import DesignScreen from './components/DesignScreen'
import NavigationPanel from './components/NavigationPanel'
import StatusBar from './components/StatusBar'
import { useGeolocation } from './hooks/useGeolocation'
import { textToGpsRoute, subsampleWaypoints } from './utils/textToRoute'
import { haversineDist, bearingDeg } from './utils/geo'
import { fetchFootRoute } from './utils/routing'

const ADVANCE_THRESHOLD = 15

function estimateDistanceKm(route) {
  if (!route || route.length < 2) return 0
  let total = 0
  for (let i = 0; i < route.length - 1; i++) total += haversineDist(route[i], route[i + 1])
  return total / 1000
}

export default function App() {
  // 'design' → 'preview' → 'navigating' → 'complete'
  const [appMode, setAppMode] = useState('design')
  const [plannedRoute, setPlannedRoute] = useState([])
  const [gpsTrace, setGpsTrace] = useState([])
  const [waypointIdx, setWaypointIdx] = useState(0)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState(null)

  // Refs to avoid stale closures in GPS callback
  const navRef = useRef({ mode: 'design', route: [], idx: 0 })

  const [tracking, setTracking] = useState(false)

  const handlePosition = useCallback((pos) => {
    const { mode, route, idx } = navRef.current
    if (mode !== 'navigating') return

    setGpsTrace(prev => [...prev, { lat: pos.lat, lng: pos.lng }])

    const target = route[idx]
    if (!target) return

    const dist = haversineDist(pos, target)
    if (dist < ADVANCE_THRESHOLD) {
      const next = idx + 1
      if (next >= route.length) {
        navRef.current.mode = 'complete'
        setAppMode('complete')
        setTracking(false)
      } else {
        navRef.current.idx = next
        setWaypointIdx(next)
      }
    }
  }, [])

  const { position, error, loading, getOnce } = useGeolocation({
    tracking,
    onPosition: handlePosition,
  })

  useEffect(() => {
    getOnce()
    // eslint-disable-next-line
  }, [])

  const handleCreateRoute = useCallback(async (text, scale) => {
    if (!position) return
    setRouteLoading(true)
    setRouteError(null)

    const allWaypoints = textToGpsRoute(text, position, scale)
    if (allWaypoints.length === 0) { setRouteLoading(false); return }

    const keyCount = Math.min(25, Math.max(10, text.length * 7))
    const keyWaypoints = subsampleWaypoints(allWaypoints, keyCount)

    let route
    try {
      route = await fetchFootRoute(keyWaypoints)
    } catch {
      setRouteError('道路ルート取得失敗。直線ルートで代替します。')
      route = allWaypoints
    }

    setPlannedRoute(route)
    navRef.current.route = route
    setWaypointIdx(0)
    navRef.current.idx = 0
    setGpsTrace([])
    setRouteLoading(false)
    setAppMode('preview')
    navRef.current.mode = 'preview'
  }, [position])

  const handleStartNav = useCallback(() => {
    setAppMode('navigating')
    navRef.current.mode = 'navigating'
    setTracking(true)
  }, [])

  const handleCompleteNav = useCallback(() => {
    setTracking(false)
    navRef.current.mode = 'complete'
    setAppMode('complete')
  }, [])

  const handleRestart = useCallback(() => {
    setTracking(false)
    setPlannedRoute([])
    setGpsTrace([])
    setWaypointIdx(0)
    navRef.current = { mode: 'design', route: [], idx: 0 }
    setAppMode('design')
  }, [])

  // Current navigation target for distance/bearing display
  const currentTarget = plannedRoute[waypointIdx]
  const distToTarget = position && currentTarget
    ? haversineDist(position, currentTarget)
    : null
  const bearingToTarget = position && currentTarget
    ? bearingDeg(position, currentTarget)
    : null

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
        appMode={appMode}
        plannedRoute={plannedRoute}
        waypointIdx={waypointIdx}
        gpsTrace={gpsTrace}
      />

      {appMode === 'design' && (
        <DesignScreen
          position={position}
          onCreateRoute={handleCreateRoute}
          loading={routeLoading}
          routeError={routeError}
        />
      )}

      {appMode === 'preview' && (
        <div style={styles.previewPanel}>
          <div style={styles.previewTitle}>ルートプレビュー</div>
          <div style={styles.previewSub}>
            約 {estimateDistanceKm(plannedRoute).toFixed(1)} km のウォーキング
          </div>
          <button style={styles.navBtn} onClick={handleStartNav}>
            ▶ ナビ開始
          </button>
          <button style={styles.backBtn} onClick={handleRestart}>
            ← 戻る
          </button>
        </div>
      )}

      {appMode === 'navigating' && (
        <NavigationPanel
          waypointIdx={waypointIdx}
          totalWaypoints={plannedRoute.length}
          distanceMeters={distToTarget}
          bearingDegrees={bearingToTarget}
          onComplete={handleCompleteNav}
        />
      )}

      {appMode === 'complete' && (
        <div style={styles.completePanel}>
          <div style={styles.completeTitle}>🎉 完成！</div>
          <div style={styles.completeSub}>
            GPS軌跡が地図に描かれました
          </div>
          <button style={styles.navBtn} onClick={handleRestart}>
            もう一度作る
          </button>
        </div>
      )}

      <StatusBar
        position={position}
        error={error}
        loading={loading}
        layerCount={0}
      />
    </div>
  )
}

const styles = {
  previewPanel: {
    position: 'absolute', top: 16, left: 16, zIndex: 1000,
    width: 220,
    background: 'rgba(10,10,15,0.93)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 8,
    fontFamily: "'Space Mono', monospace",
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  previewTitle: { fontSize: 14, fontWeight: 700, color: '#f5f0e8' },
  previewSub: { fontSize: 11, color: 'rgba(245,240,232,0.4)', marginBottom: 4 },
  navBtn: {
    padding: '10px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #ff3d00, #ff6d00)',
    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
  },
  backBtn: {
    padding: '8px', borderRadius: 10,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(245,240,232,0.4)', fontSize: 11, cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
  },
  completePanel: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000, width: 260,
    background: 'rgba(10,10,15,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: 24,
    display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
    fontFamily: "'Space Mono', monospace",
    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
    textAlign: 'center',
  },
  completeTitle: { fontSize: 28, color: '#f5f0e8', fontWeight: 700 },
  completeSub: { fontSize: 12, color: 'rgba(245,240,232,0.5)', lineHeight: 1.5 },
}
