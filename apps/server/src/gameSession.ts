import {
  createGame,
  getPlayerView,
  getTurnPlan,
  parseCardId,
  passTurn,
  playCard,
  startNextRound,
} from "@cardgame/engine";
import type { Card, CardId, GameEvent, GameState, PlayerView, Rng, Seat } from "@cardgame/engine";
import { DEFAULT_TIMINGS } from "./config";
import type { TimingConfig } from "./config";
import { chooseCardForTimeoutOrBot } from "./policy";

export interface SessionPlayer {
  seat: Seat;
  name: string;
  connected: boolean;
  isBot: boolean;
}

export interface GameSessionDependencies {
  rng: Rng;
  sendView: (seat: Seat, view: PlayerView) => void;
  sendEvents: (events: GameEvent[]) => void;
  sendLobby: () => void;
  setTimer: (callback: () => void, milliseconds: number) => unknown;
  clearTimer: (handle: unknown) => void;
  onGameOverReady?: () => void;
}

export type SessionErrorCode =
  | "ALREADY_STARTED"
  | "NOT_HOST"
  | "NOT_ENOUGH_PLAYERS"
  | "PLAYER_NOT_FOUND"
  | "GAME_NOT_STARTED"
  | "NOT_YOUR_TURN"
  | "NOT_AWAITING_CHOICE"
  | "INVALID_CARD"
  | "WRONG_PHASE"
  | "CARD_NOT_IN_HAND"
  | "ILLEGAL_CARD"
  | "MUST_PLAY"
  | "CANNOT_PASS";

export type SessionResult<T> = { ok: true; value: T } | { ok: false; error: SessionErrorCode };

const SEATS: Seat[] = [0, 1, 2, 3];

export class GameSession {
  private readonly players: Array<SessionPlayer | null> = [null, null, null, null];
  private readonly timers = new Set<unknown>();
  private readonly reconnectTimers = new Map<Seat, unknown>();
  private readonly dependencies: GameSessionDependencies;
  private readonly timings: TimingConfig;
  private currentGame: GameState | null = null;
  private currentHost: Seat | null = null;
  private actionTimer: unknown | null = null;
  private disposed = false;

  constructor(dependencies: GameSessionDependencies, timings: TimingConfig = DEFAULT_TIMINGS) {
    this.dependencies = dependencies;
    this.timings = timings;
  }

  get state(): GameState | null {
    return this.currentGame;
  }

  get started(): boolean {
    return this.currentGame !== null;
  }

  get hostSeat(): Seat | null {
    return this.currentHost;
  }

  getPlayer(seat: Seat): SessionPlayer | null {
    const player = this.players[seat];
    return player == null ? null : { ...player };
  }

  getLobbyPlayers(): Array<{ seat: Seat; name: string; connected: boolean }> {
    return this.players.flatMap((player) =>
      player === null ? [] : [{ seat: player.seat, name: player.name, connected: player.connected }],
    );
  }

  addPlayer(name: string): SessionResult<Seat> {
    if (this.started) return { ok: false, error: "ALREADY_STARTED" };
    const seat = SEATS.find((candidate) => this.players[candidate] === null);
    if (seat === undefined) return { ok: false, error: "NOT_ENOUGH_PLAYERS" };

    this.players[seat] = { seat, name, connected: true, isBot: false };
    this.recomputeHost();
    this.dependencies.sendLobby();
    return { ok: true, value: seat };
  }

  removePlayer(seat: Seat): void {
    if (this.started || this.players[seat] === null) return;
    this.players[seat] = null;
    this.recomputeHost();
    this.dependencies.sendLobby();
  }

  start(seat: Seat): SessionResult<void> {
    if (this.started) return { ok: false, error: "ALREADY_STARTED" };
    if (seat !== this.currentHost) return { ok: false, error: "NOT_HOST" };
    if (this.players.filter((player) => player !== null).length !== 4) {
      return { ok: false, error: "NOT_ENOUGH_PLAYERS" };
    }

    this.currentGame = createGame(this.dependencies.rng);
    this.publishState([]);
    this.dependencies.sendLobby();
    this.scheduleNextAction();
    return { ok: true, value: undefined };
  }

  handlePlay(seat: Seat, id: string): SessionResult<void> {
    if (this.currentGame === null) return { ok: false, error: "GAME_NOT_STARTED" };
    if (seat !== this.currentGame.currentSeat) return { ok: false, error: "NOT_YOUR_TURN" };
    if (this.currentGame.phase !== "in_round" || getTurnPlan(this.currentGame).kind !== "await_choice") {
      return { ok: false, error: "NOT_AWAITING_CHOICE" };
    }

    const card = parseCardId(id);
    if (card === null) return { ok: false, error: "INVALID_CARD" };
    const result = playCard(this.currentGame, seat, card);
    if (!result.ok) return { ok: false, error: result.error };

    this.cancelActionTimer();
    this.acceptEngineResult(result.value.state, result.value.events);
    return { ok: true, value: undefined };
  }

  seatDisconnected(seat: Seat): void {
    const player = this.players[seat];
    if (!this.started || player === null || player === undefined || player.isBot) return;

    player.connected = false;
    this.clearReconnectTimer(seat);
    const handle = this.schedule(() => {
      this.reconnectTimers.delete(seat);
      const disconnectedPlayer = this.players[seat];
      if (disconnectedPlayer === null || disconnectedPlayer === undefined || disconnectedPlayer.connected) return;
      disconnectedPlayer.isBot = true;
      this.publishState([]);
      this.dependencies.sendLobby();
      if (this.currentGame?.currentSeat === seat) this.cancelActionTimer();
      if (this.actionTimer === null) this.scheduleNextAction();
    }, this.timings.reconnectWindowMs);
    this.reconnectTimers.set(seat, handle);

    this.publishState([]);
    this.dependencies.sendLobby();
  }

  seatReconnected(seat: Seat): boolean {
    const player = this.players[seat];
    if (!this.started || player === null || player === undefined || player.isBot) return false;

    this.clearReconnectTimer(seat);
    player.connected = true;
    if (this.currentGame !== null) this.dependencies.sendView(seat, getPlayerView(this.currentGame, seat));
    this.dependencies.sendLobby();
    return true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const handle of this.timers) this.dependencies.clearTimer(handle);
    this.timers.clear();
    this.reconnectTimers.clear();
    this.actionTimer = null;
  }

  private recomputeHost(): void {
    this.currentHost = SEATS.find((seat) => this.players[seat] !== null) ?? null;
  }

  private publishState(events: GameEvent[]): void {
    if (this.currentGame !== null) {
      for (const seat of SEATS) {
        const player = this.players[seat];
        if (player != null && player.connected && !player.isBot) {
          this.dependencies.sendView(seat, getPlayerView(this.currentGame, seat));
        }
      }
    }
    if (events.length > 0) this.dependencies.sendEvents(events);
  }

  private acceptEngineResult(state: GameState, events: GameEvent[]): void {
    this.currentGame = state;
    this.publishState(events);
    this.scheduleNextAction();
  }

  private scheduleNextAction(): void {
    if (this.disposed || this.currentGame === null) return;
    this.cancelActionTimer();

    const state = this.currentGame;
    if (state.phase === "game_over") {
      this.actionTimer = this.schedule(() => {
        this.actionTimer = null;
        this.dependencies.onGameOverReady?.();
      }, this.timings.gameOverLingerMs);
      return;
    }

    if (state.phase === "round_over") {
      this.actionTimer = this.schedule(() => {
        this.actionTimer = null;
        if (this.currentGame === null || this.currentGame.phase !== "round_over") return;
        const result = startNextRound(this.currentGame, this.dependencies.rng);
        if (result.ok) this.acceptEngineResult(result.value.state, result.value.events);
      }, this.timings.nextRoundDelayMs);
      return;
    }

    const plan = getTurnPlan(state);
    const seat = state.currentSeat;
    const currentPlayer = this.players[seat];
    const botTurn = currentPlayer?.isBot === true || currentPlayer?.connected === false;

    if (plan.kind === "auto_play") {
      this.actionTimer = this.schedule(() => {
        this.actionTimer = null;
        if (this.currentGame !== state) return;
        const result = playCard(state, seat, plan.card);
        if (result.ok) this.acceptEngineResult(result.value.state, result.value.events);
      }, this.timings.autoMoveDelayMs);
      return;
    }

    if (plan.kind === "auto_pass") {
      this.actionTimer = this.schedule(() => {
        this.actionTimer = null;
        if (this.currentGame !== state) return;
        const result = passTurn(state, seat);
        if (result.ok) this.acceptEngineResult(result.value.state, result.value.events);
      }, this.timings.autoMoveDelayMs);
      return;
    }

    const delay = botTurn ? this.timings.autoMoveDelayMs : this.timings.turnTimeoutMs;
    this.actionTimer = this.schedule(() => {
      this.actionTimer = null;
      if (this.currentGame !== state || this.currentGame.phase !== "in_round") return;
      const choice = chooseCardForTimeoutOrBot(plan.options);
      const result = playCard(this.currentGame, seat, choice);
      if (result.ok) this.acceptEngineResult(result.value.state, result.value.events);
    }, delay);
  }

  private schedule(callback: () => void, milliseconds: number): unknown {
    let handle: unknown;
    handle = this.dependencies.setTimer(() => {
      this.timers.delete(handle);
      if (!this.disposed) callback();
    }, milliseconds);
    this.timers.add(handle);
    return handle;
  }

  private cancelActionTimer(): void {
    if (this.actionTimer === null) return;
    this.cancelTimer(this.actionTimer);
    this.actionTimer = null;
  }

  private clearReconnectTimer(seat: Seat): void {
    const handle = this.reconnectTimers.get(seat);
    if (handle === undefined) return;
    this.reconnectTimers.delete(seat);
    this.cancelTimer(handle);
  }

  private cancelTimer(handle: unknown): void {
    this.timers.delete(handle);
    this.dependencies.clearTimer(handle);
  }
}
