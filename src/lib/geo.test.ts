import { describe, expect, it } from 'vitest';
import { bearing, haversine, offsetLatLng, pathLength, pointToSegment } from './geo';

const tokyo = { lat: 35.6812, lng: 139.7671 };

describe('haversine', () => {
  it('returns ~403km between Tokyo and Osaka stations', () => {
    const osaka = { lat: 34.7025, lng: 135.4959 };
    expect(haversine(tokyo, osaka)).toBeGreaterThan(390000);
    expect(haversine(tokyo, osaka)).toBeLessThan(410000);
  });

  it('returns 0 for the same point', () => {
    expect(haversine(tokyo, tokyo)).toBe(0);
  });
});

describe('bearing', () => {
  it('points north toward higher latitude', () => {
    expect(bearing(tokyo, { lat: 36, lng: tokyo.lng })).toBeCloseTo(0, 0);
  });

  it('points east toward higher longitude', () => {
    expect(bearing(tokyo, { lat: tokyo.lat, lng: 140 })).toBeCloseTo(90, 0);
  });
});

describe('offsetLatLng + haversine roundtrip', () => {
  it('100m east offset is ~100m away', () => {
    const p = offsetLatLng(tokyo, 100, 0);
    expect(haversine(tokyo, p)).toBeCloseTo(100, 0);
  });

  it('100m north offset is ~100m away', () => {
    const p = offsetLatLng(tokyo, 0, 100);
    expect(haversine(tokyo, p)).toBeCloseTo(100, 0);
  });
});

describe('pointToSegment', () => {
  it('measures perpendicular distance to a segment', () => {
    const a = offsetLatLng(tokyo, -100, 0);
    const b = offsetLatLng(tokyo, 100, 0);
    const p = offsetLatLng(tokyo, 0, 50);
    expect(pointToSegment(p, a, b)).toBeCloseTo(50, 0);
  });

  it('clamps to endpoints', () => {
    const a = offsetLatLng(tokyo, -100, 0);
    const b = offsetLatLng(tokyo, 100, 0);
    const p = offsetLatLng(tokyo, 200, 0);
    expect(pointToSegment(p, a, b)).toBeCloseTo(100, 0);
  });
});

describe('pathLength', () => {
  it('sums segment lengths', () => {
    const pts = [tokyo, offsetLatLng(tokyo, 100, 0), offsetLatLng(tokyo, 100, 100)];
    expect(pathLength(pts)).toBeCloseTo(200, 0);
  });
});
