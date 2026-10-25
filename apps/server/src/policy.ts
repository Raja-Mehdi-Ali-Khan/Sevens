import type { Card, Suit } from "@cardgame/engine";

const SUIT_ORDER: Suit[] = ["H", "D", "C", "S"];

export function chooseCardForTimeoutOrBot(options: Card[]): Card {
  if (options.length === 0) throw new Error("Cannot choose from an empty card list");

  return options.reduce((chosen, candidate) => {
    if (candidate.rank > chosen.rank) return candidate;
    if (candidate.rank < chosen.rank) return chosen;
    return SUIT_ORDER.indexOf(candidate.suit) < SUIT_ORDER.indexOf(chosen.suit) ? candidate : chosen;
  });
}
