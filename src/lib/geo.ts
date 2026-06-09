import type { LatLng } from '../types';

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** 2点間の距離 [m] */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** aからbへの方位角 [deg, 0=北, 時計回り] */
export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** 点pから線分ab への最短距離 [m](局所平面近似) */
export function pointToSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const mPerLat = 111320;
  const mPerLng = 111320 * Math.cos(rad(p.lat));
  const ax = (a.lng - p.lng) * mPerLng;
  const ay = (a.lat - p.lat) * mPerLat;
  const bx = (b.lng - p.lng) * mPerLng;
  const by = (b.lat - p.lat) * mPerLat;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (-ax * dx - ay * dy) / len2));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.sqrt(cx * cx + cy * cy);
}

/** ポリラインの総延長 [m] */
export function pathLength(points: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += haversine(points[i - 1], points[i]);
  return sum;
}

/** 基準点から東/北方向にオフセット [m] した座標 */
export function offsetLatLng(origin: LatLng, eastM: number, northM: number): LatLng {
  const lat = origin.lat + northM / 111320;
  const lng = origin.lng + eastM / (111320 * Math.cos(rad(origin.lat)));
  return { lat, lng };
}
