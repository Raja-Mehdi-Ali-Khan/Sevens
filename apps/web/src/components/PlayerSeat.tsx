import { hintLabel } from "../lib/hintLabel";

interface PlayerSeatProps {
  name: string;
  cardCount: number;
  playableCount: number | null;
  isCurrentTurn: boolean;
  isDisconnected: boolean;
}

export function PlayerSeat({
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
      className={`theme-seat flex-1 min-w-0 max-w-[150px] flex flex-col justify-between ${
        isCurrentTurn
          ? "theme-turn"
          : ""
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-1">
        <span className="min-w-0 truncate text-sm font-bold leading-tight text-[var(--tx)]" title={name}>
          {name}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {playableCount !== null && (
            <span className="theme-seat-hint" aria-label={`${playableCount} playable cards`}>
              {hintLabel(playableCount)}
            </span>
          )}
          {isDisconnected && (
            <span className="theme-seat-bot">Bot</span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold leading-tight text-[var(--mut)]">
          {cardCount} <span className="text-[10px] font-normal">{cardCount === 1 ? "card" : "cards"}</span>
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
