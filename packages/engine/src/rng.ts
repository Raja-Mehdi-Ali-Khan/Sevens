import type { Rng } from "./types";

export function mulberry32(seed: number): Rng {
  let state = seed;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function secureRng(): Rng {
  return () => {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return (value[0] ?? 0) / 4294967296;
  };
}
