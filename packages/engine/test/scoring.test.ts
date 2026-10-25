import { describe, expect, it } from "vitest";
import { scoreHand } from "../src";
import { card } from "./helpers";

describe("scoreHand", () => {
  it("scores ace low through king", () => {
    expect(scoreHand([card("13H"), card("1S")])).toBe(14);
    expect(scoreHand([card("12D")])).toBe(12);
    expect(scoreHand([])).toBe(0);
    expect(scoreHand([card("1H"), card("11C"), card("10S")])).toBe(22);
  });
});
