import type { Card, CardId, GameEvent, PlayerView, Seat } from "@cardgame/engine";
import { formatCard } from "../lib/cards";
import type { ConnectionStatus, LobbyMessage } from "../net/client";

export interface Toast {
  id: string;
  message: string;
  createdAt: number;
}

export interface PlayFlightItem {
  id: number;
  seat: Seat;
  card: Card;
  auto: boolean;
}

export interface PassPulseItem {
  id: number;
  seat: Seat;
}

export type ScreenName = "home" | "lobby" | "table" | "round_over" | "game_over";

export interface AppState {
  connectionStatus: ConnectionStatus;
  connectionMessage: string | null;
  serverError: string | null;
  localName: string;
  mySeat: Seat | null;
  lobby: LobbyMessage | null;
  view: PlayerView | null;
  toasts: Toast[];
  recentCardId: CardId | null;
  plays: PlayFlightItem[];
  nextPlayId: number;
  passes: PassPulseItem[];
  nextPassId: number;
}

export const initialAppState: AppState = {
  connectionStatus: "idle",
  connectionMessage: null,
  serverError: null,
  localName: "",
  mySeat: null,
  lobby: null,
  view: null,
  toasts: [],
  recentCardId: null,
  plays: [],
  nextPlayId: 1,
  passes: [],
  nextPassId: 1,
};

export type AppAction =
  | { type: "SET_STATUS"; status: ConnectionStatus; message?: string }
  | { type: "SET_SERVER_ERROR"; error: string | null }
  | { type: "SET_LOCAL_NAME"; name: string }
  | { type: "SET_LOBBY"; lobby: LobbyMessage }
  | { type: "SET_VIEW"; view: PlayerView }
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "SET_RECENT_CARD"; cardId: CardId | null }
  | { type: "ENQUEUE_PLAY"; seat: Seat; card: Card; auto: boolean }
  | { type: "CONSUME_PLAY"; id: number }
  | { type: "ENQUEUE_PASS"; seat: Seat }
  | { type: "CONSUME_PASS"; id: number }
  | { type: "RESET" };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_STATUS":
      return {
        ...state,
        connectionStatus: action.status,
        connectionMessage: action.message ?? null,
      };

    case "SET_SERVER_ERROR":
      return {
        ...state,
        serverError: action.error,
      };

    case "SET_LOCAL_NAME":
      return {
        ...state,
        localName: action.name,
      };

    case "SET_LOBBY": {
      let resolvedSeat = state.mySeat;
      if (state.view !== null) {
        resolvedSeat = state.view.seat;
      } else if (resolvedSeat === null) {
        const seatedHumans = action.lobby.players.filter(
          (p) => p.name !== null && !p.isBot,
        );
        if (seatedHumans.length === 1) {
          resolvedSeat = seatedHumans[0]!.seat;
        } else if (state.localName.trim().length > 0) {
          const match = seatedHumans.find(
            (p) => p.name !== null && p.name.trim().toLowerCase() === state.localName.trim().toLowerCase(),
          );
          if (match) resolvedSeat = match.seat;
        }
      }

      return {
        ...state,
        lobby: action.lobby,
        mySeat: resolvedSeat,
      };
    }

    case "SET_VIEW":
      return {
        ...state,
        view: action.view,
        mySeat: action.view.seat,
        plays: action.view.phase === "in_round" ? state.plays : [],
        passes: action.view.phase === "in_round" ? state.passes : [],
      };

    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    case "SET_RECENT_CARD":
      return {
        ...state,
        recentCardId: action.cardId,
      };

    case "ENQUEUE_PLAY":
      return {
        ...state,
        plays: [
          ...state.plays,
          { id: state.nextPlayId, seat: action.seat, card: action.card, auto: action.auto },
        ],
        nextPlayId: state.nextPlayId + 1,
      };

    case "CONSUME_PLAY":
      return {
        ...state,
        plays: state.plays.filter((p) => p.id !== action.id),
      };

    case "ENQUEUE_PASS":
      return {
        ...state,
        passes: [...state.passes, { id: state.nextPassId, seat: action.seat }],
        nextPassId: state.nextPassId + 1,
      };

    case "CONSUME_PASS":
      return {
        ...state,
        passes: state.passes.filter((p) => p.id !== action.id),
      };

    case "RESET":
      return {
        ...initialAppState,
        localName: state.localName,
      };

    default:
      return state;
  }
}

export function createToastFromEvent(
  event: GameEvent,
  lobby: LobbyMessage | null,
): Toast | null {
  const getPlayerName = (seat: Seat): string => {
    return lobby?.players.find((p) => p.seat === seat)?.name ?? `Seat ${seat + 1}`;
  };

  switch (event.type) {
    case "card_played": {
      const name = getPlayerName(event.seat);
      const cardStr = formatCard(event.card);
      const autoStr = event.auto ? " (automatic)" : "";
      return {
        id: `${Date.now()}-${Math.random()}`,
        message: `${name} played ${cardStr}${autoStr}`,
        createdAt: Date.now(),
      };
    }

    case "passed": {
      const name = getPlayerName(event.seat);
      return {
        id: `${Date.now()}-${Math.random()}`,
        message: `${name} has no playable card`,
        createdAt: Date.now(),
      };
    }

    case "round_won": {
      const name = getPlayerName(event.seat);
      return {
        id: `${Date.now()}-${Math.random()}`,
        message: `${name} won the round!`,
        createdAt: Date.now(),
      };
    }

    case "round_started":
    case "game_over":
      return null;
  }
}

export function getScreenName(state: AppState): ScreenName {
  if (!state.lobby && !state.view) {
    return "home";
  }
  if (!state.view) {
    return "lobby";
  }
  switch (state.view.phase) {
    case "in_round":
      return "table";
    case "round_over":
      return "round_over";
    case "game_over":
      return "game_over";
  }
}
