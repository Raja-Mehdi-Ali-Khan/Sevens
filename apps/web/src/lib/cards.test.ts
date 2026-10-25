import { describe, expect, it } from "vitest";
import type { Card } from "@cardgame/engine";
import { cardAltText, formatCard, formatCardId, formatRank, formatSuit, isRedSuit, sortHand } from "./cards";

describe("cards", () => {
  it("formats suit symbols and redness", () => {
    expect(formatSuit("H")).toBe("♥");
    expect(formatSuit("D")).toBe("♦");
    expect(formatSuit("C")).toBe("♣");
    expect(formatSuit("S")).toBe("♠");

    expect(isRedSuit("H")).toBe(true);
    expect(isRedSuit("D")).toBe(true);
    expect(isRedSuit("C")).toBe(false);
    expect(isRedSuit("S")).toBe(false);
  });

  it("formats ranks correctly", () => {
    expect(formatRank(1)).toBe("A");
    expect(formatRank(2)).toBe("2");
    expect(formatRank(7)).toBe("7");
    expect(formatRank(10)).toBe("10");
    expect(formatRank(11)).toBe("J");
    expect(formatRank(12)).toBe("Q");
    expect(formatRank(13)).toBe("K");
  });

  it("formats card and cardId correctly", () => {
    expect(formatCard({ suit: "H", rank: 7 })).toBe("7♥");
    expect(formatCard({ suit: "S", rank: 1 })).toBe("A♠");
    expect(formatCard({ suit: "D", rank: 13 })).toBe("K♦");
    expect(formatCardId("7H")).toBe("7♥");
    expect(formatCardId("1S")).toBe("A♠");
    expect(formatCardId("12C")).toBe("Q♣");
  });

  it("provides human-readable cardAltText for accessibility and labels", () => {
    expect(cardAltText("7H")).toBe("7 of hearts");
    expect(cardAltText("1S")).toBe("Ace of spades");
    expect(cardAltText("11C")).toBe("Jack of clubs");
    expect(cardAltText("12D")).toBe("Queen of diamonds");
    expect(cardAltText("13H")).toBe("King of hearts");
    expect(cardAltText("back")).toBe("Card back");
  });

  it("purely sorts hand by suit then rank without mutating input", () => {
    const unsorted: Card[] = [
      { suit: "S", rank: 1 },
      { suit: "H", rank: 13 },
      { suit: "D", rank: 2 },
      { suit: "C", rank: 7 },
      { suit: "H", rank: 7 },
      { suit: "D", rank: 10 },
      { suit: "S", rank: 13 },
      { suit: "C", rank: 3 },
    ];
    const snapshot = JSON.stringify(unsorted);

    const sorted = sortHand(unsorted);

    // Assert input was not mutated
    expect(JSON.stringify(unsorted)).toBe(snapshot);
    expect(sorted).not.toBe(unsorted);

    // Suits order: H, D, C, S
    // Within suits: rank ascending
    expect(sorted).toEqual([
      { suit: "H", rank: 7 },
      { suit: "H", rank: 13 },
      { suit: "D", rank: 2 },
      { suit: "D", rank: 10 },
      { suit: "C", rank: 3 },
      { suit: "C", rank: 7 },
      { suit: "S", rank: 1 },
      { suit: "S", rank: 13 },
    ]);
  });
});
