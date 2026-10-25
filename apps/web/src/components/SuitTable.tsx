import type { CardId, Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";
import { PlayingCard } from "./PlayingCard";

interface SuitTableProps {
  table: TableState;
  recentCardId?: CardId | null;
}

export function SuitTable({ table, recentCardId }: SuitTableProps) {
  // Preserve the existing 372px stacked-card layout across all 13 ranks.
  const step = 23.17;

  return (
    <div className="theme-board w-full max-w-[440px] mx-auto">
      {/* 4 vertical suit columns with tight gaps */}
      <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "theme-table-header-red" : "";

          return (
            <div
              key={suit}
              className="flex min-w-0 flex-col items-center rounded-xl p-0.5"
            >
              {/* Suit Header */}
              <div
                className={`theme-table-header w-full border-b border-[var(--edge)] mb-1 py-0.5 text-center select-none flex items-center justify-center gap-1 ${suitColor}`}
                aria-label={`Suit ${suit}`}
              >
                <span>{formatSuit(suit)}</span>
              </div>

              {/* 13-rank tall stacked card area */}
              <div
                className="relative w-full h-[372px] flex justify-center"
                aria-label={`Played cards for ${suit}`}
              >
                {RANKS.map((rank: Rank) => {
                  const id = `${rank}${suit}` as CardId;
                  const isFilled = run !== null && rank >= run.low && rank <= run.high;
                  const isRecent = recentCardId === id;
                  const isSeven = rank === 7;
                  const topOffset = (rank - 1) * step;

                  if (isFilled) {
                    return (
                      <div
                        key={id}
                        className="absolute left-1/2 -translate-x-1/2  "
                        style={{
                          top: `${topOffset}px`,
                          zIndex: isRecent ? 50 : 10 + rank,
                        }}
                      >
                        <PlayingCard
                          cardId={id}
                          size="table"
                          isRecent={isRecent}
                        />
                      </div>
                    );
                  }

                  // If suit has not been opened yet, show prominent foundation target card at rank 7
                  if (run === null && isSeven) {
                    return (
                      <div
                        key={id}
                        className="theme-open-slot absolute left-1/2 -translate-x-1/2 w-[66px] h-[94px] sm:w-[74px] sm:h-[106px] select-none"
                        style={{
                          top: `${topOffset}px`,
                          zIndex: 5,
                        }}
                        aria-label={`Play 7 of ${suit} here to open suit`}
                      >
                        <span className="text-sm font-bold leading-none">7</span>
                        <span className={`text-sm font-bold leading-none mt-1 ${suitColor}`}>
                          {formatSuit(suit)}
                        </span>
                      </div>
                    );
                  }

                  // Faint dashed placeholder slot for unplayed rank
                  return (
                    <div
                      key={id}
                      className={`theme-table-placeholder absolute left-1/2 -translate-x-1/2 w-[64px] sm:w-[72px] h-[21px] ${isRed ? "theme-table-tile-red" : ""}`}
                      style={{
                        top: `${topOffset}px`,
                        zIndex: 0,
                      }}
                      aria-label={`Unplayed ${formatRank(rank)} of ${suit}`}
                    >
                      {formatRank(rank)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
