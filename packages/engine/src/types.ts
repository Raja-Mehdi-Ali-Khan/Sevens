export type Suit = "H" | "D" | "C" | "S";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type CardId = `${Rank}${Suit}`;

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type Seat = 0 | 1 | 2 | 3;
export type Rng = () => number;

export interface Run {
  low: Rank;
  high: Rank;
}

export type TableState = Record<Suit, Run | null>;
export type Phase = "in_round" | "round_over" | "game_over";

export interface GameState {
  totalRounds: 7;
  round: number;
  phase: Phase;
  hands: Card[][];
  lowCardHints: (number | null)[];
  table: TableState;
  currentSeat: Seat;
  totals: number[];
  roundScores: number[] | null;
  roundWinner: Seat | null;
  winners: Seat[] | null;
}

export type TurnPlan =
  | { kind: "auto_play"; card: Card }
  | { kind: "auto_pass" }
  | { kind: "await_choice"; options: Card[] };

export type GameEvent =
  | { type: "card_played"; seat: Seat; card: Card; auto: boolean }
  | { type: "passed"; seat: Seat }
  | { type: "round_won"; seat: Seat; roundScores: number[]; totals: number[] }
  | { type: "round_started"; round: number; starter: Seat }
  | { type: "game_over"; winners: Seat[]; totals: number[] };

export type EngineError =
  | "WRONG_PHASE"
  | "NOT_YOUR_TURN"
  | "CARD_NOT_IN_HAND"
  | "ILLEGAL_CARD"
  | "MUST_PLAY"
  | "CANNOT_PASS";

export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };

export interface PlayerView {
  seat: Seat;
  round: number;
  phase: Phase;
  currentSeat: Seat;
  hand: Card[];
  legalCards: CardId[];
  turnPlan: "auto_play" | "auto_pass" | "await_choice" | "waiting";
  table: TableState;
  handCounts: number[];
  playableCounts: (number | null)[];
  totals: number[];
  roundScores: number[] | null;
  roundWinner: Seat | null;
  winners: Seat[] | null;
}
