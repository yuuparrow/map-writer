import { describe, expect, it } from 'vitest';
import { traceContours } from './glyph';

/** 文字列パターンから二値グリッドを作る('#'=塗り) */
function gridOf(rows: string[]): { grid: Uint8Array; w: number; h: number } {
  const h = rows.length;
  const w = rows[0].length;
  const grid = new Uint8Array(w * h);
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) grid[y * w + x] = row[x] === '#' ? 1 : 0;
  });
  return { grid, w, h };
}

describe('traceContours (marching squares)', () => {
  it('finds 1 contour for a filled square', () => {
    const { grid, w, h } = gridOf([
      '........',
      '..####..',
      '..####..',
      '..####..',
      '..####..',
      '........',
    ]);
    expect(traceContours(grid, w, h)).toHaveLength(1);
  });

  it('finds 2 contours (outer + hole) for a ring like ロ', () => {
    const { grid, w, h } = gridOf([
      '..........',
      '.########.',
      '.########.',
      '.##....##.',
      '.##....##.',
      '.########.',
      '.########.',
      '..........',
    ]);
    expect(traceContours(grid, w, h)).toHaveLength(2);
  });

  it('finds 2 contours for two separate blobs like い', () => {
    const { grid, w, h } = gridOf([
      '..........',
      '.###..###.',
      '.###..###.',
      '.###..###.',
      '..........',
    ]);
    expect(traceContours(grid, w, h)).toHaveLength(2);
  });

  it('contour points stay near the shape boundary', () => {
    const { grid, w, h } = gridOf([
      '......',
      '.####.',
      '.####.',
      '......',
    ]);
    const [contour] = traceContours(grid, w, h);
    for (const p of contour) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(5.5);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(3.5);
    }
  });
});
