import { useEffect, useRef, useState } from 'react';
import { textToStrokes } from '../lib/glyph';
import { orderLoops } from '../lib/strokes';

/** ?debug=glyph で表示される輪郭抽出の確認ページ(開発用) */
export function GlyphDebug() {
  const [text, setText] = useState('こんにちは');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [info, setInfo] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || text === '') return;
    const { strokes, width, height } = textToStrokes(text);
    const ordered = orderLoops(strokes);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#10141c';
    ctx.fillRect(0, 0, width, height);
    const colors = ['#4da3ff', '#ff5a5a', '#5aff8a', '#ffd24d', '#c98aff', '#ff8ad1'];
    ordered.forEach((loop, i) => {
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      loop.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      // 始点マーカー
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(loop[0].x, loop[0].y, 4, 0, Math.PI * 2);
      ctx.fill();
      // ストローク間の移動(破線)
      if (i > 0) {
        const prev = ordered[i - 1];
        ctx.save();
        ctx.strokeStyle = '#666';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(prev[prev.length - 1].x, prev[prev.length - 1].y);
        ctx.lineTo(loop[0].x, loop[0].y);
        ctx.stroke();
        ctx.restore();
      }
    });
    const points = ordered.reduce((n, l) => n + l.length, 0);
    setInfo(`${ordered.length}ストローク / ${points}点`);
  }, [text]);

  return (
    <div style={{ padding: 16, background: '#10141c', minHeight: '100vh', color: '#fff' }}>
      <h2>輪郭抽出デバッグ</h2>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ fontSize: 18, padding: 8, width: '60%' }}
      />
      <p>{info}</p>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '1px solid #333' }} />
    </div>
  );
}
