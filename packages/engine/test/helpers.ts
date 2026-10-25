import { createGame, mulberry32, parseCardId } from "../src";
import type { Card, GameState, Seat, TableState } from "../src/types";

export function card(id: string): Card {
  const value = parseCardId(id);
  if (value === null) throw new Error(`Invalid fixture card: ${id}`);
  return value;
}

export function stateWith(
  table: TableState,
  hands: Card[][],
  currentSeat: Seat = 0,
): GameState {
  return {
    ...createGame(mulberry32(1)),
    hands,
    table,
    currentSeat,
  };
}

export const EMPTY_TABLE: TableState = { H: null, D: null, C: null, S: null };
