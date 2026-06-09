import { describe, expect, it } from 'vitest';
import type { Fix, NavPoint } from '../types';
import { offsetLatLng } from '../lib/geo';
import { cumulativeDistances, initNav, navStatus, stepNav } from './navigator';

const origin = { lat: 35.6812, lng: 139.7671 };
const fix = (eastM: number, northM: number, t = 0): Fix => ({
  ...offsetLatLng(origin, eastM, northM),
  accuracy: 5,
  timestamp: t,
});

/** 東向きに100m間隔で並ぶ5点のプラン */
function linePlan(): NavPoint[] {
  return [0, 100, 200, 300, 400].map((east, i) => ({
    ...offsetLatLng(origin, east, 0),
    penDown: i > 0,
    strokeIdx: 0,
  }));
}

describe('stepNav', () => {
  it('advances when within reach threshold', () => {
    const plan = linePlan();
    const s = stepNav(initNav(), plan, fix(10, 0));
    expect(s.idx).toBe(1); // 先頭点(ペンアップ25m)に到達済み
  });

  it('does not advance when far away', () => {
    const plan = linePlan();
    const s = stepNav(initNav(), plan, fix(-100, 0));
    expect(s.idx).toBe(0);
  });

  it('skips ahead when nearer to a later waypoint', () => {
    const plan = linePlan();
    let s = stepNav(initNav(), plan, fix(10, 0)); // idx=1
    s = stepNav(s, plan, fix(210, 5)); // 200m地点(idx=2)を通過しidx=3へ
    expect(s.idx).toBe(3);
  });

  it('completes when reaching the last waypoint', () => {
    const plan = linePlan();
    let s = initNav();
    for (const east of [0, 100, 200, 300, 400]) {
      s = stepNav(s, plan, fix(east, 0));
    }
    expect(s.done).toBe(true);
  });

  it('flags off-route only after sustained deviation', () => {
    const plan = linePlan();
    let s = stepNav(initNav(), plan, fix(10, 0));
    s = stepNav(s, plan, fix(50, 100, 1000)); // 100m横にずれる
    expect(s.offRoute).toBe(false); // まだ10秒未満
    s = stepNav(s, plan, fix(50, 100, 12000));
    expect(s.offRoute).toBe(true);
    s = stepNav(s, plan, fix(150, 5, 13000)); // ルートに復帰
    expect(s.offRoute).toBe(false);
  });
});

describe('navStatus', () => {
  it('reports distance, bearing and progress', () => {
    const plan = linePlan();
    const cum = cumulativeDistances(plan);
    const s = stepNav(initNav(), plan, fix(10, 0)); // idx=1
    const st = navStatus(s, plan, cum, fix(10, 0));
    expect(st.distanceToTarget).toBeCloseTo(90, -1);
    expect(st.bearingToTarget).toBeCloseTo(90, 0);
    expect(st.progress).toBeCloseTo(0.25, 1);
    expect(st.penDown).toBe(true);
  });

  it('reports 100% when done', () => {
    const plan = linePlan();
    const cum = cumulativeDistances(plan);
    const st = navStatus({ idx: 5, offSince: null, offRoute: false, done: true }, plan, cum, null);
    expect(st.progress).toBe(1);
  });
});
