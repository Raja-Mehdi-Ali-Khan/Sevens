import { useEffect, useRef, useState } from "react";
import type { Card, CardId } from "@cardgame/engine";
import { CARD_WIDTHS, computeHandLayout, splitHandIntoRows } from "../lib/handLayout";
import { sortHand } from "../lib/cards";
import { PlayingCard } from "./PlayingCard";

interface MyHandProps {
  hand: Card[];
  legalCards: CardId[];
  isMyChoice: boolean;
  onPlayCard: (cardId: CardId) => void;
}

export function MyHand({ hand, legalCards, isMyChoice, onPlayCard }: MyHandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== "undefined" ? Math.min(window.innerWidth, 480) : 360
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) {
        setContainerWidth(w);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const sortedCards = sortHand(hand);
  const layout = computeHandLayout(sortedCards.length, containerWidth);
  const rows = splitHandIntoRows(sortedCards, containerWidth);

  const cardSize = layout.cardSize;
  const cardWidth = CARD_WIDTHS[cardSize];
  const cardHeight = cardSize === "lg" ? 93 : 81;

  // Horizontal padding in container: 16px (8px each side)
  const availableWidth = Math.max(containerWidth - 16, cardWidth);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none">
      <div className="w-full flex flex-col items-center">
        {rows.map((rowCards, rowIndex) => {
          const count = rowCards.length;
          const isBackRow = rowIndex === 0 && rows.length > 1;

          // If cards fit side-by-side with at least 4px gap, use normal flex spacing
          const naturalRowWidth = count * cardWidth + (count - 1) * 4;
          const needsOverlap = naturalRowWidth > availableWidth && count > 1;

          if (!needsOverlap) {
            return (
              <div
                key={rowIndex}
                className={`flex justify-center items-center gap-1 sm:gap-1.5 ${
                  rowIndex > 0 ? "-mt-8 sm:-mt-10" : ""
                } relative z-${rowIndex * 10}`}
              >
                {rowCards.map((card) => {
                  const id = `${card.rank}${card.suit}` as CardId;
                  const isPlayable = isMyChoice && legalCards.includes(id);
                  const state = isPlayable ? "playable" : isMyChoice ? "dimmed" : "normal";

                  return (
                    <PlayingCard
                      key={id}
                      cardId={id}
                      size={cardSize}
                      state={state}
                      onClick={isPlayable ? () => onPlayCard(id) : undefined}
                    />
                  );
                })}
              </div>
            );
          }

          // Compute overlapping step across available width
          const step = Math.min(cardWidth, (availableWidth - cardWidth) / (count - 1));
          const totalWidth = (count - 1) * step + cardWidth;

          return (
            <div
              key={rowIndex}
              className={`relative ${
                rowIndex > 0 ? "-mt-8 sm:-mt-10" : ""
              }`}
              style={{
                width: `${totalWidth}px`,
                height: `${cardHeight}px`,
                zIndex: isBackRow ? 10 : 20,
              }}
            >
              {rowCards.map((card, cardIndex) => {
                const id = `${card.rank}${card.suit}` as CardId;
                const isPlayable = isMyChoice && legalCards.includes(id);
                const state = isPlayable ? "playable" : isMyChoice ? "dimmed" : "normal";
                const leftOffset = cardIndex * step;

                return (
                  <div
                    key={id}
                    className="absolute top-0 transition-transform"
                    style={{
                      left: `${leftOffset}px`,
                      zIndex: isPlayable ? 50 : cardIndex + 1,
                    }}
                  >
                    <PlayingCard
                      cardId={id}
                      size={cardSize}
                      state={state}
                      onClick={isPlayable ? () => onPlayCard(id) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
