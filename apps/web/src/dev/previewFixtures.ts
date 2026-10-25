import type { PlayerView } from "@cardgame/engine";
import type { LobbyMessage } from "../net/client";

export const tablePreviewView: PlayerView = {
  seat: 0,
  round: 3,
  phase: "in_round",
  currentSeat: 0,
  hand: [
    { suit: "H", rank: 4 },
    { suit: "H", rank: 1 },
    { suit: "H", rank: 2 },
    { suit: "H", rank: 10 },
    { suit: "H", rank: 12 },
    { suit: "D", rank: 4 },
    { suit: "D", rank: 5 },
    { suit: "D", rank: 11 },
    { suit: "C", rank: 3 },
    { suit: "C", rank: 9 },
    { suit: "C", rank: 12 },
    { suit: "S", rank: 6 },
    { suit: "S", rank: 9 },
  ],
  legalCards: ["4H", "10H", "9C", "6S"],
  turnPlan: "await_choice",
  table: {
    H: { low: 5, high: 9 },
    D: { low: 7, high: 8 },
    C: { low: 6, high: 8 },
    S: { low: 7, high: 7 },
  },
  handCounts: [13, 9, 7, 3],
  playableCounts: [4, 0, 0, 2],
  totals: [12, 34, 43, 68],
  roundScores: null,
  roundWinner: null,
  winners: null,
};

export const tablePreviewLobby: LobbyMessage = {
  code: "ABCDE",
  hostSeat: 0,
  players: [
    { seat: 0, name: "You", connected: true },
    { seat: 1, name: "Morgan", connected: true },
    { seat: 2, name: "Taylor", connected: true },
    { seat: 3, name: "Casey", connected: true },
  ],
};
