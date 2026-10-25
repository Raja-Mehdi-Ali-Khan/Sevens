import type { Seat } from "@cardgame/engine";
import { hintLabel } from "../lib/hintLabel";

interface PlayerSeatProps {
  seat: Seat;
  name: string;
  cardCount: number;
  playableCount: number | null;
  isCurrentTurn: boolean;
  isDisconnected: boolean;
}

export function PlayerSeat({
  seat: _seat,
  name,
  cardCount,
  playableCount,
  isCurrentTurn,
  isDisconnected,
}: PlayerSeatProps) {
  // Keep the opponent stack small while retaining a visible card-count cue.
  const stackCount = Math.min(Math.max(cardCount, 0), 5);

  return (
    <div
      className={`theme-seat flex-1 min-w-0 max-w-[130px] flex flex-col justify-between ${
        isCurrentTurn
          ? "theme-turn"
          : ""
      }`}
    >
      {/* Keep the seat focused on its player and live status. */}
      <div className="flex min-h-4 items-center justify-between text-[9px] text-[var(--mut)] font-medium leading-tight">
        <span className="truncate">{playableCount !== null ? hintLabel(playableCount) : ""}</span>
        {isDisconnected && (
          <span className="text-[9px] text-[var(--rt)] px-1 rounded font-semibold uppercase tracking-wider">
            Bot
          </span>
        )}
      </div>

      <div
        className="font-bold text-xs text-[var(--tx)] truncate leading-tight"
        title={name}
      >
        {name}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--mut)] leading-tight">
          {cardCount} <span className="text-[9px] font-normal text-[var(--mut)]">{cardCount === 1 ? "card" : "cards"}</span>
        </span>

        {/* Small stack of card backs */}
        <div className="table-mini-backs relative h-5 w-[41px] flex items-center">
          {Array.from({ length: stackCount }).map((_, i) => (
            <div
              key={i}
              className="theme-mini-back absolute top-0"
              style={{ left: `${i * 7}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
