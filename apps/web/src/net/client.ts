import { Client, Room } from "@colyseus/sdk";
import type { CardId, GameEvent, PlayerView, Seat } from "@cardgame/engine";

// Message typing matching apps/server/src/messages.ts without runtime zod dependency
export interface LobbyPlayer {
  seat: Seat;
  name: string;
  connected: boolean;
}

export interface LobbyMessage {
  code: string;
  hostSeat: Seat | null;
  players: LobbyPlayer[];
}

export type ViewMessage = PlayerView;
export type EventMessage = GameEvent;

export interface ErrorMessage {
  code: string;
  message: string;
}

export interface PlayMessage {
  card: CardId;
}

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export interface NetworkCallbacks {
  onLobby: (lobby: LobbyMessage) => void;
  onView: (view: PlayerView) => void;
  onEvent: (event: GameEvent) => void;
  onError: (error: ErrorMessage) => void;
  onStatusChange: (status: ConnectionStatus, message?: string) => void;
  onLeave: (code?: number) => void;
}

const RECONNECT_STORAGE_KEY = "sevens:reconnectionToken";
const DEFAULT_SERVER_URL = "ws://localhost:2567";

export class NetworkClient {
  private readonly client: Client;
  private currentRoom: Room | null = null;
  private callbacks: NetworkCallbacks | null = null;

  constructor(serverUrl: string = import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL) {
    this.client = new Client(serverUrl);
  }

  setCallbacks(callbacks: NetworkCallbacks): void {
    this.callbacks = callbacks;
  }

  getReconnectionToken(): string | null {
    try {
      if (typeof sessionStorage === "undefined") return null;
      return sessionStorage.getItem(RECONNECT_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private saveReconnectionToken(token: string): void {
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(RECONNECT_STORAGE_KEY, token);
      }
    } catch {
      // Storage might be restricted
    }
  }

  clearReconnectionToken(): void {
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(RECONNECT_STORAGE_KEY);
      }
    } catch {
      // Storage might be restricted
    }
  }

  private attachRoomListeners(room: Room): void {
    this.currentRoom = room;

    if (room.reconnectionToken) {
      this.saveReconnectionToken(room.reconnectionToken);
    }

    room.onMessage("lobby", (payload: LobbyMessage) => {
      this.callbacks?.onLobby(payload);
    });

    room.onMessage("view", (payload: PlayerView) => {
      this.callbacks?.onView(payload);
    });

    room.onMessage("event", (payload: GameEvent) => {
      this.callbacks?.onEvent(payload);
    });

    room.onMessage("error", (payload: ErrorMessage) => {
      this.callbacks?.onError(payload);
    });

    room.onError((code, message) => {
      this.callbacks?.onError({
        code: String(code),
        message: message || "Network connection error",
      });
    });

    room.onDrop(() => {
      this.callbacks?.onStatusChange("reconnecting", "Connection lost. Reconnecting...");
    });

    room.onReconnect(() => {
      this.callbacks?.onStatusChange("connected");
    });

    room.onLeave((code) => {
      this.currentRoom = null;
      this.callbacks?.onLeave(code);
    });
  }

  async createRoom(name: string): Promise<Room> {
    this.callbacks?.onStatusChange("connecting", "Creating room...");
    try {
      const room = await this.client.create("sevens", { name: name.trim() });
      this.attachRoomListeners(room);
      this.callbacks?.onStatusChange("connected");
      return room;
    } catch (err) {
      this.callbacks?.onStatusChange("disconnected");
      const message = err instanceof Error ? err.message : "Failed to create room";
      throw new Error(message);
    }
  }

  async joinRoom(code: string, name: string): Promise<Room> {
    const normalizedCode = code.trim().toUpperCase();
    this.callbacks?.onStatusChange("connecting", "Joining room...");
    try {
      const room = await this.client.joinById(normalizedCode, {
        name: name.trim(),
        code: normalizedCode,
      });
      this.attachRoomListeners(room);
      this.callbacks?.onStatusChange("connected");
      return room;
    } catch (err) {
      this.callbacks?.onStatusChange("disconnected");
      const message = err instanceof Error ? err.message : "Failed to join room";
      throw new Error(message);
    }
  }

  async tryReconnect(): Promise<Room | null> {
    const token = this.getReconnectionToken();
    if (!token) return null;

    this.callbacks?.onStatusChange("reconnecting", "Reconnecting to room...");
    try {
      const room = await this.client.reconnect(token);
      this.attachRoomListeners(room);
      this.callbacks?.onStatusChange("connected");
      return room;
    } catch (err) {
      this.clearReconnectionToken();
      this.callbacks?.onStatusChange("disconnected", "Reconnection expired or failed");
      return null;
    }
  }

  sendStart(): void {
    if (!this.currentRoom) return;
    this.currentRoom.send("start");
  }

  sendPlay(cardId: CardId): void {
    if (!this.currentRoom) return;
    this.currentRoom.send("play", { card: cardId });
  }

  async leave(): Promise<void> {
    this.clearReconnectionToken();
    if (this.currentRoom) {
      try {
        await this.currentRoom.leave(true);
      } catch {
        // Ignore leave errors
      }
      this.currentRoom = null;
    }
    this.callbacks?.onStatusChange("idle");
  }
}

export const netClient = new NetworkClient();
