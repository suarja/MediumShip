import { describe, expect, it } from "vitest";

import { buildDaySeededRng, hashStringToSeed, mulberry32 } from "./seededRng";

describe("hashStringToSeed", () => {
  it("returns a non-negative 32-bit integer", () => {
    const seed = hashStringToSeed("2026-06-10:token_member");
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
    expect(Number.isInteger(seed)).toBe(true);
  });

  it("is deterministic for the same input", () => {
    const key = "2026-06-10:token_member";
    expect(hashStringToSeed(key)).toBe(hashStringToSeed(key));
  });

  it("produces different seeds for different inputs", () => {
    const a = hashStringToSeed("2026-06-10:token_member");
    const b = hashStringToSeed("2026-06-11:token_member");
    const c = hashStringToSeed("2026-06-10:token_other");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });
});

describe("mulberry32", () => {
  it("returns values in [0, 1)", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic from the same seed", () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("produces different sequences from different seeds", () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe("buildDaySeededRng", () => {
  it("is stable within the same day and member", () => {
    const rng1 = buildDaySeededRng("2026-06-10", "token_member");
    const rng2 = buildDaySeededRng("2026-06-10", "token_member");
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("varies across days for the same member", () => {
    const rng1 = buildDaySeededRng("2026-06-10", "token_member");
    const rng2 = buildDaySeededRng("2026-06-11", "token_member");
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it("varies across members on the same day", () => {
    const rng1 = buildDaySeededRng("2026-06-10", "token_member_1");
    const rng2 = buildDaySeededRng("2026-06-10", "token_member_2");
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});
