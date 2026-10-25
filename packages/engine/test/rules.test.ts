import { describe, expect, it } from "vitest";
import { getLegalMoves, getTurnPlan } from "../src";
import { card, EMPTY_TABLE, stateWith } from "./helpers";
import type { Card, TableState } from "../src/types";

const ids = (cards: Card[]) => cards.map(({ rank, suit }) => `${rank}${suit}`).sort();

describe("legal moves", () => {
  it("allows only 7H on the empty table for its holder", () => {
    const state = stateWith(EMPTY_TABLE, [[card("7H"), card("8H")], [card("7S")], [], []]);
    expect(ids(getLegalMoves(state, 0))).toEqual(["7H"]);
    expect(getLegalMoves(state, 1)).toEqual([]);
    expect(getTurnPlan(state)).toEqual({ kind: "auto_play", card: card("7H") });
  });

  it("matches the documented open and unopened suit vector", () => {
    const table: TableState = { H: { low: 7, high: 7 }, D: null, C: null, S: null };
    const state = stateWith(table, [[card("6H"), card("8H"), card("7S"), card("9D"), card("5H")], [], [], []]);
    expect(ids(getLegalMoves(state, 0))).toEqual(["6H", "7S", "8H"]);
  });

  it("allows the adjacent low and high cards without rank wrapping", () => {
    const table: TableState = { H: null, D: { low: 2, high: 9 }, C: null, S: { low: 1, high: 13 } };
    const state = stateWith(table, [[card("1D"), card("10D"), card("13D"), card("1S")], [], [], []]);
    expect(ids(getLegalMoves(state, 0))).toEqual(["10D", "1D"]);
    const closedSpades = stateWith(
      { H: null, D: null, C: null, S: { low: 1, high: 13 } },
      [[card("2S"), card("12S")], [], [], []],
    );
    expect(getLegalMoves(closedSpades, 0)).toEqual([]);
  });
});

describe("turn plans", () => {
  it("reports auto-play, auto-pass, and await-choice by legal option count", () => {
    const one = stateWith({ H: { low: 7, high: 7 }, D: null, C: null, S: null }, [[card("6H")], [], [], []]);
    const none = stateWith({ H: { low: 7, high: 7 }, D: null, C: null, S: null }, [[card("9H")], [], [], []]);
    const three = stateWith({ H: { low: 7, high: 7 }, D: null, C: null, S: null }, [[card("6H"), card("8H"), card("7S")], [], [], []]);
    expect(getTurnPlan(one)).toEqual({ kind: "auto_play", card: card("6H") });
    expect(getTurnPlan(none)).toEqual({ kind: "auto_pass" });
    expect(getTurnPlan(three)).toEqual({ kind: "await_choice", options: three.hands[0] });
  });
});
