import { createDeck, shuffle } from "./deck";
import { getLegalMoves, getTurnPlan } from "./rules";
import { scoreHand } from "./scoring";
import type { Card, GameEvent, GameState, Rank, Result, Rng, Seat, Suit, TableState } from "./types";

const SUITS: Suit[] = ["H", "D", "C", "S"];
const SEATS: Seat[] = [0, 1, 2, 3];
const SEVEN_OF_HEARTS: Card = { suit: "H", rank: 7 };

function findStarter(hands: Card[][]): Seat {
  return hands.findIndex((hand) =>
    hand.some((card) => card.suit === SEVEN_OF_HEARTS.suit && card.rank === SEVEN_OF_HEARTS.rank),
  ) as Seat;
}

function dealRound(rng: Rng): Pick<GameState, "hands" | "table" | "currentSeat"> {
  const deck = shuffle(createDeck(), rng);
  const hands = SEATS.map((seat) => deck.slice(seat * 13, (seat + 1) * 13));
  const table: TableState = { H: null, D: null, C: null, S: null };
  return { hands, table, currentSeat: findStarter(hands) };
}

export function createGame(rng: Rng): GameState {
  return {
    totalRounds: 7,
    round: 1,
    phase: "in_round",
    ...dealRound(rng),
    totals: [0, 0, 0, 0],
    roundScores: null,
    roundWinner: null,
    winners: null,
  };
}

function cardMatches(left: Card, right: Card): boolean {
  return left.suit === right.suit && left.rank === right.rank;
}

function updateTable(table: TableState, card: Card): TableState {
  const run = table[card.suit];
  let nextRun: { low: Rank; high: Rank };
  if (run === null) {
    nextRun = { low: 7, high: 7 };
  } else if (card.rank === run.low - 1) {
    nextRun = { low: card.rank, high: run.high };
  } else {
    nextRun = { low: run.low, high: card.rank };
  }
  return { ...table, [card.suit]: nextRun };
}

function finishRound(state: GameState, hands: Card[][], seat: Seat): { state: GameState; events: GameEvent[] } {
  const roundScores = hands.map((hand, index) => (index === seat ? 0 : scoreHand(hand)));
  const totals = state.totals.map((total, index) => total + roundScores[index]!);
  const gameOver = state.round === state.totalRounds;
  const lowestTotal = Math.min(...totals);
  const winners = gameOver
    ? (SEATS.filter((candidate) => totals[candidate] === lowestTotal) as Seat[])
    : null;
  const nextState: GameState = {
    ...state,
    hands,
    phase: gameOver ? "game_over" : "round_over",
    totals,
    roundScores,
    roundWinner: seat,
    winners,
  };
  const events: GameEvent[] = [
    { type: "round_won", seat, roundScores: [...roundScores], totals: [...totals] },
  ];
  if (winners !== null) events.push({ type: "game_over", winners: [...winners], totals: [...totals] });
  return { state: nextState, events };
}

export function playCard(state: GameState, seat: Seat, card: Card): Result<{ state: GameState; events: GameEvent[] }> {
  if (state.phase !== "in_round") return { ok: false, error: "WRONG_PHASE" };
  if (seat !== state.currentSeat) return { ok: false, error: "NOT_YOUR_TURN" };

  const hand = state.hands[seat]!;
  const cardIndex = hand.findIndex((heldCard) => cardMatches(heldCard, card));
  if (cardIndex === -1) return { ok: false, error: "CARD_NOT_IN_HAND" };

  const legalMoves = getLegalMoves(state, seat);
  if (!legalMoves.some((legalCard) => cardMatches(legalCard, card))) {
    return { ok: false, error: "ILLEGAL_CARD" };
  }

  const turnPlan = getTurnPlan(state);
  const auto = turnPlan.kind === "auto_play";
  const hands = state.hands.map((currentHand, index) =>
    index === seat ? currentHand.filter((_, cardPosition) => cardPosition !== cardIndex) : currentHand,
  );
  const table = updateTable(state.table, card);
  const events: GameEvent[] = [{ type: "card_played", seat, card: { ...card }, auto }];
  const nextState = { ...state, hands, table };

  if (hands[seat]!.length === 0) {
    const finished = finishRound(nextState, hands, seat);
    return { ok: true, value: { state: finished.state, events: [...events, ...finished.events] } };
  }

  return {
    ok: true,
    value: { state: { ...nextState, currentSeat: ((seat + 1) % 4) as Seat }, events },
  };
}

export function passTurn(state: GameState, seat: Seat): Result<{ state: GameState; events: GameEvent[] }> {
  if (state.phase !== "in_round") return { ok: false, error: "WRONG_PHASE" };
  if (getLegalMoves(state, seat).length > 0) return { ok: false, error: "MUST_PLAY" };
  if (seat !== state.currentSeat) return { ok: false, error: "CANNOT_PASS" };

  return {
    ok: true,
    value: {
      state: { ...state, currentSeat: ((seat + 1) % 4) as Seat },
      events: [{ type: "passed", seat }],
    },
  };
}

export function startNextRound(state: GameState, rng: Rng): Result<{ state: GameState; events: GameEvent[] }> {
  if (state.phase !== "round_over") return { ok: false, error: "WRONG_PHASE" };
  const round = state.round + 1;
  const deal = dealRound(rng);
  const nextState: GameState = {
    ...state,
    ...deal,
    round,
    phase: "in_round",
    roundScores: null,
    roundWinner: null,
    winners: null,
  };
  return {
    ok: true,
    value: {
      state: nextState,
      events: [{ type: "round_started", round, starter: deal.currentSeat }],
    },
  };
}
