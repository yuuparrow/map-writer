import type { LatLng, NavPoint, RoutePlan } from '../types';
import { haversine, pathLength, pointToSegment } from './geo';
import { textToStrokes } from './glyph';
import { fetchFootRoute } from './osrm';
import { orderLoops, placeStrokes, subsample } from './strokes';

const MAX_OSRM_WAYPOINTS = 25;

/** 文字列から幾何的な理想ストローク(緯度経度)を同期生成する */
export function buildIdealStrokes(text: string, anchor: LatLng, sizeMeters: number): LatLng[][] {
  const { strokes, width, height } = textToStrokes(text);
  return placeStrokes(orderLoops(strokes), anchor, sizeMeters, width, height);
}

function minDistToPolyline(p: LatLng, line: LatLng[]): number {
  let min = Infinity;
  for (let i = 1; i < line.length; i++) {
    min = Math.min(min, pointToSegment(p, line[i - 1], line[i]));
  }
  return min;
}

function flatten(snapped: LatLng[][]): NavPoint[] {
  const navPoints: NavPoint[] = [];
  snapped.forEach((stroke, strokeIdx) => {
    stroke.forEach((p, i) => {
      const prev = navPoints[navPoints.length - 1];
      if (prev && haversine(prev, p) < 3) return; // 近接重複を除去
      // 各ストロークの先頭点へ向かう区間はペンアップ(ストローク間移動)
      navPoints.push({ ...p, penDown: i > 0, strokeIdx });
    });
  });
  return navPoints;
}

/**
 * 理想ストロークをOSRMで道路スナップしてナビ可能なRoutePlanを構築する。
 * ストローク単位で失敗したものは幾何形状のままフォールバックする。
 */
export async function buildPlan(
  text: string,
  anchor: LatLng,
  sizeMeters: number,
  ideal: LatLng[][],
  onProgress?: (done: number, total: number) => void,
): Promise<RoutePlan> {
  const snapped: LatLng[][] = [];
  const snapOk: boolean[] = [];

  for (let i = 0; i < ideal.length; i++) {
    const waypoints = subsample(ideal[i], MAX_OSRM_WAYPOINTS);
    const route = await fetchFootRoute(waypoints);
    snapped.push(route ?? ideal[i]);
    snapOk.push(route !== null);
    onProgress?.(i + 1, ideal.length);
  }

  const navPoints = flatten(snapped);
  const totalMeters = pathLength(navPoints);

  // 形状再現度: 理想点からスナップ済み同ストロークへの平均距離
  let devSum = 0;
  let devN = 0;
  ideal.forEach((stroke, i) => {
    if (!snapOk[i]) return;
    for (const p of stroke) {
      devSum += minDistToPolyline(p, snapped[i]);
      devN++;
    }
  });

  return {
    text,
    anchor,
    sizeMeters,
    ideal,
    snapped,
    snapOk,
    navPoints,
    totalMeters,
    deviationMeters: devN > 0 ? devSum / devN : 0,
  };
}
