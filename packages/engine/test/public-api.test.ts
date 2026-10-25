import { describe, expect, it } from "vitest";
import { createDeck, parseCardId, scoreHand } from "@cardgame/engine";

describe("engine package entrypoint", () => {
  it("exposes the public API through the workspace package name", () => {
    expect(createDeck()).toHaveLength(52);
    expect(parseCardId("7H")).toEqual({ rank: 7, suit: "H" });
    expect(scoreHand([{ rank: 13, suit: "H" }])).toBe(13);
  });
});
