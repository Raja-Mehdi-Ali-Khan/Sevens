import { useEffect, useState } from "react";
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

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-zinc-100 flex flex-col justify-between overflow-hidden safe-top safe-bottom p-2 select-none">
      {/* (a) Compact Header */}
      <header className="relative bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 shadow-2xs z-30 shrink-0">
        <div className="flex items-center justify-between gap-1">
          {/* Round Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-zinc-900 leading-none">
              Round {view.round}/7
            </span>
            <span className="text-[10px] bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 rounded font-mono font-medium text-zinc-600 leading-none">
              {lobby?.code ?? ""}
            </span>
          </div>

          {/* Compact Score Strip (tap to expand) */}
          <button
            type="button"
            onClick={() => setScoresExpanded((prev) => !prev)}
            aria-expanded={scoresExpanded}
            className="flex items-center gap-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer touch-manipulation min-h-[36px] transition-colors"
          >
            <span>You: {myTotal} pts</span>
            <span className="text-[10px] font-mono">{scoresExpanded ? "▲" : "▼"}</span>
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={onLeaveRoom}
            className="min-h-[44px] min-w-[44px] -mr-1 flex items-center justify-center text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer touch-manipulation"
            aria-label="Leave room"
          >
            Leave
          </button>
        </div>

        {/* Inline Expanded Scores Panel */}
        {scoresExpanded && (
          <div className="mt-2 pt-2 border-t border-zinc-100 grid grid-cols-2 gap-1.5 text-xs">
            {allSeats.map((seat) => {
              const name = getPlayerName(seat);
              const isLocal = seat === mySeat;
              const total = view.totals[seat] ?? 0;
              return (
                <div
                  key={seat}
                  className={`p-1.5 rounded flex items-center justify-between ${
                    isLocal ? "bg-blue-100/70 font-bold text-blue-950" : "bg-zinc-50 text-zinc-700"
                  }`}
                >
                  <span className="truncate max-w-[90px]">{name}</span>
                  <span className="font-mono">{total} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* (b) Opponents Row: ONE row of three compact chips (Left, Across/Top, Right) */}
      <section className="mt-1 flex items-stretch justify-between gap-1.5 shrink-0 px-0.5">
        {opponents.map(({ seat, position }) => {
          const positionLabel =
            position === "left" ? "Left (+3)" : position === "top" ? "Across (+2)" : "Right (+1)";
          return (
            <PlayerSeat
              key={seat}
              seat={seat}
              name={getPlayerName(seat)}
              cardCount={view.handCounts[seat] ?? 0}
              playableCount={view.playableCounts[seat] ?? null}
              isCurrentTurn={view.currentSeat === seat}
              isDisconnected={isPlayerDisconnected(seat)}
              positionLabel={positionLabel}
            />
          );
        })}
      </section>

      {/* (c) The Suit Table */}
      <main className="my-auto py-1 flex items-center justify-center min-h-0 shrink">
        <SuitTable table={view.table} recentCardId={recentCardId} />
      </main>

      {/* (d) Status Line (just above hand) */}
      <div className="text-center py-0.5 shrink-0">
        <div
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-2xs leading-tight transition-all ${
            isMyChoice
              ? "bg-blue-600 text-white shadow-blue-400/30"
              : view.turnPlan === "auto_play" || view.turnPlan === "auto_pass"
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : "bg-white text-zinc-700 border border-zinc-200"
          }`}
        >
          {getStatusLine()}
        </div>
      </div>

      {/* (e) My Hand (Bottom Thumb Zone) */}
      <footer className="shrink-0 pb-1">
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
