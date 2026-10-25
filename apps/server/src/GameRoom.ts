import { CloseCode, Room, type Client } from "colyseus";
import { secureRng } from "@cardgame/engine";
import type { GameEvent, PlayerView, Seat } from "@cardgame/engine";
import {
  DEFAULT_TIMINGS,
  MAX_MESSAGES_PER_SECOND,
  RECONNECT_WINDOW_MS,
  type TimingConfig,
} from "./config";
import { GameSession } from "./gameSession";
import { errorMessageSchema, joinOptionsSchema, lobbyMessageSchema, playMessageSchema, startMessageSchema } from "./messages";
import { generateRoomCode, normalizeRoomCode, releaseRoomCode } from "./roomCode";

interface MessageBucket {
  startedAt: number;
  count: number;
}

export class GameRoom extends Room {
  static timingOverrides: TimingConfig = DEFAULT_TIMINGS;

  maxClients = 4;
  maxMessagesPerSecond = Number.POSITIVE_INFINITY;
  autoDispose = false;

  private session!: GameSession;
  private code = "";
  private readonly seatBySession = new Map<string, Seat>();
  private readonly clientsBySeat = new Map<Seat, Client>();
  private readonly messageBuckets = new Map<string, MessageBucket>();
  private shuttingDown = false;

  onCreate(): void {
    this.code = generateRoomCode();
    this.roomId = this.code;

    this.session = new GameSession(
      {
        rng: secureRng(),
        sendView: (seat, view) => this.sendView(seat, view),
        sendEvents: (events) => this.sendEvents(events),
        sendLobby: () => this.sendLobby(),
        setTimer: (callback, milliseconds) => setTimeout(callback, milliseconds),
        clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
        onGameOverReady: () => {
          this.shuttingDown = true;
          void this.disconnect();
        },
      },
      GameRoom.timingOverrides,
    );

    this.onMessage("start", (client, payload) => this.handleStartMessage(client, payload));
    this.onMessage("play", (client, payload) => this.handlePlayMessage(client, payload));
    this.onMessage("*", (client, type) => {
      if (!this.allowMessage(client)) return;
      this.sendError(client, "UNKNOWN_MESSAGE", `Unknown message type: ${String(type)}`);
    });
  }

  onJoin(client: Client, options: unknown): void {
    const parsed = joinOptionsSchema.safeParse(options);
    if (!parsed.success) throw new Error("Invalid join options");
    if (parsed.data.code !== undefined && parsed.data.code !== normalizeRoomCode(this.code)) {
      throw new Error("Room code does not match");
    }

    const result = this.session.addPlayer(parsed.data.name);
    if (!result.ok) throw new Error(result.error);
    client.userData = { seat: result.value };
    this.seatBySession.set(client.sessionId, result.value);
    this.clientsBySeat.set(result.value, client);
    this.messageBuckets.set(client.sessionId, { startedAt: performance.now(), count: 0 });
    this.sendLobby();
  }

  async onDrop(client: Client): Promise<void> {
    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined || !this.session.started || this.shuttingDown) return;

    this.session.seatDisconnected(seat);
    try {
      await this.allowReconnection(client, RECONNECT_WINDOW_MS / 1000);
    } catch {
      // The session's injected timer performs permanent bot takeover at the same deadline.
    }
  }

  onReconnect(client: Client): void {
    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined) return;
    this.clientsBySeat.set(seat, client);
    client.userData = { seat };
    this.session.seatReconnected(seat);
  }

  async onLeave(client: Client, code: number): Promise<void> {
    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined) return;
    this.clientsBySeat.delete(seat);
    this.messageBuckets.delete(client.sessionId);

    if (!this.session.started) {
      this.seatBySession.delete(client.sessionId);
      this.session.removePlayer(seat);
      if (this.session.getLobbyPlayers().length === 0) {
        this.shuttingDown = true;
        await this.disconnect();
      }
      return;
    }

    if (code === CloseCode.CONSENTED && !this.shuttingDown) {
      this.session.seatDisconnected(seat);
      try {
        await this.allowReconnection(client, RECONNECT_WINDOW_MS / 1000);
      } catch {
        // The session owns the seat and will convert it to a bot after the window.
      }
    }
  }

  onDispose(): void {
    this.session?.dispose();
    releaseRoomCode(this.code);
  }

  private handleStartMessage(client: Client, payload: unknown): void {
    if (!this.allowMessage(client)) return;
    const parsed = startMessageSchema.safeParse(payload);
    if (!parsed.success) {
      this.sendError(client, "INVALID_MESSAGE", "Start takes no payload");
      return;
    }

    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined) {
      this.sendError(client, "PLAYER_NOT_FOUND", "Player is not seated");
      return;
    }
    const result = this.session.start(seat);
    if (!result.ok) this.sendError(client, result.error, "Only the host can start after four players have joined");
  }

  private handlePlayMessage(client: Client, payload: unknown): void {
    if (!this.allowMessage(client)) return;
    const parsed = playMessageSchema.safeParse(payload);
    if (!parsed.success) {
      this.sendError(client, "INVALID_MESSAGE", "Play requires a valid card id");
      return;
    }

    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined) {
      this.sendError(client, "PLAYER_NOT_FOUND", "Player is not seated");
      return;
    }
    const result = this.session.handlePlay(seat, parsed.data.card);
    if (!result.ok) this.sendError(client, result.error, "Play is not valid for the current turn");
  }

  private allowMessage(client: Client): boolean {
    const now = performance.now();
    const bucket = this.messageBuckets.get(client.sessionId) ?? { startedAt: now, count: 0 };
    if (now - bucket.startedAt >= 1000) {
      bucket.startedAt = now;
      bucket.count = 0;
    }
    bucket.count += 1;
    this.messageBuckets.set(client.sessionId, bucket);

    if (bucket.count <= MAX_MESSAGES_PER_SECOND) return true;
    this.sendError(client, "RATE_LIMIT", "Too many messages; try again shortly");
    return false;
  }

  private sendError(client: Client, code: string, message: string): void {
    const payload = errorMessageSchema.parse({ code, message });
    client.send("error", payload);
  }

  private sendLobby(): void {
    if (!this.session) return;
    const payload = lobbyMessageSchema.parse({
      code: this.code,
      hostSeat: this.session.hostSeat,
      players: this.session.getLobbyPlayers(),
    });
    for (const client of this.clients) client.send("lobby", payload);
  }

  private sendView(seat: Seat, view: PlayerView): void {
    this.clientsBySeat.get(seat)?.send("view", view);
  }

  private sendEvents(events: GameEvent[]): void {
    for (const event of events) {
      for (const client of this.clients) client.send("event", event);
    }
  }
}
