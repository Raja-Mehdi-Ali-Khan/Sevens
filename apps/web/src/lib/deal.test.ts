import { describe, expect, it } from "vitest";
import { shouldPlayDeal } from "./deal";

describe("shouldPlayDeal", () => {
  it("plays deal on initial mount when table is empty", () => {
    expect(shouldPlayDeal(null, 1, true)).toBe(true);
  });

  it("plays deal when round increases and table is empty", () => {
    expect(shouldPlayDeal(1, 2, true)).toBe(true);
    expect(shouldPlayDeal(6, 7, true)).toBe(true);
  });

  it("skips deal when table is not empty (e.g. reconnect mid-round)", () => {
    expect(shouldPlayDeal(null, 3, false)).toBe(false);
    expect(shouldPlayDeal(2, 3, false)).toBe(false);
  });

  it("skips deal when round did not change", () => {
    expect(shouldPlayDeal(1, 1, true)).toBe(false);
    expect(shouldPlayDeal(3, 2, true)).toBe(false);
  });
});
