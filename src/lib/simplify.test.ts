import { describe, expect, it } from 'vitest';
import { simplify } from './simplify';

describe('simplify (Douglas-Peucker)', () => {
  it('collapses collinear points', () => {
    const pts = [0, 1, 2, 3, 4].map((x) => ({ x, y: 0 }));
    expect(simplify(pts, 0.5)).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ]);
  });

  it('keeps significant corners', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
    ];
    expect(simplify(pts, 1)).toHaveLength(3);
  });

  it('drops deviations below tolerance', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 5, y: 0.5 },
      { x: 10, y: 0 },
    ];
    expect(simplify(pts, 1)).toHaveLength(2);
  });
});
