import type { CardId, Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";
import { PlayingCard } from "./PlayingCard";

interface SuitTableProps {
  table: TableState;
  recentCardId?: CardId | null;
}

export function SuitTable({ table, recentCardId }: SuitTableProps) {
  return (
    <div className="w-full bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-1.5 sm:p-2.5">
      <div className="flex flex-col gap-1 sm:gap-1.5">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "text-red-500" : "text-zinc-800";

          return (
            <div key={suit} className="flex items-center gap-1 w-full justify-between">
              {/* Suit icon */}
              <div
                className={`w-4 sm:w-5 text-center text-sm sm:text-base font-extrabold ${suitColor} select-none shrink-0`}
                aria-hidden="true"
              >
                {formatSuit(suit)}
              </div>

              {/* 13 rank slots: A to K */}
              <div className="flex-1 grid grid-cols-13 gap-0.5 max-w-full">
                {RANKS.map((rank: Rank) => {
                  const id = `${rank}${suit}` as CardId;
                  const isFilled = run !== null && rank >= run.low && rank <= run.high;
                  const isRecent = recentCardId === id;
                  const isSeven = rank === 7;

                  if (isFilled) {
                    return (
                      <PlayingCard
                        key={id}
                        cardId={id}
                        size="tile"
                        isRecent={isRecent}
                        className="mx-auto"
                      />
                    );
                  }

                  // Empty placeholder slot
                  return (
                    <div
                      key={id}
                      className={`h-[36px] sm:h-[40px] rounded border border-dashed flex items-center justify-center text-[9px] sm:text-[11px] font-mono select-none ${
                        isSeven
                          ? "border-amber-400/70 bg-amber-50/50 text-amber-700 font-bold"
                          : "border-zinc-300/50 bg-white/30 text-zinc-400/60"
                      }`}
                      aria-label={`Empty slot ${formatRank(rank)} of ${suit}`}
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
