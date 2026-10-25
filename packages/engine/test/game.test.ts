import { describe, expect, it } from "vitest";
import {
  createGame,
  getLegalMoves,
  getTurnPlan,
  mulberry32,
  passTurn,
  playCard,
  scoreHand,
  startNextRound,
} from "../src";
import type { GameState, Seat } from "../src/types";
import { card, EMPTY_TABLE, stateWith } from "./helpers";

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(`Expected success, got ${result.error}`);
  return result.value;
}

function errorOf(result: ReturnType<typeof playCard> | ReturnType<typeof passTurn>): string {
  if (result.ok) throw new Error("Expected a failed result");
  return result.error;
}

describe("game setup", () => {
  it("deals 13 cards per seat and deterministically picks the 7H holder", () => {
    const first = createGame(mulberry32(123));
    const second = createGame(mulberry32(123));
    expect(first).toEqual(second);
    expect(first.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(first.hands[first.currentSeat]).toContainEqual(card("7H"));
    expect(first.phase).toBe("in_round");
    expect(first.round).toBe(1);
    expect(first.lowCardHints).toEqual([null, null, null, null]);
  });
});

describe("playCard", () => {
  it("checks phase, turn, hand membership, and legality in order", () => {
    const base = stateWith(EMPTY_TABLE, [[card("7H"), card("8H")], [card("7S")], [], []]);
    expect(errorOf(playCard({ ...base, phase: "round_over" }, 0, card("7H")))).toBe("WRONG_PHASE");
    expect(errorOf(playCard(base, 1, card("7S")))).toBe("NOT_YOUR_TURN");
    expect(errorOf(playCard(base, 0, card("6H")))).toBe("CARD_NOT_IN_HAND");
    expect(errorOf(playCard(base, 0, card("8H")))).toBe("ILLEGAL_CARD");
  });

  it("marks the first forced play automatic and returns immutable state and events", () => {
    const base = stateWith(EMPTY_TABLE, [[card("7H"), card("8H")], [], [], []]);
    const original = structuredClone(base);
    const result = unwrap(playCard(base, 0, card("7H")));
    expect(base).toEqual(original);
    expect(result.state.table.H).toEqual({ low: 7, high: 7 });
    expect(result.state.currentSeat).toBe(1);
    expect(result.state.lowCardHints).toEqual([1, null, null, null]);
    expect(result.events[0]).toEqual({ type: "card_played", seat: 0, card: card("7H"), auto: true });
  });

  it("marks chosen plays nonautomatic and ends immediately when a hand empties", () => {
    const table = { H: { low: 7 as const, high: 7 as const }, D: null, C: null, S: null };
    const choiceState = stateWith(table, [[card("6H"), card("8H")], [card("13H"), card("1S")], [], []]);
    const chosen = unwrap(playCard(choiceState, 0, card("6H")));
    expect(chosen.events[0]).toEqual({ type: "card_played", seat: 0, card: card("6H"), auto: false });
    expect(chosen.state.phase).toBe("in_round");

    const base: GameState = {
      ...stateWith(table, [[card("6H")], [card("13H"), card("1S")], [card("12D")], []]),
      lowCardHints: [1, 2, 0, 3],
    };
    const result = unwrap(playCard(base, 0, card("6H")));
    expect(result.events[0]).toEqual({ type: "card_played", seat: 0, card: card("6H"), auto: true });
    expect(result.state.phase).toBe("round_over");
    expect(result.state.lowCardHints).toEqual([null, null, null, null]);
    expect(result.state.roundWinner).toBe(0);
    expect(result.state.roundScores).toEqual([0, 14, 12, 0]);
    expect(result.state.totals).toEqual([0, 14, 12, 0]);
    expect(result.events.slice(1)).toEqual([
      { type: "round_won", seat: 0, roundScores: [0, 14, 12, 0], totals: [0, 14, 12, 0] },
    ]);
    expect(base.phase).toBe("in_round");
  });
});

describe("passTurn", () => {
  it("requires passing only on the current seat's turn and when no card is legal", () => {
    const state = stateWith(
      { H: { low: 7, high: 7 }, D: null, C: null, S: null },
      [[card("6H")], [card("9H")], [], []],
    );
    expect(errorOf(passTurn(state, 0))).toBe("MUST_PLAY");
    expect(errorOf(passTurn(state, 1))).toBe("CANNOT_PASS");
    expect(
      errorOf(
        passTurn(
          stateWith(state.table, [[card("9H")], [card("6H")], [], []]),
          1,
        ),
      ),
    ).toBe("MUST_PLAY");
    expect(errorOf(passTurn({ ...state, phase: "round_over" }, 0))).toBe("WRONG_PHASE");

    const passed = unwrap(passTurn(stateWith(state.table, [[card("9H")], [], [], []]), 0));
    expect(passed.state.currentSeat).toBe(1);
    expect(passed.events).toEqual([{ type: "passed", seat: 0 }]);
  });

  it("snapshots the acting seat's currently legal cards after its play", () => {
    const table = { H: { low: 7 as const, high: 7 as const }, D: null, C: null, S: null };
    const state = stateWith(
      table,
      [[], [card("6H"), card("8H"), card("13S"), card("2D")], [], []],
      1,
    );

    const result = unwrap(playCard(state, 1, card("6H")));
    expect(result.state.hands[1]).toEqual([card("8H"), card("13S"), card("2D")]);
    expect(result.state.lowCardHints).toEqual([null, 1, null, null]);
  });

  it("keeps a hint stale across other turns and recomputes it on that seat's next turn", () => {
    const table = {
      H: { low: 7 as const, high: 7 as const },
      D: { low: 7 as const, high: 7 as const },
      C: null,
      S: null,
    };
    const initial = stateWith(
      table,
      [[], [card("6H"), card("2D"), card("13S"), card("9D")], [card("8D"), card("3C")], []],
      1,
    );
    const afterHeart = unwrap(playCard(initial, 1, card("6H")));
    expect(afterHeart.state.lowCardHints[1]).toBe(0);

    const afterDiamond = unwrap(playCard(afterHeart.state, 2, card("8D")));
    expect(afterDiamond.state.lowCardHints[1]).toBe(0);
    const afterSeatThreePass = unwrap(passTurn(afterDiamond.state, 3));
    const afterSeatZeroPass = unwrap(passTurn(afterSeatThreePass.state, 0));
    expect(getTurnPlan(afterSeatZeroPass.state)).toEqual({ kind: "auto_play", card: card("9D") });

    const afterNextSeatOneTurn = unwrap(playCard(afterSeatZeroPass.state, 1, card("9D")));
    expect(afterNextSeatOneTurn.state.hands[1]).toEqual([card("2D"), card("13S")]);
    expect(afterNextSeatOneTurn.state.lowCardHints[1]).toBe(0);
  });

  it("clears only the acting seat's hint when four or more cards remain", () => {
    const table = { H: { low: 7 as const, high: 7 as const }, D: null, C: null, S: null };
    const state: GameState = {
      ...stateWith(table, [[card("7H")], [card("6H"), card("8H"), card("10S"), card("2D"), card("4C")], [], []], 1),
      lowCardHints: [2, 1, 3, null],
    };
    const result = unwrap(playCard(state, 1, card("6H")));
    expect(result.state.hands[1]).toHaveLength(4);
    expect(result.state.lowCardHints).toEqual([2, null, 3, null]);
  });

  it("records zero after a pass with two cards remaining", () => {
    const table = { H: { low: 7 as const, high: 7 as const }, D: null, C: null, S: null };
    const state = stateWith(table, [[card("5H"), card("9H")], [], [], []]);
    const result = unwrap(passTurn(state, 0));
    expect(result.state.hands[0]).toHaveLength(2);
    expect(result.state.lowCardHints[0]).toBe(0);
  });
});

describe("round transitions", () => {
  it("deals a fresh round and emits its starter", () => {
    const state: GameState = {
      ...createGame(mulberry32(4)),
      phase: "round_over",
      round: 3,
      lowCardHints: [1, 0, 2, 3],
      roundScores: [0, 1, 2, 3],
      roundWinner: 0,
    };
    const original = structuredClone(state);
    const result = unwrap(startNextRound(state, mulberry32(5)));
    expect(state).toEqual(original);
    expect(result.state.round).toBe(4);
    expect(result.state.phase).toBe("in_round");
    expect(result.state.lowCardHints).toEqual([null, null, null, null]);
    expect(result.state.roundScores).toBeNull();
    expect(result.state.roundWinner).toBeNull();
    expect(result.state.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(result.state.hands[result.state.currentSeat]).toContainEqual(card("7H"));
    expect(result.events).toEqual([{ type: "round_started", round: 4, starter: result.state.currentSeat }]);
    expect(startNextRound(createGame(mulberry32(2)), mulberry32(3))).toEqual({ ok: false, error: "WRONG_PHASE" });
  });

  it("ends round seven and includes all tied lowest totals", () => {
    const state = stateWith(
      { H: { low: 3, high: 7 }, D: null, C: null, S: null },
      [[card("2H")], [card("3C")], [card("4D")], [card("5S")]],
    );
    const finalRound: GameState = {
      ...state,
      round: 7,
      totals: [1000, 997, 1000, 1000],
      lowCardHints: [1, 0, 2, 3],
    };
    const result = unwrap(playCard(finalRound, 0, card("2H")));
    expect(result.state.phase).toBe("game_over");
    expect(result.state.lowCardHints).toEqual([null, null, null, null]);
    expect(result.state.roundScores).toEqual([0, 3, 4, 5]);
    expect(result.state.totals).toEqual([1000, 1000, 1004, 1005]);
    expect(result.state.winners).toEqual([0, 1]);
    expect(result.events.at(-1)).toEqual({
      type: "game_over",
      winners: [0, 1],
      totals: [1000, 1000, 1004, 1005],
    });
  });
});
