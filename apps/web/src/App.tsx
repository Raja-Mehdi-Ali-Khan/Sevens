import { useEffect, useReducer, useRef, useState } from "react";
import type { CardId, GameEvent, PlayerView } from "@cardgame/engine";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { GameOverScreen } from "./components/GameOverScreen";
import { HomeScreen } from "./components/HomeScreen";
import { LobbyScreen } from "./components/LobbyScreen";
import { RoundSummaryScreen } from "./components/RoundSummaryScreen";
import { TableScreen } from "./components/TableScreen";
import { ToastContainer } from "./components/ToastContainer";
import {
  ErrorMessage,
  LobbyMessage,
  netClient,
} from "./net/client";
import {
  appReducer,
  createToastFromEvent,
  getScreenName,
  initialAppState,
} from "./state/gameState";

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [loading, setLoading] = useState(false);
  const lobbyRef = useRef<LobbyMessage | null>(null);

  // Keep ref up to date for event toasts
  lobbyRef.current = state.lobby;

  useEffect(() => {
    netClient.setCallbacks({
      onLobby: (lobby: LobbyMessage) => {
        dispatch({ type: "SET_LOBBY", lobby });
      },
      onView: (view: PlayerView) => {
        dispatch({ type: "SET_VIEW", view });
      },
      onEvent: (event: GameEvent) => {
        const toast = createToastFromEvent(event, lobbyRef.current);
        if (toast) {
          dispatch({ type: "ADD_TOAST", toast });
          setTimeout(() => {
            dispatch({ type: "REMOVE_TOAST", id: toast.id });
          }, 2500);
        }
      },
      onError: (error: ErrorMessage) => {
        dispatch({
          type: "SET_SERVER_ERROR",
          error: error.message || error.code || "Server error occurred",
        });
      },
      onStatusChange: (status, message) => {
        dispatch({ type: "SET_STATUS", status, message });
      },
      onLeave: () => {
        dispatch({ type: "RESET" });
      },
    });

    // Attempt automatic reconnection if token exists in sessionStorage
    const hasToken = netClient.getReconnectionToken() !== null;
    if (hasToken) {
      setLoading(true);
      void netClient
        .tryReconnect()
        .then((room) => {
          if (!room) {
            dispatch({
              type: "SET_SERVER_ERROR",
              error: "Reconnection expired or failed: room closed.",
            });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleCreateRoom = async (name: string) => {
    setLoading(true);
    dispatch({ type: "SET_SERVER_ERROR", error: null });
    dispatch({ type: "SET_LOCAL_NAME", name });
    try {
      await netClient.createRoom(name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create room";
      dispatch({ type: "SET_SERVER_ERROR", error: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (code: string, name: string) => {
    setLoading(true);
    dispatch({ type: "SET_SERVER_ERROR", error: null });
    dispatch({ type: "SET_LOCAL_NAME", name });
    try {
      await netClient.joinRoom(code, name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join room";
      dispatch({ type: "SET_SERVER_ERROR", error: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    netClient.sendStart();
  };

  const handlePlayCard = (cardId: CardId) => {
    netClient.sendPlay(cardId);
  };

  const handleLeaveRoom = async () => {
    await netClient.leave();
    dispatch({ type: "RESET" });
  };

  const screen = getScreenName(state);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      <ConnectionBanner
        status={state.connectionStatus}
        message={state.connectionMessage}
        serverError={state.serverError}
        onClearError={() => dispatch({ type: "SET_SERVER_ERROR", error: null })}
      />

      <ToastContainer
        toasts={state.toasts}
        onDismiss={(id) => dispatch({ type: "REMOVE_TOAST", id })}
      />

      {screen === "home" && (
        <HomeScreen
          initialName={state.localName}
          error={state.serverError}
          loading={loading}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {screen === "lobby" && state.lobby && (
        <LobbyScreen
          lobby={state.lobby}
          mySeat={state.mySeat}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {screen === "table" && state.view && (
        <TableScreen
          view={state.view}
          lobby={state.lobby}
          onPlayCard={handlePlayCard}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {screen === "round_over" && state.view && (
        <RoundSummaryScreen
          view={state.view}
          lobby={state.lobby}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {screen === "game_over" && state.view && (
        <GameOverScreen
          view={state.view}
          lobby={state.lobby}
          onBackToHome={handleLeaveRoom}
        />
      )}
    </div>
  );
}
