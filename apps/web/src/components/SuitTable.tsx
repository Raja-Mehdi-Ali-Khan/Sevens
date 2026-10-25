import type { Rank, Suit, TableState } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, RANKS, SUITS } from "../lib/cards";

interface SuitTableProps {
  table: TableState;
}

export function SuitTable({ table }: SuitTableProps) {
  return (
    <div className="bg-emerald-900/10 border border-emerald-900/20 rounded-xl p-2 sm:p-4 max-w-full overflow-x-auto">
      <div className="min-w-[340px] space-y-1.5 sm:space-y-2">
        {SUITS.map((suit: Suit) => {
          const run = table[suit];
          const isRed = isRedSuit(suit);
          const suitColor = isRed ? "text-red-600" : "text-zinc-900";

          return (
            <div key={suit} className="flex items-center gap-1 sm:gap-1.5">
              {/* Suit icon */}
              <div
                className={`w-6 sm:w-8 text-center text-base sm:text-xl font-bold ${suitColor} select-none`}
              >
                {formatSuit(suit)}
              </div>

              {/* 13 rank slots: A to K */}
              <div className="flex-1 grid grid-cols-13 gap-0.5 sm:gap-1">
                {RANKS.map((rank: Rank) => {
                  const isFilled = run !== null && rank >= run.low && rank <= run.high;
                  const isSeven = rank === 7;

                  if (isFilled) {
                    return (
                      <div
                        key={rank}
                        className={`h-8 sm:h-11 bg-white border border-zinc-300 rounded shadow-xs flex flex-col items-center justify-center font-bold text-xs sm:text-sm select-none ${suitColor} transition-transform`}
                      >
                        <span>{formatRank(rank)}</span>
                        <span className="text-[10px] sm:text-xs leading-none -mt-0.5">
                          {formatSuit(suit)}
                        </span>
                      </div>
                    );
                  }

                  // Empty placeholder
                  return (
                    <div
                      key={rank}
                      className={`h-8 sm:h-11 rounded border border-dashed flex items-center justify-center text-[10px] sm:text-xs font-mono select-none ${
                        isSeven
                          ? "border-amber-400/60 bg-amber-50/40 text-amber-700/60 font-semibold"
                          : "border-zinc-300/60 bg-zinc-100/40 text-zinc-400/60"
                      }`}
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
