import type { Seat } from "@cardgame/engine";

interface PlayerSeatProps {
  seat: Seat;
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
  isDisconnected: boolean;
  positionLabel: string;
}

export function PlayerSeat({
  seat,
  name,
  cardCount,
  isCurrentTurn,
  isDisconnected,
  positionLabel,
}: PlayerSeatProps) {
  return (
    <div
      className={`rounded-lg p-2 sm:p-2.5 transition-all text-center max-w-[140px] sm:max-w-[170px] w-full ${
        isCurrentTurn
          ? "bg-amber-100/90 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/30"
          : "bg-white/90 border border-zinc-200 shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
        <span>Seat {seat + 1}</span>
        <span>{positionLabel}</span>
      </div>

      <div className="font-semibold text-xs sm:text-sm text-zinc-900 truncate" title={name}>
        {name}
      </div>

      <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
        <span className="font-medium text-zinc-700">{cardCount}</span>
        <span className="text-zinc-500 text-[11px]">{cardCount === 1 ? "card" : "cards"}</span>
      </div>

      {isCurrentTurn && (
        <div className="mt-1">
          <span className="inline-block text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Thinking
          </span>
        </div>
      )}

      {isDisconnected && (
        <div className="mt-1">
          <span className="inline-block text-[10px] bg-red-100 text-red-700 font-semibold px-1.5 py-0.5 rounded border border-red-200">
            Bot / Offline
          </span>
        </div>
      )}
    </div>
  );
}
