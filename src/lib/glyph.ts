import type { Pt } from '../types';
import { simplify } from './simplify';

export const FONT_PX = 200;
const DP_TOLERANCE = 1.5;
const MIN_PERIMETER_PX = 12;

const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/**
 * 二値グリッド(幅w×高さh、1=塗り)から閉輪郭をマーチングスクエア法で全て抽出する。
 * 外周1ピクセルは空であること(呼び出し側で余白を保証する)。
 * 戻り値の各輪郭は閉ループ(始点と終点は一致しない。描画時に閉じる)。
 */
export function traceContours(grid: Uint8Array, w: number, h: number): Pt[][] {
  const cw = w - 1;
  const ch = h - 1;
  const at = (x: number, y: number) => grid[y * w + x];
  const cellCase = (cx: number, cy: number) =>
    (at(cx, cy) ? 8 : 0) | (at(cx + 1, cy) ? 4 : 0) | (at(cx + 1, cy + 1) ? 2 : 0) | (at(cx, cy + 1) ? 1 : 0);

  // セルごとに「使用済みの退出方向」をビットで記録(サドルは2回通過しうる)
  const visited = new Uint8Array(cw * ch);
  const contours: Pt[][] = [];

  // 退出方向テーブル(塗り領域を進行方向の左に保つ向き)。-1はサドル
  const EXIT = [-1, LEFT, DOWN, LEFT, RIGHT, -1, DOWN, LEFT, UP, UP, -1, UP, RIGHT, RIGHT, DOWN, -1];

  const exitDir = (c: number, prev: number): number => {
    if (c === 5) return prev === UP ? LEFT : RIGHT;
    if (c === 10) return prev === RIGHT ? UP : DOWN;
    return EXIT[c];
  };

  for (let sy = 0; sy < ch; sy++) {
    for (let sx = 0; sx < cw; sx++) {
      const c0 = cellCase(sx, sy);
      if (c0 === 0 || c0 === 15 || c0 === 5 || c0 === 10) continue; // サドルからは開始しない
      const d0 = EXIT[c0];
      if (visited[sy * cw + sx] & (1 << d0)) continue;

      const pts: Pt[] = [];
      let cx = sx;
      let cy = sy;
      let prev = d0;
      let first = true;
      for (;;) {
        const c = cellCase(cx, cy);
        const dir = exitDir(c, prev);
        if (!first && cx === sx && cy === sy && dir === d0) break;
        const bit = 1 << dir;
        if (!first && visited[cy * cw + cx] & bit && !(c === 5 || c === 10)) break; // 安全弁
        visited[cy * cw + cx] |= bit;
        pts.push({ x: cx + 0.5, y: cy + 0.5 });
        cx += DX[dir];
        cy += DY[dir];
        prev = dir;
        first = false;
        if (pts.length > cw * ch) break; // 理論上到達しない
      }
      if (pts.length >= 3) contours.push(pts);
    }
  }
  return contours;
}

function perimeter(pts: Pt[]): number {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return sum;
}

/**
 * テキストをCanvasに描画して輪郭ストローク群(px座標)を抽出する。
 * 戻り値: { strokes, width, height } widthとheightはラスタ全体のサイズ。
 */
export function textToStrokes(text: string): { strokes: Pt[][]; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const font = `bold ${FONT_PX}px sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const pad = 4;
  const width = Math.ceil(metrics.width) + pad * 2;
  const height = Math.ceil(FONT_PX * 1.4) + pad * 2;
  canvas.width = width;
  canvas.height = height;

  ctx.font = font; // canvasサイズ変更でリセットされるため再設定
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  ctx.fillText(text, pad, pad + FONT_PX * 0.1);

  const img = ctx.getImageData(0, 0, width, height).data;
  const grid = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    grid[i] = img[i * 4 + 3] >= 128 ? 1 : 0;
  }
  // 外周2pxを強制的に空にして閉輪郭を保証
  for (let x = 0; x < width; x++) {
    grid[x] = grid[width + x] = 0;
    grid[(height - 1) * width + x] = grid[(height - 2) * width + x] = 0;
  }
  for (let y = 0; y < height; y++) {
    grid[y * width] = grid[y * width + 1] = 0;
    grid[y * width + width - 1] = grid[y * width + width - 2] = 0;
  }

  const contours = traceContours(grid, width, height)
    .filter((c) => perimeter(c) >= MIN_PERIMETER_PX)
    .map((c) => simplify(c, DP_TOLERANCE));

  return { strokes: contours, width, height };
}
