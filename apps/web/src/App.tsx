import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { CardId, GameEvent, PlayerView, Seat } from "@cardgame/engine";
import { AnimationLayer, type PendingTapRect } from "./components/AnimationLayer";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { GameOverScreen } from "./components/GameOverScreen";
import { HomeScreen } from "./components/HomeScreen";
import { LobbyScreen } from "./components/LobbyScreen";
import { RoundSummaryScreen } from "./components/RoundSummaryScreen";
import { TableScreen } from "./components/TableScreen";
import { ToastContainer } from "./components/ToastContainer";
import { Watermark } from "./components/Watermark";
import { tablePreviewLobby, tablePreviewView } from "./dev/previewFixtures";
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
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        {import.meta.env.DEV &&
        new URLSearchParams(window.location.search).get("preview") === "table" ? (
          <PreviewTableApp />
        ) : (
          <ConnectedApp />
        )}
      </LazyMotion>
    </MotionConfig>
  );
}

function PreviewTableApp() {
  const shouldReduceMotion = useReducedMotion();
  const showControls =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("controls") === "1";

  const [state, dispatch] = useReducer(appReducer, {
    ...initialAppState,
    mySeat: tablePreviewView.seat,
    lobby: tablePreviewLobby,
    view: tablePreviewView,
    recentCardId: "8H",
  });
  const [previewKey, setPreviewKey] = useState(0);
  const pendingTapRef = useRef<PendingTapRect | null>(null);

  const consumePlay = useCallback((id: number) => {
    dispatch({ type: "CONSUME_PLAY", id });
  }, []);

  const consumePass = useCallback((id: number) => {
    dispatch({ type: "CONSUME_PASS", id });
  }, []);

  const triggerFakePlay = (seat: Seat, suit: "H" | "D" | "C" | "S", rank: number, auto: boolean) => {
    const view = state.view ?? tablePreviewView;
    const existing = view.table[suit];
    const nextRun = existing
      ? {
          low: Math.min(existing.low, rank) as typeof existing.low,
          high: Math.max(existing.high, rank) as typeof existing.high,
        }
      : { low: rank as 7, high: rank as 7 };
    const cardId = `${rank}${suit}` as CardId;

    dispatch({
      type: "SET_VIEW",
      view: {
        ...view,
        table: { ...view.table, [suit]: nextRun },
        hand: seat === 0 ? view.hand.filter((c) => `${c.rank}${c.suit}` !== cardId) : view.hand,
      },
    });
    dispatch({ type: "SET_RECENT_CARD", cardId });
    dispatch({ type: "ENQUEUE_PLAY", seat, card: { suit, rank: rank as 7 }, auto });
  };

  const triggerPass = (seat: Seat) => {
    dispatch({ type: "ENQUEUE_PASS", seat });
    const toast = createToastFromEvent({ type: "passed", seat }, state.lobby);
    if (toast) {
      dispatch({ type: "ADD_TOAST", toast });
      setTimeout(() => dispatch({ type: "REMOVE_TOAST", id: toast.id }), 2500);
    }
  };

  const triggerNewRoundDeal = () => {
    const view = state.view ?? tablePreviewView;
    dispatch({
      type: "SET_VIEW",
      view: {
        ...tablePreviewView,
        round: view.round >= 7 ? 1 : view.round + 1,
        table: { H: null, D: null, C: null, S: null },
      },
    });
    dispatch({ type: "SET_RECENT_CARD", cardId: null });
  };

  return (
    <div className="app-shell min-h-[100dvh] flex justify-center antialiased overflow-x-hidden">
      <Watermark />
      {showControls && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex flex-wrap gap-1 bg-black/85 p-1.5 text-[11px] text-white">
          <button
            type="button"
            onClick={() => triggerFakePlay(0, "H", 4, false)}
            className="rounded border border-white/25 px-2 py-1"
          >
            I play a card
          </button>
          <button
            type="button"
            onClick={() => triggerFakePlay(1, "H", 10, false)}
            className="rounded border border-white/25 px-2 py-1"
          >
            Seat 1 plays
          </button>
          <button
            type="button"
            onClick={() => triggerFakePlay(2, "D", 9, false)}
            className="rounded border border-white/25 px-2 py-1"
          >
            Seat 2 plays
          </button>
          <button
            type="button"
            onClick={() => triggerFakePlay(3, "S", 8, false)}
            className="rounded border border-white/25 px-2 py-1"
          >
            Seat 3 plays
          </button>
          <button
            type="button"
            onClick={() => triggerPass(2)}
            className="rounded border border-white/25 px-2 py-1"
          >
            Seat 2 passes
          </button>
          <button
            type="button"
            onClick={triggerNewRoundDeal}
            className="rounded border border-white/25 px-2 py-1"
          >
            New round deal
          </button>
          <button
            type="button"
            onClick={() => setPreviewKey((k) => k + 1)}
            className="rounded border border-white/25 px-2 py-1"
          >
            Screen transition
          </button>
        </div>
      )}
      <div className="app-content table-app-content w-full max-w-[480px] sm:max-w-[720px] h-[100dvh] min-h-0 relative flex flex-col overflow-hidden">
        <ToastContainer
          toasts={state.toasts}
          onDismiss={(id) => dispatch({ type: "REMOVE_TOAST", id })}
        />
        <AnimationLayer
          plays={state.plays}
          mySeat={state.mySeat}
          pendingTapRef={pendingTapRef}
          onConsumePlay={consumePlay}
        />
        <AnimatePresence mode="wait">
          <m.div
            key={`preview-${previewKey}`}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: shouldReduceMotion ? 0.12 : 0.18, ease: "easeOut" },
            }}
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0.1 } }
                : { opacity: 0, y: -8, transition: { duration: 0.12, ease: "easeIn" } }
            }
            className="w-full h-full min-h-0 flex flex-col"
          >
            <TableScreen
              view={state.view ?? tablePreviewView}
              lobby={state.lobby}
              recentCardId={state.recentCardId}
              passes={state.passes}
              onConsumePass={consumePass}
              onPlayCard={(cardId, rect) => {
                if (rect) pendingTapRef.current = { cardId, rect };
                const rank = Number.parseInt(cardId.slice(0, -1), 10);
                const suit = cardId.slice(-1) as "H" | "D" | "C" | "S";
                triggerFakePlay(0, suit, rank, false);
              }}
              onLeaveRoom={() => {}}
            />
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ConnectedApp() {
  const shouldReduceMotion = useReducedMotion();
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [loading, setLoading] = useState(false);
  const lobbyRef = useRef<LobbyMessage | null>(null);
  const screenRef = useRef(getScreenName(state));
  const pendingTapRef = useRef<PendingTapRect | null>(null);

  const screen = getScreenName(state);
  lobbyRef.current = state.lobby;
  screenRef.current = screen;

  const consumePlay = useCallback((id: number) => {
    dispatch({ type: "CONSUME_PLAY", id });
  }, []);

  const consumePass = useCallback((id: number) => {
    dispatch({ type: "CONSUME_PASS", id });
  }, []);

  useEffect(() => {
    netClient.setCallbacks({
      onLobby: (lobby: LobbyMessage) => {
        dispatch({ type: "SET_LOBBY", lobby });
      },
      onView: (view: PlayerView) => {
        dispatch({ type: "SET_VIEW", view });
      },
      onEvent: (event: GameEvent) => {
        if (event.type === "card_played") {
          const cardId = `${event.card.rank}${event.card.suit}` as CardId;
          dispatch({ type: "SET_RECENT_CARD", cardId });
          if (screenRef.current === "table") {
            dispatch({
              type: "ENQUEUE_PLAY",
              seat: event.seat,
              card: event.card,
              auto: event.auto,
            });
          }
        } else if (event.type === "passed") {
          if (screenRef.current === "table") {
            dispatch({ type: "ENQUEUE_PASS", seat: event.seat });
          }
        } else if (event.type === "round_started") {
          dispatch({ type: "SET_RECENT_CARD", cardId: null });
        }

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

  // Listen for visibility changes to recover dropped mobile connections
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const hasToken = netClient.getReconnectionToken() !== null;
        if (hasToken && (state.connectionStatus === "disconnected" || state.connectionStatus === "idle")) {
          void netClient.tryReconnect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.connectionStatus]);

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

  const handlePlayCard = (cardId: CardId, rect?: DOMRect) => {
    if (rect) {
      pendingTapRef.current = {
        cardId,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      };
    }
    netClient.sendPlay(cardId);
  };

  const handleLeaveRoom = () => {
    dispatch({ type: "RESET" });
    void netClient.leave();
  };

  const screenMotionProps = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0.12 : 0.18, ease: "easeOut" as const },
    },
    exit: shouldReduceMotion
      ? { opacity: 0, transition: { duration: 0.1 } }
      : { opacity: 0, y: -8, transition: { duration: 0.12, ease: "easeIn" as const } },
  };

  return (
    <div className="app-shell min-h-[100dvh] flex justify-center antialiased overflow-x-hidden">
      {screen !== "home" && <Watermark />}
      <div
        className={`app-content w-full relative flex flex-col ${
          screen === "table"
            ? "table-app-content max-w-[480px] sm:max-w-[720px] h-[100dvh] min-h-0 overflow-hidden"
            : `max-w-[480px] min-h-[100dvh] ${screen === "home" ? "overflow-visible" : "overflow-hidden"}`
        }`}
      >
        {screen !== "home" && (
          <ConnectionBanner
            status={state.connectionStatus}
            message={state.connectionMessage}
            serverError={state.serverError}
            onClearError={() => dispatch({ type: "SET_SERVER_ERROR", error: null })}
          />
        )}

        <ToastContainer
          toasts={state.toasts}
          onDismiss={(id) => dispatch({ type: "REMOVE_TOAST", id })}
        />

        {screen === "table" && (
          <AnimationLayer
            plays={state.plays}
            mySeat={state.mySeat}
            pendingTapRef={pendingTapRef}
            onConsumePlay={consumePlay}
          />
        )}

        <AnimatePresence mode="wait">
          {screen === "home" && (
            <m.div key="home" {...screenMotionProps} className="w-full flex-1 flex flex-col">
              <HomeScreen
                initialName={state.localName}
                error={state.serverError}
                loading={loading}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
              />
            </m.div>
          )}

          {screen === "lobby" && state.lobby && (
            <m.div key="lobby" {...screenMotionProps} className="w-full flex-1 flex flex-col">
              <LobbyScreen
                lobby={state.lobby}
                mySeat={state.mySeat}
                onStartGame={handleStartGame}
                onLeaveRoom={handleLeaveRoom}
              />
            </m.div>
          )}

          {screen === "table" && state.view && (
            <m.div key="table" {...screenMotionProps} className="w-full h-full min-h-0 flex flex-col">
              <TableScreen
                view={state.view}
                lobby={state.lobby}
                recentCardId={state.recentCardId}
                passes={state.passes}
                onConsumePass={consumePass}
                onPlayCard={handlePlayCard}
                onLeaveRoom={handleLeaveRoom}
              />
            </m.div>
          )}

          {screen === "round_over" && state.view && (
            <m.div key="round_over" {...screenMotionProps} className="w-full flex-1 flex flex-col">
              <RoundSummaryScreen
                view={state.view}
                lobby={state.lobby}
                onLeaveRoom={handleLeaveRoom}
              />
            </m.div>
          )}

          {screen === "game_over" && state.view && (
            <m.div key="game_over" {...screenMotionProps} className="w-full flex-1 flex flex-col">
              <GameOverScreen
                view={state.view}
                lobby={state.lobby}
                onBackToHome={handleLeaveRoom}
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
