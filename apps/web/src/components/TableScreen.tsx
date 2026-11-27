import { useEffect, useRef, useState } from "react";
import type { CardId, PlayerView, Seat } from "@cardgame/engine";
import { shouldPlayDeal } from "../lib/deal";
import { getOpponents } from "../lib/layout";
import type { LobbyMessage } from "../net/client";
import type { PassPulseItem } from "../state/gameState";
import { MyHand } from "./MyHand";
import { PlayerSeat } from "./PlayerSeat";
import { SuitTable } from "./SuitTable";

interface TableScreenProps {
  view: PlayerView;
  lobby: LobbyMessage | null;
  recentCardId?: CardId | null;
  passes?: PassPulseItem[];
  onConsumePass?: (id: number) => void;
  onPlayCard: (cardId: CardId, rect?: DOMRect) => void;
  onLeaveRoom: () => void;
}

export function TableScreen({
  view,
  lobby,
  recentCardId,
  passes = [],
  onConsumePass,
  onPlayCard,
  onLeaveRoom,
}: TableScreenProps) {
  const [scoresExpanded, setScoresExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);
  const [passNonces, setPassNonces] = useState<Record<number, number>>({});
  const tableScreenRef = useRef<HTMLDivElement>(null);
  const lastAnimatedRoundRef = useRef<number | null>(null);
  const dealVersionRef = useRef(0);
  const mySeat = view.seat;
  const opponents = getOpponents(mySeat);

  const tableIsEmpty =
    view.table.H === null &&
    view.table.D === null &&
    view.table.C === null &&
    view.table.S === null;

  if (shouldPlayDeal(lastAnimatedRoundRef.current, view.round, tableIsEmpty)) {
    dealVersionRef.current += 1;
    lastAnimatedRoundRef.current = view.round;
  } else if (lastAnimatedRoundRef.current !== view.round) {
    lastAnimatedRoundRef.current = view.round;
  }

  useEffect(() => {
    if (passes.length === 0) return;
    setPassNonces((prev) => {
      const next = { ...prev };
      for (const item of passes) {
        next[item.seat] = (next[item.seat] ?? 0) + 1;
      }
      return next;
    });
    for (const item of passes) {
      onConsumePass?.(item.id);
    }
  }, [passes, onConsumePass]);

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

  const isPlayerBot = (seat: Seat): boolean => {
    return lobby?.players.find((p) => p.seat === seat)?.isBot === true;
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
      <header className="table-section-fixed theme-panel relative z-30 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Round Indicator */}
          <div
            aria-label={`Round ${view.round} of 7`}
            className="theme-panel-soft flex h-11 shrink-0 items-center justify-center rounded-lg border px-2.5 text-sm font-bold tracking-tight text-[var(--acc)]"
          >
            R{view.round}/7
          </div>

          {/* Compact Score Strip (tap to expand) */}
          <button
            type="button"
            onClick={() => setScoresExpanded((prev) => !prev)}
            aria-expanded={scoresExpanded}
            className="theme-score-pill flex min-w-0 flex-1 items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <span className="truncate whitespace-nowrap">You: {myTotal} pts</span>
            <span className="text-[10px] ">{scoresExpanded ? "▲" : "▼"}</span>
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={onLeaveRoom}
            className="theme-button-secondary flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-xs cursor-pointer touch-manipulation"
            aria-label="Leave room"
          >
            Leave
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="theme-button-secondary table-fullscreen-button min-h-[44px] min-w-[44px] rounded-lg p-0 items-center justify-center cursor-pointer touch-manipulation"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="table-fullscreen-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isFullscreen ? (
                <path d="M19 5 13 11m0-4v4h4M5 19l6-6m-4 0h4v4" />
              ) : (
                <path d="M12 12 19 5m-5 0h5v5M12 12 5 19m0-5v5h5" />
              )}
            </svg>
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
                  <span className="flex items-center gap-1 min-w-0">
                    <span className="truncate max-w-[90px]">{name}</span>
                    {isPlayerBot(seat) && <span className="theme-bot-tag">BOT</span>}
                  </span>
                  <span className="">{total} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* (b) Large Oval Table with Players Seated On Boundary */}
      <main className="table-board-region relative">
        <div className="w-full flex-1 min-h-0 flex items-center justify-center py-6 px-2 sm:py-7 sm:px-10">
          <div className="theme-oval-table relative w-full max-w-[460px] sm:max-w-[580px] mx-auto">
            {/* Top seat centered on top oval boundary */}
            {opponents.find((o) => o.position === "top") && (() => {
              const seat = opponents.find((o) => o.position === "top")!.seat;
              return (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <PlayerSeat
                    seat={seat}
                    name={getPlayerName(seat)}
                    cardCount={view.handCounts[seat] ?? 0}
                    playableCount={view.playableCounts[seat] ?? null}
                    isCurrentTurn={view.currentSeat === seat}
                    isBot={isPlayerBot(seat)}
                    passNonce={passNonces[seat] ?? 0}
                    dealVersion={dealVersionRef.current}
                  />
                </div>
              );
            })()}

            {/* Left seat centered on left oval boundary */}
            {opponents.find((o) => o.position === "left") && (() => {
              const seat = opponents.find((o) => o.position === "left")!.seat;
              return (
                <div className="absolute left-0 top-1/2 -translate-x-1 sm:-translate-x-1/2 -translate-y-1/2 z-20">
                  <PlayerSeat
                    seat={seat}
                    name={getPlayerName(seat)}
                    cardCount={view.handCounts[seat] ?? 0}
                    playableCount={view.playableCounts[seat] ?? null}
                    isCurrentTurn={view.currentSeat === seat}
                    isBot={isPlayerBot(seat)}
                    passNonce={passNonces[seat] ?? 0}
                    dealVersion={dealVersionRef.current}
                  />
                </div>
              );
            })()}

            {/* Right seat centered on right oval boundary */}
            {opponents.find((o) => o.position === "right") && (() => {
              const seat = opponents.find((o) => o.position === "right")!.seat;
              return (
                <div className="absolute right-0 top-1/2 translate-x-1 sm:translate-x-1/2 -translate-y-1/2 z-20">
                  <PlayerSeat
                    seat={seat}
                    name={getPlayerName(seat)}
                    cardCount={view.handCounts[seat] ?? 0}
                    playableCount={view.playableCounts[seat] ?? null}
                    isCurrentTurn={view.currentSeat === seat}
                    isBot={isPlayerBot(seat)}
                    passNonce={passNonces[seat] ?? 0}
                    dealVersion={dealVersionRef.current}
                  />
                </div>
              );
            })()}

            <SuitTable table={view.table} recentCardId={recentCardId} />
          </div>
        </div>
      </main>

      {/* (d) Status Line (just above hand) */}
      <div className="table-section-fixed table-status text-center">
        <div
          className={`inline-block rounded-full px-3.5 py-1 text-sm sm:text-base font-bold text-center leading-tight border ${
            isMyChoice
              ? "bg-[var(--acc)] text-[var(--acc2t)] border-[var(--acc)] shadow-[var(--glow)]"
              : "theme-panel text-[var(--acc)] border-[var(--edge)]"
          }`}
        >
          {getStatusLine()}
        </div>
      </div>

      {/* (e) My Hand (Bottom Thumb Zone) */}
      <footer className="table-hand">
        <MyHand
          hand={view.hand}
          legalCards={view.legalCards}
          isMyChoice={isMyChoice}
          dealVersion={dealVersionRef.current}
          onPlayCard={onPlayCard}
        />
      </footer>
    </div>
  );
}
