import type { Card } from "./types";

export function scoreHand(cards: Card[]): number {
  return cards.reduce((score, card) => score + card.rank, 0);
}
