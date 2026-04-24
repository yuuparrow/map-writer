import React, { useState, useRef, useEffect } from 'react'

export default function DesignScreen({ position, onCreateRoute, loading, routeError }) {
  const [text, setText] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!text) return
    const fontSize = 60
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#ff3d00'
    ctx.fillText(text, 10, 8)
  }, [text])

  const canCreate = text.trim().length > 0 && position != null && !loading

  return (
    <div style={s.panel}>
      <div style={s.logo}>✍ GPS Art</div>

      <div style={s.section}>
        <label style={s.label}>描く文字を入力</label>
        <input
          style={s.input}
          value={text}
          onChange={e => setText(e.target.value.slice(0, 8))}
          placeholder="例: LOVE, 東京, A..."
          maxLength={8}
          autoFocus
        />
        <div style={s.hint}>最大8文字 · アルファベット推奨</div>
      </div>

      {text.length > 0 && (
        <div style={s.previewBox}>
          <canvas
            ref={canvasRef}
            width={260}
            height={80}
            style={{ display: 'block', width: '100%' }}
          />
        </div>
      )}

      <div style={s.gpsStatus}>
        {position
          ? <><span style={s.gpsDot} /> GPS取得済み</>
          : <><span style={{ ...s.gpsDot, background: '#ffea00' }} /> GPS取得中...</>
        }
      </div>

      {loading && (
        <div style={s.loadingMsg}>
          <span style={s.loadingDot} />
          最適なスケールを探しています...
        </div>
      )}

      <button
        style={{ ...s.createBtn, ...(canCreate ? {} : s.createBtnDisabled) }}
        disabled={!canCreate}
        onClick={() => onCreateRoute(text.trim())}
      >
        {loading ? '計算中...' : '🗺️ ルートを作成'}
      </button>

      {routeError && (
        <div style={s.errorMsg}>⚠ {routeError}</div>
      )}
    </div>
  )
}

const s = {
  panel: {
    position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000,
    maxWidth: 360,
    background: 'rgba(10,10,15,0.93)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    fontFamily: "'Space Mono', monospace",
  },
  logo: { fontSize: 16, fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.5px' },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 10, color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 12px', color: '#f5f0e8', fontSize: 18,
    fontFamily: "'Space Mono', monospace", outline: 'none', letterSpacing: 2,
  },
  hint: { fontSize: 10, color: 'rgba(245,240,232,0.25)' },
  previewBox: {
    background: 'rgba(0,0,0,0.4)', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden', padding: '4px 0',
  },
  gpsStatus: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, color: 'rgba(245,240,232,0.5)',
  },
  gpsDot: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: '#00e676',
    boxShadow: '0 0 6px #00e676',
  },
  loadingMsg: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, color: 'rgba(245,240,232,0.5)',
    padding: '6px 10px', background: 'rgba(0,102,255,0.08)',
    borderRadius: 8, border: '1px solid rgba(0,102,255,0.15)',
  },
  loadingDot: {
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: '#0066ff', boxShadow: '0 0 6px #0066ff',
    animation: 'pulse 1s infinite', flexShrink: 0,
  },
  createBtn: {
    padding: '12px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #ff3d00, #ff6d00)',
    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
  },
  createBtnDisabled: {
    opacity: 0.35, cursor: 'not-allowed',
    background: 'rgba(255,255,255,0.08)',
  },
  errorMsg: { fontSize: 10, color: '#ff3d00', padding: '2px 0' },
}
