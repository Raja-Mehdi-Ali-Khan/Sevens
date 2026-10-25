import type { CardId, Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";
import { PlayingCard } from "./PlayingCard";

interface SuitTableProps {
  table: TableState;
  recentCardId?: CardId | null;
}

export function SuitTable({ table, recentCardId }: SuitTableProps) {
  return (
    <div className="theme-board w-full max-w-[440px] mx-auto">
      {/* 4 vertical suit columns with tight gaps */}
      <div className="grid grid-cols-4 gap-0">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "theme-table-header-red" : "";

          return (
            <div
              key={suit}
              className="flex min-w-0 flex-col items-center rounded-xl p-0"
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
                className="table-suit-stack relative w-full"
                aria-label={`Played cards for ${suit}`}
              >
                {RANKS.map((rank: Rank) => {
                  const id = `${rank}${suit}` as CardId;
                  const isFilled = run !== null && rank >= run.low && rank <= run.high;
                  const isRecent = recentCardId === id;
                  const isSeven = rank === 7;
                  if (isFilled) {
                    const isRunEnd = run !== null && (rank === run.low || rank === run.high);

                    if (!isRunEnd) {
                      return (
                        <div
                          key={id}
                          className={`theme-table-center-card ${isRed ? "theme-table-tile-red" : ""} ${isRecent ? "theme-table-tile-recent" : ""}`}
                          style={{ gridRow: rank, zIndex: isRecent ? 1000 : 200 + rank }}
                          aria-label={`${formatRank(rank)} of ${suit}`}
                          title={`${formatRank(rank)} of ${suit}`}
                        >
                          <span>{formatRank(rank)}</span>
                          <span>{formatSuit(suit)}</span>
                        </div>
                      );
                    }

                    return (
                      <PlayingCard
                        key={id}
                        cardId={id}
                        size="table"
                        isRecent={isRecent}
                        className="table-board-card"
                        style={{ gridRow: rank, zIndex: isRecent ? 1000 : 100 + rank }}
                      />
                    );
                  }

                  // If suit has not been opened yet, show prominent foundation target card at rank 7
                  if (run === null && isSeven) {
                    return (
                      <div
                        key={id}
                        className="theme-open-slot select-none"
                        style={{
                          gridRow: rank,
                          zIndex: 100 + rank,
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
                      className={`theme-table-placeholder ${isRed ? "theme-table-tile-red" : ""}`}
                      style={{
                        gridRow: rank,
                        zIndex: rank,
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
