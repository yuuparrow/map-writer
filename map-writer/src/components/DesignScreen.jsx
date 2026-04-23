import React, { useState, useRef, useEffect } from 'react'

const SCALES = [
  { label: '100m', value: 100, desc: '徒歩 小規模' },
  { label: '300m', value: 300, desc: '徒歩 数ブロック' },
  { label: '500m', value: 500, desc: 'ジョギング向け' },
  { label: '1km', value: 1000, desc: 'サイクリング向け' },
]

export default function DesignScreen({ position, onCreateRoute }) {
  const [text, setText] = useState('')
  const [scale, setScale] = useState(300)
  const canvasRef = useRef(null)

  // Re-render canvas preview whenever text changes
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

  const canCreate = text.trim().length > 0 && position != null

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

      {/* Canvas preview */}
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

      <div style={s.section}>
        <label style={s.label}>スケール（文字の高さ）</label>
        <div style={s.scaleRow}>
          {SCALES.map(opt => (
            <button
              key={opt.value}
              style={{ ...s.scaleBtn, ...(scale === opt.value ? s.scaleBtnActive : {}) }}
              onClick={() => setScale(opt.value)}
            >
              <span style={s.scaleBtnLabel}>{opt.label}</span>
              <span style={s.scaleBtnDesc}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={s.gpsStatus}>
        {position
          ? <><span style={s.gpsDot} /> GPS取得済み</>
          : <><span style={{ ...s.gpsDot, background: '#ffea00' }} /> GPS取得中...</>
        }
      </div>

      <button
        style={{ ...s.createBtn, ...(canCreate ? {} : s.createBtnDisabled) }}
        disabled={!canCreate}
        onClick={() => onCreateRoute(text.trim(), scale)}
      >
        🗺️ ルートを作成
      </button>
    </div>
  )
}

const s = {
  panel: {
    position: 'absolute', top: 16, left: 16, zIndex: 1000,
    width: 280,
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
  scaleRow: { display: 'flex', gap: 6 },
  scaleBtn: {
    flex: 1, padding: '6px 2px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: 'rgba(245,240,232,0.45)',
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2, fontFamily: "'Space Mono', monospace",
    transition: 'all .15s',
  },
  scaleBtnActive: {
    background: 'rgba(255,61,0,0.2)', borderColor: '#ff3d00', color: '#ff3d00',
  },
  scaleBtnLabel: { fontSize: 12, fontWeight: 700 },
  scaleBtnDesc: { fontSize: 8, opacity: 0.7 },
  gpsStatus: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, color: 'rgba(245,240,232,0.5)',
  },
  gpsDot: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: '#00e676',
    boxShadow: '0 0 6px #00e676',
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
}
