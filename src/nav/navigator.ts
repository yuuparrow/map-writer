import type { Fix, NavPoint } from '../types';
import { bearing, haversine, pointToSegment } from '../lib/geo';

const REACH_PEN_DOWN_M = 18;
const REACH_PEN_UP_M = 25;
const SKIP_LOOKAHEAD = 3;
const OFF_ROUTE_M = 35;
const OFF_ROUTE_SUSTAIN_MS = 10000;

export interface NavState {
  /** 次に向かう経由点のインデックス */
  idx: number;
  offSince: number | null;
  offRoute: boolean;
  done: boolean;
}

export interface NavStatus {
  distanceToTarget: number;
  bearingToTarget: number;
  /** 0..1 */
  progress: number;
  strokeIdx: number;
  strokeCount: number;
  /** 現在の区間がペンダウン(なぞり中)か */
  penDown: boolean;
}

export function initNav(): NavState {
  return { idx: 0, offSince: null, offRoute: false, done: false };
}

const reachThreshold = (p: NavPoint) => (p.penDown ? REACH_PEN_DOWN_M : REACH_PEN_UP_M);

/** GPS測位を1回反映した新しい状態を返す(純関数) */
export function stepNav(state: NavState, plan: NavPoint[], fix: Fix): NavState {
  if (state.done || plan.length === 0) return state;
  let idx = state.idx;

  // 到達判定 + 先読みスキップ(詰まり防止)
  for (;;) {
    let advanced = false;
    if (idx < plan.length && haversine(fix, plan[idx]) < reachThreshold(plan[idx])) {
      idx++;
      advanced = true;
    } else {
      const dCur = idx < plan.length ? haversine(fix, plan[idx]) : Infinity;
      for (let j = idx + 1; j <= Math.min(idx + SKIP_LOOKAHEAD, plan.length - 1); j++) {
        const d = haversine(fix, plan[j]);
        if (d < reachThreshold(plan[j]) && d < dCur) {
          idx = j + 1;
          advanced = true;
          break;
        }
      }
    }
    if (!advanced || idx >= plan.length) break;
  }

  if (idx >= plan.length) {
    return { idx: plan.length, offSince: null, offRoute: false, done: true };
  }

  // 逸脱検出: 現在の区間と少し先の区間への最短距離
  // (目標点をわずかに通り過ぎた位置を逸脱と誤判定しないため)
  let dist = haversine(fix, plan[idx]);
  for (let s = Math.max(1, idx); s <= Math.min(idx + SKIP_LOOKAHEAD, plan.length - 1); s++) {
    dist = Math.min(dist, pointToSegment(fix, plan[s - 1], plan[s]));
  }
  let offSince = state.offSince;
  let offRoute = state.offRoute;
  if (dist > OFF_ROUTE_M) {
    if (offSince === null) offSince = fix.timestamp;
    offRoute = fix.timestamp - offSince >= OFF_ROUTE_SUSTAIN_MS;
  } else {
    offSince = null;
    offRoute = false;
  }

  return { idx, offSince, offRoute, done: false };
}

/** 表示用ステータスを計算する */
export function navStatus(
  state: NavState,
  plan: NavPoint[],
  cumDist: number[],
  fix: Fix | null,
): NavStatus {
  const strokeCount = plan.length > 0 ? plan[plan.length - 1].strokeIdx + 1 : 0;
  const total = cumDist.length > 0 ? cumDist[cumDist.length - 1] : 0;
  if (state.done || state.idx >= plan.length) {
    return {
      distanceToTarget: 0,
      bearingToTarget: 0,
      progress: 1,
      strokeIdx: strokeCount - 1,
      strokeCount,
      penDown: false,
    };
  }
  const target = plan[state.idx];
  return {
    distanceToTarget: fix ? haversine(fix, target) : 0,
    bearingToTarget: fix ? bearing(fix, target) : 0,
    progress: total > 0 ? cumDist[state.idx] / total : 0,
    strokeIdx: target.strokeIdx,
    strokeCount,
    penDown: target.penDown,
  };
}

/** 経由点ごとの累積距離(進捗計算用に事前計算) */
export function cumulativeDistances(plan: NavPoint[]): number[] {
  const cum: number[] = [];
  let sum = 0;
  for (let i = 0; i < plan.length; i++) {
    if (i > 0) sum += haversine(plan[i - 1], plan[i]);
    cum.push(sum);
  }
  return cum;
}
