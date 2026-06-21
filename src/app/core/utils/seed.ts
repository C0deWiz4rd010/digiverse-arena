/** Deterministic PRNG utilities. Used for daily picks and reproducible game stats. */

/** Mulberry32 — a fast, deterministic 32-bit PRNG. Returns a function yielding [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable integer that changes once per local calendar day. */
export function dayIndex(date: Date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Deterministic integer in [0, count) derived from a seed. */
export function seededIndex(seed: number, count: number): number {
  if (count <= 0) return 0;
  return Math.floor(mulberry32(seed)() * count);
}
