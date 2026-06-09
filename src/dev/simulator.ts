import type { Fix, LatLng } from '../types';
import { haversine, offsetLatLng } from '../lib/geo';

/** ?sim=1 でGPSシミュレータを有効化(実機GPSの代わりに計画ルートを歩く) */
export const SIM_ENABLED =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('sim');

export const SIM_HOME: LatLng = { lat: 35.6812, lng: 139.7671 }; // 東京駅

type FixListener = (fix: Fix) => void;
const listeners = new Set<FixListener>();

let current: Fix = { ...SIM_HOME, accuracy: 5, timestamp: Date.now() };
let path: LatLng[] = [];
let distAlong = 0;
let speed = 1.4; // m/s 徒歩
let multiplier = 5;
let drift = false;
let timer: ReturnType<typeof setInterval> | null = null;

const TICK_MS = 500;

function gaussian(sigma: number): number {
  const u = Math.random() || 1e-9;
  const v = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sigma;
}

function emit(fix: Fix) {
  current = fix;
  listeners.forEach((fn) => fn(fix));
}

function positionAlong(line: LatLng[], dist: number): LatLng {
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    const seg = haversine(line[i - 1], line[i]);
    if (acc + seg >= dist && seg > 0) {
      const t = (dist - acc) / seg;
      return {
        lat: line[i - 1].lat + (line[i].lat - line[i - 1].lat) * t,
        lng: line[i - 1].lng + (line[i].lng - line[i - 1].lng) * t,
      };
    }
    acc += seg;
  }
  return line[line.length - 1];
}

function tick() {
  if (path.length < 2) return;
  // 逸脱中は経路上の進行を止める(脇に逸れて立ち止まるモデル)
  if (!drift) distAlong += speed * multiplier * (TICK_MS / 1000);
  const base = positionAlong(path, distAlong);
  const noisy = offsetLatLng(base, gaussian(3), gaussian(3) + (drift ? 80 : 0));
  emit({ ...noisy, accuracy: 8, timestamp: Date.now() });
}

export function simSubscribe(fn: FixListener): () => void {
  listeners.add(fn);
  fn(current); // 即座に現在位置を通知(初期配置用)
  return () => listeners.delete(fn);
}

export function simStart(route: LatLng[]): void {
  path = route;
  distAlong = 0;
  if (timer === null) timer = setInterval(tick, TICK_MS);
}

export function simPauseToggle(): boolean {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
    return false;
  }
  timer = setInterval(tick, TICK_MS);
  return true;
}

export function simSetMultiplier(x: number): void {
  multiplier = x;
}

export function simToggleDrift(): boolean {
  drift = !drift;
  return drift;
}
