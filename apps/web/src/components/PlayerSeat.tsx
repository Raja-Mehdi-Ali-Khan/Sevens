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
  seat: _seat,
  name,
  cardCount,
  isCurrentTurn,
  isDisconnected,
  positionLabel,
}: PlayerSeatProps) {
  // Visual mini card stack (1 to 3 mini cards)
  const stackCount = Math.min(Math.max(cardCount, 0), 3);

  return (
    <div
      className={`flex-1 min-w-0 max-w-[130px] rounded-lg p-1.5 sm:p-2 transition-all flex flex-col justify-between ${
        isCurrentTurn
          ? "bg-amber-50 border-2 border-amber-500 ring-2 ring-amber-400/40 shadow-sm"
          : "bg-white/95 border border-zinc-200 shadow-2xs"
      }`}
    >
      {/* Top line: position label and offline badge */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium leading-tight">
        <span className="truncate">{positionLabel}</span>
        {isDisconnected && (
          <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-semibold uppercase tracking-wider">
            Bot
          </span>
        )}
      </div>

      {/* Middle line: Player Name */}
      <div
        className="font-bold text-xs text-zinc-900 truncate leading-tight my-0.5"
        title={name}
      >
        {name}
      </div>

      {/* Bottom line: Card count and mini stack of card backs */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[11px] font-mono font-bold text-zinc-700 leading-tight">
          {cardCount} <span className="text-[10px] font-normal text-zinc-400">{cardCount === 1 ? "cd" : "cds"}</span>
        </span>

        {/* Small stack of card backs */}
        <div className="relative h-4 w-6 flex items-center">
          {Array.from({ length: stackCount }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 w-3 h-4 rounded-[2px] bg-blue-800 border border-blue-950 shadow-2xs"
              style={{ left: `${i * 3}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
