import React, { useState, useEffect } from 'react'

const COLORS = ['#ff3d00', '#0066ff', '#00e676', '#ffea00', '#ff4081', '#ffffff']
const PRESETS = ['📍', '⭐', '❤️', '🔥', '✨', '📸']

export default function DrawingPanel({
  onStart, onStop, isRecording, onClear,
  onModeChange, onRouteConfirm, onRouteReset,
  routeWaypoints, routeLoading, routeError,
}) {
  const [mode, setMode] = useState('stamp')
  const [content, setContent] = useState('Hello!')
  const [color, setColor] = useState('#ff3d00')
  const [fontSize, setFontSize] = useState(24)

  useEffect(() => {
    onModeChange?.(mode)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const waypointCount = routeWaypoints?.length ?? 0

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.logo}>✍ MapWriter</span>
      </div>

      {/* Mode selector */}
      <div style={styles.modeRow}>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'stamp' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('stamp')}
        >
          📌 スタンプ
        </button>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'track' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('track')}
        >
          🚶 移動
        </button>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'route' ? styles.modeBtnRouteActive : {}) }}
          onClick={() => setMode('route')}
        >
          🗺️ ルート
        </button>
      </div>

      {/* Content input */}
      <div style={styles.section}>
        <label style={styles.label}>テキスト / 絵文字</label>
        <input
          style={styles.input}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="文字や絵文字を入力..."
          maxLength={20}
        />
        <div style={styles.presets}>
          {PRESETS.map(p => (
            <button key={p} style={styles.presetBtn} onClick={() => setContent(p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div style={styles.section}>
        <label style={styles.label}>カラー</label>
        <div style={styles.colorRow}>
          {COLORS.map(c => (
            <button
              key={c}
              style={{
                ...styles.colorDot,
                background: c,
                outline: color === c ? `2px solid white` : 'none',
                outlineOffset: '2px',
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Font size */}
      <div style={styles.section}>
        <label style={styles.label}>サイズ: {fontSize}px</label>
        <input
          type="range" min="12" max="72" value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))}
          style={styles.range}
        />
      </div>

      {/* Action buttons */}
      <div style={styles.actions}>
        {mode === 'stamp' && (
          <button
            style={styles.actionBtn}
            onClick={() => onStart({ mode, content, color, fontSize })}
          >
            📍 現在地に配置
          </button>
        )}

        {mode === 'track' && (
          isRecording ? (
            <button style={{ ...styles.actionBtn, ...styles.stopBtn }} onClick={onStop}>
              ⏹ 記録を停止
            </button>
          ) : (
            <button
              style={styles.actionBtn}
              onClick={() => onStart({ mode, content, color, fontSize })}
            >
              ▶ 移動開始
            </button>
          )
        )}

        {mode === 'route' && (
          <>
            <div style={styles.routeStatus}>
              {routeLoading ? (
                <><span style={styles.loadingDot} /> ルート取得中...</>
              ) : routeError ? (
                <span style={styles.routeErrorText}>⚠ {routeError}</span>
              ) : waypointCount === 0 ? (
                <span style={styles.hintText}>地図をタップしてルートを描く</span>
              ) : (
                <span>📍 ウェイポイント: {waypointCount} 個</span>
              )}
            </div>
            <button
              style={{
                ...styles.actionBtn,
                ...styles.routeConfirmBtn,
                ...(waypointCount < 2 || routeLoading ? styles.actionBtnDisabled : {}),
              }}
              disabled={waypointCount < 2 || routeLoading}
              onClick={() => onRouteConfirm?.({ content, color, fontSize })}
            >
              ✅ 確定
            </button>
            <button
              style={{
                ...styles.clearBtn,
                ...(waypointCount === 0 ? styles.actionBtnDisabled : {}),
              }}
              disabled={waypointCount === 0}
              onClick={onRouteReset}
            >
              🔄 リセット
            </button>
          </>
        )}

        <button style={styles.clearBtn} onClick={onClear}>
          🗑 全削除
        </button>
      </div>

      {isRecording && mode === 'track' && (
        <div style={styles.recording}>
          <span style={styles.recDot} />
          移動中… GPS追跡中
        </div>
      )}
    </div>
  )
}

const styles = {
  panel: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
    width: 280,
    background: 'rgba(10,10,15,0.93)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    fontFamily: "'Space Mono', monospace",
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 16, fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.5px' },
  modeRow: { display: 'flex', gap: 6 },
  modeBtn: {
    flex: 1, padding: '7px 2px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent', color: 'rgba(245,240,232,0.5)', fontSize: 10,
    cursor: 'pointer', transition: 'all .15s', fontFamily: "'Space Mono', monospace",
  },
  modeBtnActive: {
    background: 'rgba(255,61,0,0.2)', borderColor: '#ff3d00', color: '#ff3d00',
  },
  modeBtnRouteActive: {
    background: 'rgba(0,102,255,0.2)', borderColor: '#0066ff', color: '#0066ff',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 10, color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '8px 10px', color: '#f5f0e8', fontSize: 14,
    fontFamily: "'Space Mono', monospace", outline: 'none',
  },
  presets: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  presetBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, padding: '4px 8px', fontSize: 16, cursor: 'pointer',
    transition: 'background .15s',
  },
  colorRow: { display: 'flex', gap: 8, alignItems: 'center' },
  colorDot: {
    width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer',
    transition: 'transform .15s', flexShrink: 0,
  },
  range: { width: '100%', accentColor: '#ff3d00', cursor: 'pointer' },
  actions: { display: 'flex', flexDirection: 'column', gap: 6 },
  actionBtn: {
    padding: '10px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #ff3d00, #ff6d00)',
    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
    fontFamily: "'Space Mono', monospace", letterSpacing: 0.5,
    transition: 'transform .1s, opacity .1s',
  },
  stopBtn: { background: 'linear-gradient(135deg, #1a1a2e, #2a2a3e)', border: '1px solid #ff3d00', color: '#ff3d00' },
  routeConfirmBtn: { background: 'linear-gradient(135deg, #0044cc, #0066ff)' },
  clearBtn: {
    padding: '8px', borderRadius: 10,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(245,240,232,0.4)', fontSize: 12, cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
  },
  recording: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 11,
    color: '#ff3d00', padding: '6px 10px',
    background: 'rgba(255,61,0,0.08)', borderRadius: 8,
  },
  recDot: {
    width: 8, height: 8, borderRadius: '50%', background: '#ff3d00',
    animation: 'pulse 1s infinite',
    boxShadow: '0 0 6px #ff3d00',
    display: 'inline-block', flexShrink: 0,
  },
  routeStatus: {
    fontSize: 11, color: 'rgba(245,240,232,0.7)',
    padding: '6px 10px', background: 'rgba(0,102,255,0.1)',
    borderRadius: 8, border: '1px solid rgba(0,102,255,0.2)',
    display: 'flex', alignItems: 'center', gap: 6, minHeight: 32,
  },
  loadingDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#0066ff',
    animation: 'pulse 1s infinite',
    boxShadow: '0 0 6px #0066ff',
    display: 'inline-block', flexShrink: 0,
  },
  routeErrorText: { color: '#ff3d00', fontSize: 11 },
  hintText: { color: 'rgba(245,240,232,0.35)', fontSize: 11 },
  actionBtnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
}
