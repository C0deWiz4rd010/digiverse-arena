import { describe, expect, it } from 'vitest';
import { dayIndex, mulberry32, seededIndex } from './seed';

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seededIndex', () => {
  it('returns a stable index within range', () => {
    expect(seededIndex(123, 10)).toBe(seededIndex(123, 10));
    expect(seededIndex(123, 10)).toBeGreaterThanOrEqual(0);
    expect(seededIndex(123, 10)).toBeLessThan(10);
  });

  it('returns 0 for empty ranges', () => {
    expect(seededIndex(5, 0)).toBe(0);
  });
});

describe('dayIndex', () => {
  it('is constant within the same calendar day and differs across days', () => {
    const d1 = new Date(2026, 5, 21, 1);
    const d2 = new Date(2026, 5, 21, 23);
    const d3 = new Date(2026, 5, 22, 1);
    expect(dayIndex(d1)).toBe(dayIndex(d2));
    expect(dayIndex(d3)).toBe(dayIndex(d1) + 1);
  });
});
