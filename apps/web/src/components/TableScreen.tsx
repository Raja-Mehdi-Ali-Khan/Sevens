import type { CardId, PlayerView, Seat } from "@cardgame/engine";
import { getSeatLayout } from "../lib/layout";
import type { LobbyMessage } from "../net/client";
import { MyHand } from "./MyHand";
import { PlayerSeat } from "./PlayerSeat";
import { SuitTable } from "./SuitTable";

interface TableScreenProps {
  view: PlayerView;
  lobby: LobbyMessage | null;
  onPlayCard: (cardId: CardId) => void;
  onLeaveRoom: () => void;
}

export function TableScreen({
  view,
  lobby,
  onPlayCard,
  onLeaveRoom,
}: TableScreenProps) {
  const mySeat = view.seat;
  const layout = getSeatLayout(mySeat);

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

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-between p-2 sm:p-4">
      {/* Top Header: Round info, running totals, leave button */}
      <header className="bg-white border border-zinc-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-xs mb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-base sm:text-lg font-bold text-zinc-900">
              Round {view.round} / 7
            </span>
            <span className="text-xs bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded font-mono font-medium text-zinc-600">
              Room {lobby?.code ?? ""}
            </span>
          </div>

          {/* Running Totals */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            {([0, 1, 2, 3] as Seat[]).map((seat) => {
              const name = getPlayerName(seat);
              const isLocal = seat === mySeat;
              return (
                <div
                  key={seat}
                  className={`px-2 py-1 rounded ${
                    isLocal ? "bg-blue-50 font-semibold text-blue-900" : "text-zinc-600"
                  }`}
                >
                  <span className="truncate max-w-[60px] sm:max-w-[80px] inline-block align-bottom">
                    {name}
                  </span>
                  : <span className="font-mono">{view.totals[seat] ?? 0}</span> pts
                </div>
              );
            })}
          </div>

          <button
            onClick={onLeaveRoom}
            className="text-xs text-zinc-400 hover:text-red-600 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main Table Area */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto space-y-2 sm:space-y-4 my-auto">
        {/* Top Opponent (+2) */}
        <div className="flex justify-center">
          <PlayerSeat
            seat={layout.top}
            name={getPlayerName(layout.top)}
            cardCount={view.handCounts[layout.top] ?? 0}
            isCurrentTurn={view.currentSeat === layout.top}
            isDisconnected={isPlayerDisconnected(layout.top)}
            positionLabel="Across (+2)"
          />
        </div>

        {/* Center Row: Left Opponent (+3), Suit Table, Right Opponent (+1) */}
        <div className="flex items-center justify-between gap-1 sm:gap-4">
          {/* Left Opponent (+3) */}
          <div className="flex-shrink-0">
            <PlayerSeat
              seat={layout.left}
              name={getPlayerName(layout.left)}
              cardCount={view.handCounts[layout.left] ?? 0}
              isCurrentTurn={view.currentSeat === layout.left}
              isDisconnected={isPlayerDisconnected(layout.left)}
              positionLabel="Left (+3)"
            />
          </div>

          {/* Centre Suit Rows */}
          <div className="flex-1 min-w-0">
            <SuitTable table={view.table} />
          </div>

          {/* Right Opponent (+1) */}
          <div className="flex-shrink-0">
            <PlayerSeat
              seat={layout.right}
              name={getPlayerName(layout.right)}
              cardCount={view.handCounts[layout.right] ?? 0}
              isCurrentTurn={view.currentSeat === layout.right}
              isDisconnected={isPlayerDisconnected(layout.right)}
              positionLabel="Right (+1)"
            />
          </div>
        </div>

        {/* Status Line */}
        <div className="text-center py-1">
          <div
            className={`inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-xs ${
              isMyChoice
                ? "bg-blue-600 text-white animate-bounce"
                : view.turnPlan === "auto_play" || view.turnPlan === "auto_pass"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-white text-zinc-700 border border-zinc-200"
            }`}
          >
            {getStatusLine()}
          </div>
        </div>
      </main>

      {/* Bottom Area: Local Player Hand */}
      <footer className="mt-2 bg-white border border-zinc-200 rounded-xl p-2 sm:p-4 shadow-sm">
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
