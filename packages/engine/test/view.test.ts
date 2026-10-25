import { describe, expect, it } from "vitest";
import { getPlayerView, mulberry32, createGame, cardId } from "../src";
import { card, EMPTY_TABLE, stateWith } from "./helpers";

describe("getPlayerView", () => {
  it("includes only the requested seat's hand and current-turn legal cards", () => {
    const state = stateWith(EMPTY_TABLE, [[card("7H"), card("8H")], [card("1S")], [], []]);
    const current = getPlayerView(state, 0);
    const waiting = getPlayerView(state, 1);
    expect(current.hand).toEqual([card("7H"), card("8H")]);
    expect(current.legalCards).toEqual(["7H"]);
    expect(current.turnPlan).toBe("auto_play");
    expect(waiting.hand).toEqual([card("1S")]);
    expect(waiting.legalCards).toEqual([]);
    expect(waiting.turnPlan).toBe("waiting");
    expect(current.handCounts).toEqual([2, 1, 0, 0]);
  });

  it("returns waiting with no legal cards after a round ends", () => {
    const state = { ...createGame(mulberry32(4)), phase: "round_over" as const };
    const view = getPlayerView(state, state.currentSeat);
    expect(view.turnPlan).toBe("waiting");
    expect(view.legalCards).toEqual([]);
  });

  it("copies nested state so callers cannot mutate engine state", () => {
    const state = stateWith({ H: { low: 7, high: 7 }, D: null, C: null, S: null }, [[card("6H")], [], [], []]);
    const view = getPlayerView(state, 0);
    view.hand[0]!.rank = 13;
    view.table.H!.low = 1;
    view.totals[0] = 100;
    expect(state.hands[0]![0]).toEqual(card("6H"));
    expect(state.table.H).toEqual({ low: 7, high: 7 });
    expect(state.totals[0]).toBe(0);
    expect(cardId(view.hand[0]!)).toBe("13H");
  });
});
