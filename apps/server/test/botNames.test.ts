import { describe, expect, it } from "vitest";
import { mulberry32 } from "@cardgame/engine";
import { BOT_NAME_POOL, pickBotNames } from "../src/botNames";

describe("pickBotNames", () => {
  it("returns the requested count of unique names for 1 to 3 bots", () => {
    for (const count of [0, 1, 2, 3]) {
      const names = pickBotNames(count, ["Alice"], mulberry32(42));
      expect(names).toHaveLength(count);
      expect(new Set(names).size).toBe(count);
      for (const name of names) {
        expect(BOT_NAME_POOL).toContain(name);
      }
    }
  });

  it("never picks a name equal to any taken name (case-insensitive)", () => {
    const taken = ["aarav", "VIVAAN", "Ananya", "  diya  ", "MIA", "leo", "noah"];
    const names = pickBotNames(3, taken, mulberry32(123));
    const takenLower = new Set(taken.map((n) => n.trim().toLowerCase()));
    for (const name of names) {
      expect(takenLower.has(name.toLowerCase())).toBe(false);
    }
  });

  it("is deterministic for a given seed", () => {
    const first = pickBotNames(3, ["Alice", "Bob"], mulberry32(999));
    const second = pickBotNames(3, ["Alice", "Bob"], mulberry32(999));
    expect(first).toEqual(second);
  });
});
