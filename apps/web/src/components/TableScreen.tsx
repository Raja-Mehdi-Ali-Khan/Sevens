import { useEffect, useRef, useState } from "react";
import type { CardId, PlayerView, Seat } from "@cardgame/engine";
import { getOpponents } from "../lib/layout";
import type { LobbyMessage } from "../net/client";
import { MyHand } from "./MyHand";
import { PlayerSeat } from "./PlayerSeat";
import { SuitTable } from "./SuitTable";

interface TableScreenProps {
  view: PlayerView;
  lobby: LobbyMessage | null;
  recentCardId?: CardId | null;
  onPlayCard: (cardId: CardId) => void;
  onLeaveRoom: () => void;
}

export function TableScreen({
  view,
  lobby,
  recentCardId,
  onPlayCard,
  onLeaveRoom,
}: TableScreenProps) {
  const [scoresExpanded, setScoresExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);
  const tableScreenRef = useRef<HTMLDivElement>(null);
  const mySeat = view.seat;
  const opponents = getOpponents(mySeat);

  // Screen Wake Lock while table screen is active
  useEffect(() => {
    let wakeLock: any = null;
    const requestLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // Silently ignore wake lock rejections
      }
    };

    void requestLock();

    return () => {
      if (wakeLock && typeof wakeLock.release === "function") {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  const getPlayerName = (seat: Seat): string => {
    return lobby?.players.find((p) => p.seat === seat)?.name ?? `Seat ${seat + 1}`;
  };

  const isPlayerDisconnected = (seat: Seat): boolean => {
    const player = lobby?.players.find((p) => p.seat === seat);
    return player !== undefined && !player.connected;
  };

  const currentSeatName = getPlayerName(view.currentSeat);

  const getStatusLine = (): string => {
    switch (view.turnPlan) {
      case "await_choice":
        return "Your turn: pick a card";
      case "waiting":
        return `${currentSeatName}'s turn`;
      case "auto_play":
        return "Only one playable card, playing automatically";
      case "auto_pass":
        return "You have no playable card, skipping";
    }
  };

  const isMyChoice = view.turnPlan === "await_choice" && view.currentSeat === mySeat;
  const myTotal = view.totals[mySeat] ?? 0;
  const allSeats: Seat[] = [0, 1, 2, 3];

  useEffect(() => {
    const syncFullscreenState = () => {
      const active = document.fullscreenElement === tableScreenRef.current;
      setIsFullscreen(active);
      if (active) setFullscreenMessage(null);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      const screen = tableScreenRef.current;
      if (!screen?.requestFullscreen) {
        setFullscreenMessage("Fullscreen isn't supported by this browser. Add the game to your Home Screen to hide browser controls.");
        return;
      }

      await screen.requestFullscreen({ navigationUI: "hide" });
    } catch {
      setFullscreenMessage("Fullscreen couldn't start. Try adding the game to your Home Screen for an app-like view.");
    }
  };

  return (
    <div ref={tableScreenRef} className="table-screen bg-transparent flex flex-col overflow-hidden select-none">
      {/* (a) Compact Header */}
      <header className="table-section-fixed theme-panel relative rounded-xl px-2.5 py-1.5 z-30">
        <div className="flex items-center justify-between gap-1">
          {/* Round Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] uppercase tracking-[3px] font-bold text-[var(--tx)] leading-none">
              ROUND {view.round} / 7
            </span>
            <span className="text-[10px] bg-transparent border border-[var(--edge)] px-1.5 py-0.5 rounded  font-medium text-[var(--mut)] leading-none">
              {lobby?.code ?? ""}
            </span>
          </div>

          {/* Compact Score Strip (tap to expand) */}
          <button
            type="button"
            onClick={() => setScoresExpanded((prev) => !prev)}
            aria-expanded={scoresExpanded}
            className="theme-score-pill flex items-center gap-1 cursor-pointer touch-manipulation"
          >
            <span>You: {myTotal} pts</span>
            <span className="text-[10px] ">{scoresExpanded ? "▲" : "▼"}</span>
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={onLeaveRoom}
            className="theme-button-secondary min-h-[44px] min-w-[44px] -mr-1 p-0 flex items-center justify-center text-xs cursor-pointer touch-manipulation"
            aria-label="Leave room"
          >
            Leave
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="theme-button-secondary table-fullscreen-button min-h-[36px] min-w-[36px] p-0 items-center justify-center text-lg cursor-pointer touch-manipulation"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? "Exit" : "Full"}
          </button>
        </div>

        {fullscreenMessage && (
          <div role="status" className="mt-2 rounded-lg border border-[var(--edge)] bg-[var(--chip)] px-2 py-1.5 text-xs text-[var(--mut)]">
            {fullscreenMessage}
          </div>
        )}

        {/* Inline Expanded Scores Panel */}
        {scoresExpanded && (
          <div className="mt-2 pt-2 border-t border-[var(--edge)] grid grid-cols-2 gap-1.5 text-xs">
            {allSeats.map((seat) => {
              const name = getPlayerName(seat);
              const isLocal = seat === mySeat;
              const total = view.totals[seat] ?? 0;
              return (
                <div
                  key={seat}
                  className={`p-1.5 rounded flex items-center justify-between ${
                    isLocal ? "theme-turn font-bold text-[var(--tx)]" : "theme-panel-soft text-[var(--tx)]"
                  }`}
                >
                  <span className="truncate max-w-[90px]">{name}</span>
                  <span className="">{total} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* (b) Opponents Row: ONE row of three compact chips (Left, Across/Top, Right) */}
      <section className="table-section-fixed table-opponents flex items-stretch justify-between gap-1.5 px-0.5">
        {opponents.map(({ seat }) => {
          return (
            <PlayerSeat
              key={seat}
              seat={seat}
              name={getPlayerName(seat)}
              cardCount={view.handCounts[seat] ?? 0}
              playableCount={view.playableCounts[seat] ?? null}
              isCurrentTurn={view.currentSeat === seat}
              isDisconnected={isPlayerDisconnected(seat)}
            />
          );
        })}
      </section>

      {/* (c) The Suit Table */}
      <main className="table-board-region">
        <SuitTable table={view.table} recentCardId={recentCardId} />
      </main>

      {/* (d) Status Line (just above hand) */}
      <div className="table-section-fixed table-status text-center">
        <div className="inline-block rounded-full px-3 py-1 text-base font-bold text-center leading-tight theme-panel text-[var(--acc)]">
          {getStatusLine()}
        </div>
      </div>

      {/* (e) My Hand (Bottom Thumb Zone) */}
      <footer className="table-hand">
        <MyHand
          hand={view.hand}
          legalCards={view.legalCards}
          isMyChoice={isMyChoice}
          onPlayCard={onPlayCard}
        />
      </footer>
    </div>
  );
}
