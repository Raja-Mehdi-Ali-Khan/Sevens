import type { Card, CardId, Rank, Rng, Suit } from "./types";

const SUITS: Suit[] = ["H", "D", "C", "S"];

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({ suit, rank: (index + 1) as Rank })),
  );
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }

  return result;
}

export function cardId(card: Card): CardId {
  return `${card.rank}${card.suit}` as CardId;
}

export function parseCardId(id: string): Card | null {
  const match = /^(1[0-3]|[1-9])([HDCS])$/.exec(id);
  if (!match) return null;

  const rank = Number(match[1]) as Rank;
  const suit = match[2] as Suit;
  return { rank, suit };
}
