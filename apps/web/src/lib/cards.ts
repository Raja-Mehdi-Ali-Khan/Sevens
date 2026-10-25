import type { Card, CardId, Rank, Suit } from "@cardgame/engine";

export const SUITS: readonly Suit[] = ["H", "D", "C", "S"] as const;
export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

export const SUIT_SYMBOLS: Record<Suit, string> = {
  H: "♥",
  D: "♦",
  C: "♣",
  S: "♠",
};

export const SUIT_NAMES: Record<Suit, string> = {
  H: "Hearts",
  D: "Diamonds",
  C: "Clubs",
  S: "Spades",
};

const SUIT_ORDER: Record<Suit, number> = {
  H: 0,
  D: 1,
  C: 2,
  S: 3,
};

export function isRedSuit(suit: Suit): boolean {
  return suit === "H" || suit === "D";
}

export function formatRank(rank: Rank): string {
  switch (rank) {
    case 1:
      return "A";
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    default:
      return String(rank);
  }
}

export function formatSuit(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function formatCard(card: Card): string {
  return `${formatRank(card.rank)}${formatSuit(card.suit)}`;
}

export function parseCardIdToCard(id: CardId): Card {
  const suit = id.slice(-1) as Suit;
  const rank = Number(id.slice(0, -1)) as Rank;
  return { suit, rank };
}

export function formatCardId(id: CardId): string {
  return formatCard(parseCardIdToCard(id));
}

/**
 * Pure function: sorts a hand by suit (Hearts, Diamonds, Clubs, Spades) then by rank (1 to 13).
 * Never mutates the input array.
 */
export function sortHand(hand: readonly Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return a.rank - b.rank;
  });
}
