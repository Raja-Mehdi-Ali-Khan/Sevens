import type { CardId, Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";
import { useIsCardInFlight } from "../lib/inFlightStore";
import { PlayingCard } from "./PlayingCard";

interface SuitTableProps {
  table: TableState;
  recentCardId?: CardId | null;
}

interface SuitTableCardProps {
  id: CardId;
  rank: Rank;
  isRecent: boolean;
}

function SuitTableCard({ id, rank, isRecent }: SuitTableCardProps) {
  const isInFlight = useIsCardInFlight(id);
  return (
    <PlayingCard
      cardId={id}
      size="tile"
      isRecent={isRecent}
      dataTile={id}
      className="table-board-card"
      style={{
        gridRow: rank,
        gridColumn: 1,
        zIndex: isRecent ? 30 : 10 + rank,
        visibility: isInFlight ? "hidden" : undefined,
      }}
    />
  );
}

export function SuitTable({ table, recentCardId }: SuitTableProps) {
  return (
    <div
      className="theme-oval-table w-full max-w-[360px] sm:max-w-[440px] mx-auto"
      data-suit-board="true"
    >
      {/* 4 distinct suit columns with integrated headers and aligned 7s baseline */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "theme-table-header-red" : "";

          return (
            <div
              key={suit}
              data-suit-column={suit}
              className="theme-suit-col flex min-w-0 flex-col items-center"
            >
              {/* Integrated Suit Column Header */}
              <div
                className={`theme-table-header w-full py-1 border-b border-[var(--edge)]/70 text-center select-none flex items-center justify-center ${suitColor}`}
                aria-label={`Suit ${suit}`}
              >
                <span className="text-sm sm:text-base leading-none">{formatSuit(suit)}</span>
              </div>

              {/* 13-rank continuous column anchored on row 7 */}
              <div
                className="table-suit-stack relative w-full px-1 py-1.5"
                aria-label={`Played cards for ${suit}`}
              >
                <div
                  aria-hidden="true"
                  className="table-seven-baseline"
                  style={{ gridRow: 7, gridColumn: 1 }}
                />
                {RANKS.map((rank: Rank) => {
                  const id = `${rank}${suit}` as CardId;
                  const isFilled = run !== null && rank >= run.low && rank <= run.high;
                  const isRecent = recentCardId === id;
                  const isSeven = rank === 7;

                  if (isFilled) {
                    return (
                      <SuitTableCard
                        key={id}
                        id={id}
                        rank={rank}
                        isRecent={isRecent}
                      />
                    );
                  }

                  if (run === null && isSeven) {
                    return (
                      <div
                        key={id}
                        data-tile={id}
                        className={`theme-open-slot-tile select-none ${isRed ? "theme-table-tile-red" : ""}`}
                        style={{
                          gridRow: rank,
                          gridColumn: 1,
                          zIndex: 5,
                        }}
                        aria-label={`Play 7 of ${suit} here to open suit`}
                      >
                        <span className="font-semibold">7</span>
                        <span className="text-[10px] leading-none">{formatSuit(suit)}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={id}
                      data-tile={id}
                      className="w-full h-full pointer-events-none"
                      style={{
                        gridRow: rank,
                        gridColumn: 1,
                      }}
                      aria-label={`Unplayed ${formatRank(rank)} of ${suit}`}
                    />
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
