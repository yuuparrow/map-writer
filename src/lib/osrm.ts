import type { LatLng } from '../types';

const BASE = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const REQUEST_GAP_MS = 300;
const TIMEOUT_MS = 12000;

let queue: Promise<unknown> = Promise.resolve();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function requestRoute(points: LatLng[]): Promise<LatLng[] | null> {
  const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const url = `${BASE}/${coords}?overview=full&geometries=geojson&steps=false`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes?.[0]?.geometry?.coordinates) return null;
    return (json.routes[0].geometry.coordinates as [number, number][]).map(([lng, lat]) => ({
      lat,
      lng,
    }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 徒歩ルートを取得する。OSRMデモサーバーへの負荷を抑えるため
 * 全呼び出しを直列化し300ms間隔を空ける。失敗時は1回だけリトライ。
 * 取得不能なら null。
 */
export function fetchFootRoute(points: LatLng[]): Promise<LatLng[] | null> {
  const task = queue.then(async () => {
    let result = await requestRoute(points);
    if (result === null) {
      await sleep(1000);
      result = await requestRoute(points);
    }
    await sleep(REQUEST_GAP_MS);
    return result;
  });
  queue = task.catch(() => undefined);
  return task;
}
