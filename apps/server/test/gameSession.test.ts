import { describe, expect, it } from "vitest";
import { cardId, getLegalMoves, getTurnPlan, mulberry32 } from "@cardgame/engine";
import type { Card, GameState, GameEvent, PlayerView, Seat, Suit } from "@cardgame/engine";
import type { TimingConfig } from "../src/config";
import { GameSession } from "../src/gameSession";
import { chooseCardForTimeoutOrBot } from "../src/policy";

interface ScheduledTimer {
  id: number;
  due: number;
  callback: () => void;
  cancelled: boolean;
}

class FakeTimers {
  private now = 0;
  private nextId = 1;
  private readonly timers = new Map<number, ScheduledTimer>();

  setTimer = (callback: () => void, milliseconds: number): unknown => {
    const id = this.nextId++;
    this.timers.set(id, { id, due: this.now + milliseconds, callback, cancelled: false });
    return id;
  };

  clearTimer = (handle: unknown): void => {
    const timer = this.timers.get(handle as number);
    if (timer !== undefined) timer.cancelled = true;
    this.timers.delete(handle as number);
  };

  runNext(): void {
    const next = [...this.timers.values()]
      .filter((timer) => !timer.cancelled)
      .sort((left, right) => left.due - right.due || left.id - right.id)[0];
    if (next === undefined) throw new Error("No timer is scheduled");
    this.timers.delete(next.id);
    this.now = next.due;
    next.callback();
  }

  advanceBy(milliseconds: number, maxCallbacks = 50_000): void {
    const target = this.now + milliseconds;
    let callbacks = 0;
    while (true) {
      const next = [...this.timers.values()]
        .filter((timer) => !timer.cancelled && timer.due <= target)
        .sort((left, right) => left.due - right.due || left.id - right.id)[0];
      if (next === undefined) break;
      if (++callbacks > maxCallbacks) throw new Error("Fake timer callback limit exceeded");
      this.timers.delete(next.id);
      this.now = next.due;
      next.callback();
    }
    this.now = target;
  }
}

const FAST_TIMINGS: TimingConfig = {
  autoMoveDelayMs: 10,
  turnTimeoutMs: 50,
  reconnectWindowMs: 100,
  nextRoundDelayMs: 20,
  gameOverLingerMs: 30,
};

interface Harness {
  session: GameSession;
  timers: FakeTimers;
  views: Array<{ seat: Seat; view: PlayerView }>;
  events: GameEvent[][];
  lobbyUpdates: number;
}

function createHarness(seed = 1, timings = FAST_TIMINGS): Harness {
  const timers = new FakeTimers();
  const views: Array<{ seat: Seat; view: PlayerView }> = [];
  const events: GameEvent[][] = [];
  let lobbyUpdates = 0;
  const session = new GameSession(
    {
      rng: mulberry32(seed),
      sendView: (seat, view) => views.push({ seat, view }),
      sendEvents: (batch) => events.push(batch),
      sendLobby: () => { lobbyUpdates += 1; },
      setTimer: timers.setTimer,
      clearTimer: timers.clearTimer,
    },
    timings,
  );
  return { session, timers, views, events, get lobbyUpdates() { return lobbyUpdates; } };
}

function fillSeats(session: GameSession): void {
  for (let seat = 0; seat < 4; seat += 1) {
    const result = session.addPlayer(`Player ${seat}`);
    expect(result).toEqual({ ok: true, value: seat });
  }
}

function driveUntil(
  session: GameSession,
  timers: FakeTimers,
  predicate: (state: GameState) => boolean,
  limit = 5000,
): GameState {
  for (let step = 0; step < limit; step += 1) {
    const state = session.state;
    if (state === null) throw new Error("Game has not started");
    if (predicate(state)) return state;

    if (state.phase === "in_round") {
      const plan = getTurnPlan(state);
      if (plan.kind === "await_choice") {
        const chosen = plan.options[0]!;
        const result = session.handlePlay(state.currentSeat, cardId(chosen));
        if (!result.ok) throw new Error(result.error);
      } else {
        timers.advanceBy(FAST_TIMINGS.autoMoveDelayMs);
      }
    } else {
      timers.advanceBy(FAST_TIMINGS.nextRoundDelayMs);
    }
  }
  throw new Error("Session did not reach the expected state");
}

describe("GameSession lobby", () => {
  it("enforces four seats, host start, and host reassignment", () => {
    const { session } = createHarness();
    expect(session.start(0)).toEqual({ ok: false, error: "NOT_HOST" });
    expect(session.addPlayer("First")).toEqual({ ok: true, value: 0 });
    expect(session.addPlayer("Second")).toEqual({ ok: true, value: 1 });
    expect(session.start(0)).toEqual({ ok: false, error: "NOT_ENOUGH_PLAYERS" });

    session.removePlayer(0);
    expect(session.hostSeat).toBe(1);
    expect(session.start(0)).toEqual({ ok: false, error: "NOT_HOST" });
    expect(session.start(1)).toEqual({ ok: false, error: "NOT_ENOUGH_PLAYERS" });
    expect(session.addPlayer("Third")).toEqual({ ok: true, value: 0 });
    expect(session.addPlayer("Fourth")).toEqual({ ok: true, value: 2 });
    expect(session.addPlayer("Fifth")).toEqual({ ok: true, value: 3 });
    expect(session.addPlayer("Sixth")).toEqual({ ok: false, error: "NOT_ENOUGH_PLAYERS" });
    expect(session.start(0)).toEqual({ ok: true, value: undefined });
    expect(session.addPlayer("Late")).toEqual({ ok: false, error: "ALREADY_STARTED" });
    session.dispose();
  });
});

describe("GameSession turn orchestration", () => {
  it("delays an automatic first play", () => {
    const { session, timers, events } = createHarness();
    fillSeats(session);
    expect(session.start(0).ok).toBe(true);
    const before = structuredClone(session.state);
    timers.advanceBy(FAST_TIMINGS.autoMoveDelayMs - 1);
    expect(session.state).toEqual(before);
    timers.advanceBy(1);
    expect(session.state?.table.H).toEqual({ low: 7, high: 7 });
    expect(events.flat()).toContainEqual({
      type: "card_played",
      seat: before!.currentSeat,
      card: { rank: 7, suit: "H" },
      auto: true,
    });
    session.dispose();
  });

  it("delays auto-pass turns before advancing", () => {
    const { session, timers } = createHarness(5);
    fillSeats(session);
    session.start(0);
    const state = driveUntil(session, timers, (candidate) =>
      candidate.phase === "in_round" && getTurnPlan(candidate).kind === "auto_pass",
    );
    const currentSeat = state.currentSeat;
    const before = structuredClone(state);
    timers.advanceBy(FAST_TIMINGS.autoMoveDelayMs - 1);
    expect(session.state).toEqual(before);
    timers.advanceBy(1);
    expect(session.state?.currentSeat).toBe(((currentSeat + 1) % 4) as Seat);
    expect(session.state).not.toEqual(before);
    session.dispose();
  });

  it("uses the highest-ranked card when an await-choice turn times out", () => {
    const { session, timers, events } = createHarness(42);
    fillSeats(session);
    session.start(0);
    const state = driveUntil(session, timers, (candidate) =>
      candidate.phase === "in_round" && getTurnPlan(candidate).kind === "await_choice",
    );
    const plan = getTurnPlan(state);
    if (plan.kind !== "await_choice") throw new Error("Expected a choice turn");
    const selected = chooseCardForTimeoutOrBot(plan.options);
    timers.runNext();
    expect(events.flat()).toContainEqual({ type: "card_played", seat: state.currentSeat, card: selected, auto: false });
    session.dispose();
  });

  it("returns errors for invalid play attempts without changing game state", () => {
    const { session, timers } = createHarness(19);
    expect(session.handlePlay(0, "7H")).toEqual({ ok: false, error: "GAME_NOT_STARTED" });
    fillSeats(session);
    session.start(0);
    const firstSeat = session.state!.currentSeat;
    expect(session.handlePlay(firstSeat, "7H")).toEqual({ ok: false, error: "NOT_AWAITING_CHOICE" });
    const state = driveUntil(session, timers, (candidate) =>
      candidate.phase === "in_round" && getTurnPlan(candidate).kind === "await_choice",
    );
    const seat = state.currentSeat;
    const before = structuredClone(state);
    expect(session.handlePlay(((seat + 1) % 4) as Seat, "invalid")).toEqual({ ok: false, error: "NOT_YOUR_TURN" });
    expect(session.handlePlay(seat, "invalid")).toEqual({ ok: false, error: "INVALID_CARD" });

    const held = state.hands[seat]!;
    const legal = getLegalMoves(state, seat);
    const illegal = held.find((candidate) => !legal.some((option) => cardId(option) === cardId(candidate)));
    if (illegal !== undefined) {
      expect(session.handlePlay(seat, cardId(illegal))).toEqual({ ok: false, error: "ILLEGAL_CARD" });
    }
    const absent = (Array.from({ length: 13 }, (_, index) => ({ rank: index + 1, suit: "S" as const })) as Card[])
      .find((candidate) => !held.some((card) => cardId(card) === cardId(candidate)));
    if (absent !== undefined) {
      expect(session.handlePlay(seat, cardId(absent))).toEqual({ ok: false, error: "CARD_NOT_IN_HAND" });
    }
    expect(session.state).toEqual(before);
    session.dispose();
  });

  it("converts a disconnected seat to a bot after the reconnect window", () => {
    const { session, timers } = createHarness();
    fillSeats(session);
    session.start(0);
    const seat = session.state!.currentSeat;
    session.seatDisconnected(seat);
    expect(session.getPlayer(seat)?.connected).toBe(false);
    expect(session.getPlayer(seat)?.isBot).toBe(false);
    timers.advanceBy(FAST_TIMINGS.reconnectWindowMs);
    expect(session.getPlayer(seat)?.isBot).toBe(true);
    expect(session.getPlayer(seat)?.connected).toBe(false);
    session.dispose();
  });

  it("restores a disconnected seat when it reconnects within the window", () => {
    const { session, timers, views } = createHarness();
    fillSeats(session);
    session.start(0);
    const seat = session.state!.currentSeat;
    session.seatDisconnected(seat);
    timers.advanceBy(FAST_TIMINGS.reconnectWindowMs / 2);
    const viewsBefore = views.length;
    expect(session.seatReconnected(seat)).toBe(true);
    expect(session.getPlayer(seat)?.connected).toBe(true);
    expect(session.getPlayer(seat)?.isBot).toBe(false);
    expect(views.slice(viewsBefore).some((entry) => entry.seat === seat)).toBe(true);
    timers.advanceBy(FAST_TIMINGS.reconnectWindowMs);
    expect(session.getPlayer(seat)?.isBot).toBe(false);
    session.dispose();
  });

  it("waits for the round-summary delay before dealing the next round", () => {
    const { session, timers } = createHarness(52);
    fillSeats(session);
    session.start(0);
    const state = driveUntil(session, timers, (candidate) => candidate.phase === "round_over");
    const round = state.round;
    timers.advanceBy(FAST_TIMINGS.nextRoundDelayMs - 1);
    expect(session.state?.phase).toBe("round_over");
    expect(session.state?.round).toBe(round);
    timers.advanceBy(1);
    expect(session.state?.phase).toBe("in_round");
    expect(session.state?.round).toBe(round + 1);
    expect(session.state?.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    session.dispose();
  });

  it("finishes all seven rounds for four bots and maintains engine invariants", () => {
    const timings: TimingConfig = {
      autoMoveDelayMs: 0,
      turnTimeoutMs: 0,
      reconnectWindowMs: 0,
      nextRoundDelayMs: 0,
      gameOverLingerMs: 0,
    };
    const timers = new FakeTimers();
    const events: GameEvent[] = [];
    let session!: GameSession;
    const checkState = () => {
      const state = session.state;
      if (state === null) return;
      const tableCards: Card[] = [];
      for (const suit of ["H", "D", "C", "S"] as Suit[]) {
        const run = state.table[suit];
        if (run !== null) {
          for (let rank = run.low; rank <= run.high; rank += 1) tableCards.push({ suit, rank: rank as Card["rank"] });
        }
      }
      const ids = [...state.hands.flat(), ...tableCards].map(cardId);
      if (ids.length !== 52 || new Set(ids).size !== 52) throw new Error("Card conservation failed");
      if (state.phase === "in_round" && ![0, 1, 2, 3].some((seat) => getLegalMoves(state, seat as Seat).length > 0)) {
        throw new Error("Game reached a deadlock");
      }
      if (state.phase === "round_over" || state.phase === "game_over") {
        const empties = state.hands.filter((hand) => hand.length === 0);
        if (empties.length !== 1 || state.roundScores?.[state.roundWinner!] !== 0) {
          throw new Error("Round end invariant failed");
        }
      }
    };

    session = new GameSession({
      rng: mulberry32(700),
      sendView: () => checkState(),
      sendEvents: (batch) => {
        events.push(...batch);
        checkState();
      },
      sendLobby: () => undefined,
      setTimer: timers.setTimer,
      clearTimer: timers.clearTimer,
    }, timings);
    fillSeats(session);
    expect(session.start(0).ok).toBe(true);
    for (const seat of [0, 1, 2, 3] as Seat[]) session.seatDisconnected(seat);
    timers.advanceBy(0);

    expect(session.state?.phase).toBe("game_over");
    expect(session.state?.round).toBe(7);
    expect(events.filter((event) => event.type === "round_won")).toHaveLength(7);
    expect(events.at(-1)?.type).toBe("game_over");
    expect([0, 1, 2, 3].every((seat) => session.getPlayer(seat as Seat)?.isBot)).toBe(true);
    session.dispose();
  });
});
