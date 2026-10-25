import type { Card, CardId } from "@cardgame/engine";
import { formatRank, formatSuit, isRedSuit, sortHand } from "../lib/cards";

interface MyHandProps {
  hand: Card[];
  legalCards: CardId[];
  isMyChoice: boolean;
  onPlayCard: (cardId: CardId) => void;
}

export function MyHand({ hand, legalCards, isMyChoice, onPlayCard }: MyHandProps) {
  const sortedCards = sortHand(hand);

  return (
    <div className="w-full">
      <div className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Your Hand ({sortedCards.length} {sortedCards.length === 1 ? "card" : "cards"})
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-2xl mx-auto px-2">
        {sortedCards.map((card) => {
          const id = `${card.rank}${card.suit}` as CardId;
          const isLegal = isMyChoice && legalCards.includes(id);
          const isRed = isRedSuit(card.suit);
          const suitColor = isRed ? "text-red-600" : "text-zinc-900";

          return (
            <button
              key={id}
              type="button"
              disabled={!isLegal}
              onClick={() => onPlayCard(id)}
              className={`w-9 h-14 sm:w-12 sm:h-18 rounded-lg flex flex-col items-center justify-between py-1 px-0.5 sm:py-1.5 font-bold transition-all select-none ${
                isLegal
                  ? `bg-white border-2 border-blue-600 ring-2 ring-blue-400/50 shadow-md hover:-translate-y-1.5 cursor-pointer active:translate-y-0 ${suitColor}`
                  : `bg-zinc-100/90 border border-zinc-300/80 opacity-40 cursor-not-allowed ${suitColor}`
              }`}
              title={isLegal ? `Play ${formatRank(card.rank)}${formatSuit(card.suit)}` : undefined}
            >
              <div className="text-xs sm:text-sm leading-none font-semibold">
                {formatRank(card.rank)}
              </div>
              <div className="text-sm sm:text-lg leading-none">
                {formatSuit(card.suit)}
              </div>
              <div className="text-[10px] sm:text-xs leading-none font-mono opacity-50">
                {isLegal ? "•" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
