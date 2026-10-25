import type { CardId, Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";
import { PlayingCard } from "./PlayingCard";

interface SuitTableProps {
  table: TableState;
  recentCardId?: CardId | null;
}

export function SuitTable({ table, recentCardId }: SuitTableProps) {
  return (
    <div className="w-full max-w-sm mx-auto bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-1.5 sm:p-2">
      {/* 4 vertical suit columns */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "text-red-500" : "text-zinc-800";

          return (
            <div
              key={suit}
              className="flex flex-col bg-emerald-950/10 rounded-lg p-1 border border-emerald-900/20"
            >
              {/* Suit Header */}
              <div
                className={`py-0.5 sm:py-1 text-center font-extrabold text-sm sm:text-base border-b border-emerald-900/25 mb-1 select-none flex items-center justify-center gap-1 ${suitColor}`}
                aria-label={`Suit ${suit}`}
              >
                <span>{formatSuit(suit)}</span>
              </div>

              {/* 13 rank slots: A (top) to K (bottom), with 7 in the center */}
              <div className="flex flex-col gap-0.5">
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
                      />
                    );
                  }

                  // Empty placeholder slot
                  return (
                    <div
                      key={id}
                      className={`w-full h-[18px] sm:h-[20px] rounded border border-dashed flex items-center justify-center text-[10px] sm:text-[11px] font-mono select-none ${
                        isSeven
                          ? "border-amber-400/80 bg-amber-50/60 text-amber-700 font-bold"
                          : "border-zinc-300/40 bg-white/20 text-zinc-400/60"
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
