import type { CardId, Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";
import { PlayingCard } from "./PlayingCard";

interface SuitTableProps {
  table: TableState;
  recentCardId?: CardId | null;
}

export function SuitTable({ table, recentCardId }: SuitTableProps) {
  // 12 steps across the stack height for 13 ranks
  // On mobile: 320px stack, 76px card -> step = (320 - 76) / 12 = 20.33px
  const step = 20.33;

  return (
    <div className="w-full max-w-sm mx-auto bg-emerald-950/25 border border-emerald-900/35 rounded-2xl p-1.5 sm:p-2 shadow-inner">
      {/* 4 vertical suit columns */}
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "text-red-500" : "text-zinc-800";

          return (
            <div
              key={suit}
              className="flex flex-col items-center bg-emerald-950/15 rounded-xl p-0.5 sm:p-1 border border-emerald-900/25 min-w-0"
            >
              {/* Suit Header */}
              <div
                className={`w-full py-0.5 text-center font-extrabold text-sm sm:text-base border-b border-emerald-900/25 mb-1 select-none flex items-center justify-center gap-1 ${suitColor}`}
                aria-label={`Suit ${suit}`}
              >
                <span>{formatSuit(suit)}</span>
              </div>

              {/* 13-rank stacked card area */}
              <div
                className="relative w-full h-[320px] flex justify-center"
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

                  // If suit has not been opened yet, show prominent foundation target at rank 7
                  if (run === null && isSeven) {
                    return (
                      <div
                        key={id}
                        className="absolute left-1/2 -translate-x-1/2 w-[52px] h-[76px] sm:w-[58px] sm:h-[84px] rounded border-2 border-dashed border-amber-400/90 bg-amber-50/40 flex flex-col items-center justify-center select-none shadow-2xs"
                        style={{
                          top: `${topOffset}px`,
                          zIndex: 5,
                        }}
                        aria-label={`Play 7 of ${suit} here to open suit`}
                      >
                        <span className="text-sm font-black text-amber-700 leading-none">7</span>
                        <span className={`text-xs font-bold leading-none mt-0.5 ${suitColor}`}>
                          {formatSuit(suit)}
                        </span>
                      </div>
                    );
                  }

                  // Faint dashed placeholder slot for unplayed rank
                  return (
                    <div
                      key={id}
                      className="absolute left-1/2 -translate-x-1/2 w-[50px] sm:w-[56px] h-[19px] rounded border border-dashed border-zinc-300/35 bg-white/10 flex items-center justify-center text-[10px] font-mono text-zinc-400/50 select-none pointer-events-none"
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
