import type { Card, GameState, Seat, Suit, TableState, TurnPlan } from "./types";

const SUITS: Suit[] = ["H", "D", "C", "S"];
const SEVEN_OF_HEARTS: Card = { suit: "H", rank: 7 };

export const LOW_CARD_HINT_THRESHOLD = 3;

function isEmptyTable(table: TableState): boolean {
  return SUITS.every((suit) => table[suit] === null);
}

function isLegalCard(table: TableState, card: Card): boolean {
  if (isEmptyTable(table)) {
    return card.suit === SEVEN_OF_HEARTS.suit && card.rank === SEVEN_OF_HEARTS.rank;
  }

  const run = table[card.suit];
  if (card.rank === 7 && run === null) return true;
  if (run === null) return false;
  return card.rank === run.low - 1 || card.rank === run.high + 1;
}

export function getLegalMoves(state: GameState, seat: Seat): Card[] {
  return state.hands[seat]!.filter((card) => isLegalCard(state.table, card));
}

export function getTurnPlan(state: GameState): TurnPlan {
  const options = getLegalMoves(state, state.currentSeat);
  if (options.length === 0) return { kind: "auto_pass" };
  if (options.length === 1) return { kind: "auto_play", card: options[0]! };
  return { kind: "await_choice", options };
}
