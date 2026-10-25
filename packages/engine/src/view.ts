import { cardId } from "./deck";
import { getLegalMoves, getTurnPlan } from "./rules";
import type { GameState, PlayerView, Seat, TableState } from "./types";

function copyTable(table: TableState): TableState {
  return {
    H: table.H === null ? null : { ...table.H },
    D: table.D === null ? null : { ...table.D },
    C: table.C === null ? null : { ...table.C },
    S: table.S === null ? null : { ...table.S },
  };
}

export function getPlayerView(state: GameState, seat: Seat): PlayerView {
  const isCurrentTurn = state.phase === "in_round" && state.currentSeat === seat;
  const turnPlan = isCurrentTurn ? getTurnPlan(state).kind : "waiting";

  return {
    seat,
    round: state.round,
    phase: state.phase,
    currentSeat: state.currentSeat,
    hand: state.hands[seat]!.map((card) => ({ ...card })),
    legalCards: isCurrentTurn ? getLegalMoves(state, seat).map(cardId) : [],
    turnPlan,
    table: copyTable(state.table),
    handCounts: state.hands.map((hand) => hand.length),
    playableCounts: state.phase === "in_round" ? [...state.lowCardHints] : [null, null, null, null],
    totals: [...state.totals],
    roundScores: state.roundScores === null ? null : [...state.roundScores],
    roundWinner: state.roundWinner,
    winners: state.winners === null ? null : [...state.winners],
  };
}
