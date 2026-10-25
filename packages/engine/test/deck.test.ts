import { describe, expect, it } from "vitest";
import { cardId, createDeck, mulberry32, parseCardId, secureRng, shuffle } from "../src";
import { card } from "./helpers";

describe("deck helpers", () => {
  it("creates a deck of 52 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
  });

  it("round trips card identifiers and rejects invalid identifiers", () => {
    for (const id of ["1S", "7H", "13D"]) expect(cardId(card(id))).toBe(id);
    for (const id of ["0H", "14H", "01H", "7X", "7 H", "7h", "", "100H"]) {
      expect(parseCardId(id)).toBeNull();
    }
  });

  it("shuffles a copy deterministically with the injected RNG", () => {
    const deck = createDeck();
    const first = shuffle(deck, mulberry32(24));
    const second = shuffle(deck, mulberry32(24));
    expect(first).toEqual(second);
    expect(first).not.toBe(deck);
    expect(deck).toEqual(createDeck());
    expect(new Set(first.map(cardId)).size).toBe(52);
  });

  it("returns values from the crypto-backed RNG", () => {
    const value = secureRng()();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});
