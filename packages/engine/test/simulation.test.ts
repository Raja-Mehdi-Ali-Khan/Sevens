import { describe, expect, it } from "vitest";
import {
  cardId,
  createGame,
  getLegalMoves,
  getPlayerView,
  getTurnPlan,
  mulberry32,
  passTurn,
  playCard,
  startNextRound,
} from "../src";
import type { Card, GameState, Seat, Suit } from "../src/types";

const SUITS: Suit[] = ["H", "D", "C", "S"];
const SEATS: Seat[] = [0, 1, 2, 3];

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectCardConservation(state: GameState): void {
  const cardsInHands = state.hands.flat();
  const cardsOnTable: Card[] = [];
  for (const suit of SUITS) {
    const run = state.table[suit];
    if (run !== null) {
      for (let rank = run.low; rank <= run.high; rank += 1) {
        cardsOnTable.push({ suit, rank: rank as Card["rank"] });
      }
    }
  }
  const allCards = [...cardsInHands, ...cardsOnTable].map(cardId);
  invariant(allCards.length === 52, `Expected 52 cards, got ${allCards.length}`);
  invariant(new Set(allCards).size === 52, "Expected 52 unique cards");
}

function expectViewsHideOtherHands(state: GameState): void {
  const owners = new Map(state.hands.flatMap((hand, seat) => hand.map((card) => [cardId(card), seat] as const)));
  for (const seat of SEATS) {
    const view = getPlayerView(state, seat);
    for (const card of view.hand) {
      invariant(owners.get(cardId(card)) === seat, `Seat ${seat} view contains another seat's card`);
    }
    invariant(
      view.hand.length === state.hands[seat]!.length &&
        view.hand.every((card, index) => cardId(card) === cardId(state.hands[seat]![index]!)),
      `Seat ${seat} view does not match its hand`,
    );
  }
}

function expectInvariants(state: GameState): void {
  expectCardConservation(state);
  invariant(state.hands.length === 4, "Expected four hands");
  for (const hand of state.hands) invariant(hand.length >= 0 && hand.length <= 13, "Invalid hand size");
  expectViewsHideOtherHands(state);
  if (state.phase === "in_round") {
    invariant(SEATS.some((seat) => getLegalMoves(state, seat).length > 0), "Round reached a deadlock");
  }
}

describe("seeded full-game simulations", () => {
  it("preserves all rules and invariants across 500 deterministic games", () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      let state = createGame(mulberry32(seed));
      const choose = mulberry32(seed + 100_000);
      let roundsCompleted = 0;
      let expectedTotals = [0, 0, 0, 0];
      let steps = 0;

      expect(state.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
      expectInvariants(state);

      while (state.phase !== "game_over") {
        steps += 1;
        expect(steps).toBeLessThan(5000);

        if (state.phase === "round_over") {
          expect(state.roundScores).not.toBeNull();
          expect(state.roundWinner).not.toBeNull();
          const emptySeats = SEATS.filter((seat) => state.hands[seat]!.length === 0);
          expect(emptySeats).toEqual([state.roundWinner]);
          expect(state.roundScores![state.roundWinner!]).toBe(0);
          expectedTotals = expectedTotals.map((total, seat) => total + state.roundScores![seat]!);
          expect(state.totals).toEqual(expectedTotals);
          roundsCompleted += 1;
          expectInvariants(state);

          if (state.round === 7) break;
          const next = startNextRound(state, mulberry32(seed * 100 + state.round));
          expect(next.ok).toBe(true);
          if (!next.ok) throw new Error(next.error);
          state = next.value.state;
          expect(state.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
          expect(state.hands[state.currentSeat]).toContainEqual({ suit: "H", rank: 7 });
          expectInvariants(state);
          continue;
        }

        const seat = state.currentSeat;
        const plan = getTurnPlan(state);
        if (plan.kind === "auto_pass") {
          const result = passTurn(state, seat);
          expect(result.ok).toBe(true);
          if (!result.ok) throw new Error(result.error);
          state = result.value.state;
        } else {
          const card = plan.kind === "auto_play"
            ? plan.card
            : plan.options[Math.floor(choose() * plan.options.length)]!;
          const result = playCard(state, seat, card);
          expect(result.ok).toBe(true);
          if (!result.ok) throw new Error(result.error);
          state = result.value.state;
        }
        expectInvariants(state);
      }

      expect(state.phase).toBe("game_over");
      const finalEmptySeats = SEATS.filter((seat) => state.hands[seat]!.length === 0);
      expect(finalEmptySeats).toEqual([state.roundWinner]);
      expect(state.roundScores![state.roundWinner!]).toBe(0);
      expectedTotals = expectedTotals.map((total, seat) => total + state.roundScores![seat]!);
      expect(state.totals).toEqual(expectedTotals);
      roundsCompleted += 1;
      expect(roundsCompleted).toBe(7);
      expect(state.round).toBe(7);
      expect(state.totals).toEqual(expectedTotals);
      expect(state.winners).not.toBeNull();
      expect(state.winners).toEqual(SEATS.filter((seat) => state.totals[seat] === Math.min(...state.totals)));
      expectInvariants(state);
    }
  }, 120_000);
});
