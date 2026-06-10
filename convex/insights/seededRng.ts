/**
 * Deterministic seeded PRNG for insights pick rotation.
 *
 * Uses mulberry32 — a fast, high-quality 32-bit PRNG with a single 32-bit state.
 * Output is uniformly distributed in [0, 1).
 */

/**
 * Hash a string to a 32-bit unsigned integer (djb2-like).
 * Deterministic, no dependencies.
 */
export function hashStringToSeed(s: string): number {
  let h = 0x811c9dc5; // FNV-32 offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // 32-bit FNV prime multiply, kept in unsigned range
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return h >>> 0;
}

/**
 * mulberry32 PRNG seeded with the given 32-bit seed.
 * Returns a function that produces a new pseudo-random number in [0, 1)
 * on each call.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1) >>> 0;
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61) >>> 0;
    z = ((z ^ (z >>> 14)) >>> 0);
    return z / 0x100000000;
  };
}

/**
 * Build a RNG seeded by `dayKey` + `tokenIdentifier`.
 *
 * - Same day + same member → same sequence (stable for refresh-in-place).
 * - Different day → different sequence (natural rotation).
 * - Different members → different sequences on the same day.
 */
export function buildDaySeededRng(dayKey: string, tokenIdentifier: string): () => number {
  const seed = hashStringToSeed(`${dayKey}:${tokenIdentifier}`);
  return mulberry32(seed);
}
