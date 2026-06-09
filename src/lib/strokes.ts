import type { LatLng, Pt } from '../types';
import { offsetLatLng } from './geo';
import { FONT_PX } from './glyph';

/**
 * 閉ループ群の巡回順を貪欲法で決める。
 * 各ループは前のループ終点に最も近い頂点から始まるよう回転し、末尾に始点を複製して閉じる。
 */
export function orderLoops(loops: Pt[][]): Pt[][] {
  if (loops.length === 0) return [];
  const remaining = loops.slice();
  // 左端のループ(書き出し位置)から開始
  remaining.sort((a, b) => Math.min(...a.map((p) => p.x)) - Math.min(...b.map((p) => p.x)));
  const ordered: Pt[][] = [];
  let cursor = remaining[0][0];

  while (remaining.length > 0) {
    let bestLoop = 0;
    let bestVertex = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      for (let j = 0; j < remaining[i].length; j++) {
        const p = remaining[i][j];
        const d = (p.x - cursor.x) ** 2 + (p.y - cursor.y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          bestLoop = i;
          bestVertex = j;
        }
      }
    }
    const loop = remaining.splice(bestLoop, 1)[0];
    const rotated = loop.slice(bestVertex).concat(loop.slice(0, bestVertex));
    rotated.push(rotated[0]); // 閉じる
    ordered.push(rotated);
    cursor = rotated[rotated.length - 1];
  }
  return ordered;
}

/**
 * px座標のストローク群を、anchorを中心に文字高さsizeMeters[m]で実座標へ投影する。
 * rasterHeightPx はフォントの設計高さ(FONT_PX)に対する倍率計算に使う。
 */
export function placeStrokes(
  strokes: Pt[][],
  anchor: LatLng,
  sizeMeters: number,
  rasterWidth: number,
  rasterHeight: number,
): LatLng[][] {
  const metersPerPx = sizeMeters / FONT_PX;
  const cx = rasterWidth / 2;
  const cy = rasterHeight / 2;
  return strokes.map((stroke) =>
    stroke.map((p) =>
      // 画面のy下向き → 北は上なので反転
      offsetLatLng(anchor, (p.x - cx) * metersPerPx, -(p.y - cy) * metersPerPx),
    ),
  );
}

/** ポリラインを最大maxPoints点に間引く(始点・終点は保持) */
export function subsample<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) return points.slice();
  const out: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(points[Math.round((i * (points.length - 1)) / (maxPoints - 1))]);
  }
  return out;
}
