import type { Seat } from "@cardgame/engine";
import { hintLabel } from "../lib/hintLabel";

interface PlayerSeatProps {
  seat: Seat;
  name: string;
  cardCount: number;
  playableCount: number | null;
  isCurrentTurn: boolean;
  isDisconnected: boolean;
  positionLabel: string;
}

export function PlayerSeat({
  seat: _seat,
  name,
  cardCount,
  playableCount,
  isCurrentTurn,
  isDisconnected,
  positionLabel,
}: PlayerSeatProps) {
  // Keep the opponent stack small while retaining a visible card-count cue.
  const stackCount = Math.min(Math.max(cardCount, 0), 5);

  return (
    <div
      className={`theme-seat flex-1 min-w-0 max-w-[130px] p-2.5 flex flex-col justify-between ${
        isCurrentTurn
          ? "theme-turn"
          : ""
      }`}
    >
      {/* Top line: position label and offline badge */}
      <div className="flex items-center justify-between text-[10px] text-[var(--mut)] font-medium leading-tight">
        <span className="truncate">{positionLabel}</span>
        {isDisconnected && (
          <span className="text-[9px] text-[var(--rt)] px-1 py-0.2 rounded font-semibold uppercase tracking-wider">
            Bot
          </span>
        )}
      </div>

      {/* Middle line: Player Name */}
      <div
        className="font-bold text-sm text-[var(--tx)] truncate leading-tight my-0.5"
        title={name}
      >
        {name}
      </div>

      {/* Reserve one line so hints do not change the opponents row height. */}
      <div className="mt-0.5 h-4 flex items-center justify-end">
        {playableCount !== null && (
          <span
            aria-label={`${playableCount} cards playable as of their last turn`}
            className="theme-badge max-w-full truncate whitespace-nowrap leading-4"
          >
            {hintLabel(playableCount)}
          </span>
        )}
      </div>

      {/* Bottom line: Card count and mini stack of card backs */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-xs font-bold text-[var(--tx)] leading-tight">
          {cardCount} <span className="text-[10px] font-normal text-[var(--mut)]">{cardCount === 1 ? "cd" : "cds"}</span>
        </span>

        {/* Small stack of card backs */}
        <div className="relative h-5 w-[41px] flex items-center">
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
