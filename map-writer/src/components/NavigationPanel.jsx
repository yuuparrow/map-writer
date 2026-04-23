import React from 'react'

function BearingArrow({ degrees }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r="22" fill="rgba(0,102,255,0.15)" stroke="rgba(0,102,255,0.4)" strokeWidth="1.5" />
      <g transform={`rotate(${degrees}, 24, 24)`}>
        <polygon points="24,6 30,34 24,30 18,34" fill="#0066ff" />
        <polygon points="24,42 30,34 24,30 18,34" fill="rgba(0,102,255,0.3)" />
      </g>
    </svg>
  )
}

export default function NavigationPanel({
  waypointIdx,
  totalWaypoints,
  distanceMeters,
  bearingDegrees,
  onComplete,
}) {
  const progress = totalWaypoints > 0 ? (waypointIdx / totalWaypoints) * 100 : 0
  const distText = distanceMeters < 1000
    ? `${Math.round(distanceMeters)}m`
    : `${(distanceMeters / 1000).toFixed(1)}km`

  return (
    <div style={s.panel}>
      {/* Progress bar */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      <div style={s.body}>
        <BearingArrow degrees={bearingDegrees ?? 0} />

        <div style={s.info}>
          <div style={s.distLabel}>{distText}</div>
          <div style={s.waypointLabel}>
            {waypointIdx} / {totalWaypoints} ポイント
          </div>
        </div>

        <button style={s.doneBtn} onClick={onComplete}>
          完了
        </button>
      </div>
    </div>
  )
}

const s = {
  panel: {
    position: 'absolute', bottom: 32, left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000, width: 300,
    background: 'rgba(10,10,15,0.93)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    fontFamily: "'Space Mono', monospace",
  },
  progressTrack: {
    height: 3, background: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%', background: 'linear-gradient(90deg, #ff3d00, #ff6d00)',
    transition: 'width .4s ease',
  },
  body: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
  },
  info: { flex: 1 },
  distLabel: {
    fontSize: 26, fontWeight: 700, color: '#f5f0e8', letterSpacing: '-1px',
    lineHeight: 1,
  },
  waypointLabel: {
    fontSize: 10, color: 'rgba(245,240,232,0.4)',
    marginTop: 4, letterSpacing: 0.5,
  },
  doneBtn: {
    padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent', color: 'rgba(245,240,232,0.6)',
    fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono', monospace",
    whiteSpace: 'nowrap',
  },
}
