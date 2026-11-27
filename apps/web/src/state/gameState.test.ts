import { describe, expect, it } from "vitest";
import type { GameEvent, PlayerView } from "@cardgame/engine";
import {
  appReducer,
  createToastFromEvent,
  getScreenName,
  initialAppState,
  type AppState,
} from "./gameState";
import type { LobbyMessage } from "../net/client";

describe("gameState reducer", () => {
  it("transitions screens according to lobby and view state", () => {
    let state: AppState = initialAppState;
    expect(getScreenName(state)).toBe("home");

    const lobby: LobbyMessage = {
      code: "ABCDE",
      hostSeat: 0,
      players: [
        { seat: 0, name: "Alice", connected: true, isBot: false },
        { seat: 1, name: null, connected: false, isBot: false },
        { seat: 2, name: null, connected: false, isBot: false },
        { seat: 3, name: null, connected: false, isBot: false },
      ],
    };
    state = appReducer(state, { type: "SET_LOBBY", lobby });
    expect(getScreenName(state)).toBe("lobby");
    expect(state.mySeat).toBe(0);

    const baseView: PlayerView = {
      seat: 0,
      round: 1,
      phase: "in_round",
      currentSeat: 0,
      hand: [{ suit: "H", rank: 7 }],
      legalCards: ["7H"],
      turnPlan: "await_choice",
      table: { H: null, D: null, C: null, S: null },
      handCounts: [13, 13, 13, 13],
      playableCounts: [null, null, null, null],
      totals: [0, 0, 0, 0],
      roundScores: null,
      roundWinner: null,
      winners: null,
    };

    state = appReducer(state, { type: "SET_VIEW", view: baseView });
    expect(getScreenName(state)).toBe("table");

    state = appReducer(state, {
      type: "SET_VIEW",
      view: { ...baseView, phase: "round_over", roundWinner: 1, roundScores: [10, 0, 15, 20] },
    });
    expect(getScreenName(state)).toBe("round_over");

    state = appReducer(state, {
      type: "SET_VIEW",
      view: { ...baseView, phase: "game_over", winners: [1], totals: [50, 20, 65, 80] },
    });
    expect(getScreenName(state)).toBe("game_over");

    state = appReducer(state, { type: "RESET" });
    expect(getScreenName(state)).toBe("home");
  });

  it("creates toasts correctly from game events", () => {
    const lobby: LobbyMessage = {
      code: "ABCDE",
      hostSeat: 0,
      players: [
        { seat: 0, name: "Alice", connected: true, isBot: false },
        { seat: 1, name: "Bob", connected: true, isBot: false },
        { seat: 2, name: "Kabir", connected: false, isBot: true },
        { seat: 3, name: "Maya", connected: false, isBot: true },
      ],
    };

    const cardEvent: GameEvent = {
      type: "card_played",
      seat: 0,
      card: { suit: "H", rank: 7 },
      auto: false,
    };
    const t1 = createToastFromEvent(cardEvent, lobby);
    expect(t1?.message).toBe("Alice played 7♥");

    const autoCardEvent: GameEvent = {
      type: "card_played",
      seat: 1,
      card: { suit: "S", rank: 7 },
      auto: true,
    };
    const t2 = createToastFromEvent(autoCardEvent, lobby);
    expect(t2?.message).toBe("Bob played 7♠ (automatic)");

    const passEvent: GameEvent = {
      type: "passed",
      seat: 1,
    };
    const t3 = createToastFromEvent(passEvent, lobby);
    expect(t3?.message).toBe("Bob has no playable card");

    const winEvent: GameEvent = {
      type: "round_won",
      seat: 0,
      roundScores: [0, 10, 20, 30],
      totals: [0, 10, 20, 30],
    };
    const t4 = createToastFromEvent(winEvent, lobby);
    expect(t4?.message).toBe("Alice won the round!");
  });

  it("resolves mySeat from lobby with vacant and bot seats", () => {
    let state: AppState = { ...initialAppState, localName: "Bob" };
    const lobbyWithMultipleHumans: LobbyMessage = {
      code: "ABCDE",
      hostSeat: 0,
      players: [
        { seat: 0, name: "Alice", connected: true, isBot: false },
        { seat: 1, name: "Bob", connected: true, isBot: false },
        { seat: 2, name: null, connected: false, isBot: false },
        { seat: 3, name: null, connected: false, isBot: false },
      ],
    };
    state = appReducer(state, { type: "SET_LOBBY", lobby: lobbyWithMultipleHumans });
    expect(state.mySeat).toBe(1);

    const startedLobby: LobbyMessage = {
      code: "ABCDE",
      hostSeat: 0,
      players: [
        { seat: 0, name: "Alice", connected: true, isBot: false },
        { seat: 1, name: "Bob", connected: true, isBot: false },
        { seat: 2, name: "Kabir", connected: false, isBot: true },
        { seat: 3, name: "Maya", connected: false, isBot: true },
      ],
    };
    state = appReducer(state, { type: "SET_LOBBY", lobby: startedLobby });
    expect(state.lobby?.players.filter((p) => p.isBot)).toHaveLength(2);
    expect(state.mySeat).toBe(1);
  });

  it("enqueues and consumes plays and passes with monotonic ids", () => {
    let state: AppState = initialAppState;

    state = appReducer(state, {
      type: "ENQUEUE_PLAY",
      seat: 1,
      card: { suit: "H", rank: 7 },
      auto: true,
    });
    state = appReducer(state, {
      type: "ENQUEUE_PLAY",
      seat: 0,
      card: { suit: "H", rank: 8 },
      auto: false,
    });

    expect(state.plays).toHaveLength(2);
    expect(state.plays[0]).toEqual({
      id: 1,
      seat: 1,
      card: { suit: "H", rank: 7 },
      auto: true,
    });
    expect(state.plays[1]?.id).toBe(2);

    state = appReducer(state, { type: "CONSUME_PLAY", id: 1 });
    expect(state.plays).toHaveLength(1);
    expect(state.plays[0]?.id).toBe(2);

    state = appReducer(state, { type: "ENQUEUE_PASS", seat: 2 });
    expect(state.passes).toEqual([{ id: 1, seat: 2 }]);
    state = appReducer(state, { type: "CONSUME_PASS", id: 1 });
    expect(state.passes).toEqual([]);
  });
});
