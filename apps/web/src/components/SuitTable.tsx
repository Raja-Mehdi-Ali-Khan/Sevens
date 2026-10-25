import type { CardId, Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";
import { PlayingCard } from "./PlayingCard";

interface SuitTableProps {
  table: TableState;
  recentCardId?: CardId | null;
}

export function SuitTable({ table, recentCardId }: SuitTableProps) {
  // 12 steps across the stack height for 13 ranks:
  // Mobile: 372px stack height, 94px card -> step = (372 - 94) / 12 = 23.17px
  const step = 23.17;

  return (
    <div className="w-full max-w-[440px] mx-auto bg-emerald-950/25 border border-emerald-900/35 rounded-2xl p-1 sm:p-1.5 shadow-inner">
      {/* 4 vertical suit columns with tight gaps */}
      <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "text-red-500" : "text-zinc-800";

          return (
            <div
              key={suit}
              className="flex flex-col items-center bg-emerald-950/15 rounded-xl p-0.5 border border-emerald-900/25 min-w-0"
            >
              {/* Suit Header */}
              <div
                className={`w-full py-0.5 text-center font-extrabold text-sm sm:text-base border-b border-emerald-900/25 mb-1 select-none flex items-center justify-center gap-1 ${suitColor}`}
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
                        className="absolute left-1/2 -translate-x-1/2 transition-all duration-200"
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
                        className="absolute left-1/2 -translate-x-1/2 w-[66px] h-[94px] sm:w-[74px] sm:h-[106px] rounded border-2 border-dashed border-amber-400/90 bg-amber-50/45 flex flex-col items-center justify-center select-none shadow-2xs"
                        style={{
                          top: `${topOffset}px`,
                          zIndex: 5,
                        }}
                        aria-label={`Play 7 of ${suit} here to open suit`}
                      >
                        <span className="text-base font-black text-amber-700 leading-none">7</span>
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
                      className="absolute left-1/2 -translate-x-1/2 w-[64px] sm:w-[72px] h-[21px] rounded border border-dashed border-zinc-300/35 bg-white/10 flex items-center justify-center text-[10px] font-mono text-zinc-400/50 select-none pointer-events-none"
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
