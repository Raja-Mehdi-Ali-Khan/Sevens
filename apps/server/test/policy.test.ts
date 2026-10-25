import { describe, expect, it } from "vitest";
import type { Card } from "@cardgame/engine";
import { chooseCardForTimeoutOrBot } from "../src/policy";

describe("timeout and bot card policy", () => {
  it("chooses the highest rank and breaks ties in H, D, C, S order", () => {
    const options: Card[] = [
      { rank: 13, suit: "S" },
      { rank: 7, suit: "D" },
      { rank: 13, suit: "C" },
      { rank: 13, suit: "H" },
    ];
    expect(chooseCardForTimeoutOrBot(options)).toEqual({ rank: 13, suit: "H" });
  });

  it("does not accept an empty choice list", () => {
    expect(() => chooseCardForTimeoutOrBot([])).toThrow("empty card list");
  });
});
