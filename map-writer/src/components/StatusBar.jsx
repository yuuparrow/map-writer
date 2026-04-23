import React from 'react'

export default function StatusBar({ position, error, loading, layerCount }) {
  return (
    <div style={styles.bar}>
      {loading && <span style={styles.loading}>📡 GPS取得中...</span>}
      {error && <span style={styles.error}>⚠ {error}</span>}
      {position && !loading && (
        <span style={styles.coords}>
          📍 {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          <span style={styles.acc}> ±{Math.round(position.accuracy)}m</span>
        </span>
      )}
      {!position && !loading && !error && (
        <span style={styles.idle}>位置情報を許可してください</span>
      )}
      <span style={styles.count}>レイヤー: {layerCount}</span>
    </div>
  )
}

const styles = {
  bar: {
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
    zIndex: 1000, display: 'flex', alignItems: 'center', gap: 16,
    background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100,
    padding: '8px 20px', fontSize: 11,
    fontFamily: "'Space Mono', monospace", color: 'rgba(245,240,232,0.6)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  loading: { color: '#0066ff' },
  error: { color: '#ff3d00' },
  coords: { color: '#00e676' },
  acc: { color: 'rgba(245,240,232,0.35)' },
  idle: { color: 'rgba(245,240,232,0.35)' },
  count: { color: 'rgba(245,240,232,0.35)', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 },
}
