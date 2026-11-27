import { type CSSProperties, type MouseEvent } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { CardId } from "@cardgame/engine";
import {
  cardAltText,
  formatRank,
  formatSuit,
  isRedSuit,
  parseCardIdToCard,
} from "../lib/cards";

export interface PlayingCardProps {
  cardId: CardId | "back";
  size: "tile" | "table" | "sm" | "md" | "lg";
  state?: "normal" | "playable" | "dimmed";
  isRecent?: boolean;
  className?: string;
  style?: CSSProperties;
  dataTile?: CardId;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function PlayingCard({
  cardId,
  size,
  state = "normal",
  isRecent = false,
  className = "",
  style,
  dataTile,
  onClick,
}: PlayingCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const alt = cardAltText(cardId);
  const isBack = cardId === "back";
  const isCardPlayable = state === "playable";
  const isCardDimmed = state === "dimmed";

  // Card size classes
  const sizeClasses = {
    tile: "w-full h-[var(--oval-tile-h,20px)] text-[11px] sm:text-xs",
    table: "table-card-size",
    sm: "hand-card-size",
    md: "hand-card-size",
    lg: "hand-card-size",
  }[size];

  // State styling
  const stateClasses = isCardPlayable
    ? "theme-playable-card z-10 cursor-pointer"
    : isCardDimmed
    ? "theme-dimmed-card cursor-not-allowed"
    : "shadow-2xs";

  const recentClasses = isRecent && size === "table"
    ? "theme-table-tile-recent"
    : "";

  // Common wrapper styles
  const baseClasses = `relative select-none touch-manipulation rounded flex items-center justify-center ${sizeClasses} ${stateClasses} ${recentClasses} ${className}`;

  // 'tile' mode is drawn with CSS and text for compact mini tiles
  if (size === "tile") {
    if (isBack) {
      const tileContent = (
        <div className="w-full h-full rounded border border-[var(--acc)] bg-[var(--back)] flex items-center justify-center">
          <div className="w-[80%] h-[80%] border border-[var(--acc)] rounded-xs bg-[var(--chip)]" />
        </div>
      );
      if (onClick) {
        return (
          <button
            type="button"
            onClick={onClick}
            disabled={isCardDimmed}
            aria-label={alt}
            style={style}
            className={`${baseClasses} p-0 border-0 bg-transparent`}
          >
            {tileContent}
          </button>
        );
      }
      return (
        <div className={baseClasses} aria-label={alt} style={style}>
          {tileContent}
        </div>
      );
    }

    const card = parseCardIdToCard(cardId);
    const red = isRedSuit(card.suit);
    const tileContent = (
      <div
        className={`theme-table-tile w-full h-full gap-1 font-bold leading-none ${red ? "theme-table-tile-red" : ""}`}
      >
        <span className="font-semibold tracking-tight">{formatRank(card.rank)}</span>
        <span className="text-[10px] sm:text-[11px] leading-none">{formatSuit(card.suit)}</span>
      </div>
    );

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          disabled={isCardDimmed}
          aria-label={alt}
          style={style}
          className={`${baseClasses} p-0 border-0 bg-transparent`}
        >
          {tileContent}
        </button>
      );
    }
    return (
      <div className={baseClasses} aria-label={alt} style={style}>
        {tileContent}
      </div>
    );
  }

  // 'table', 'sm', 'md', 'lg' use simple, compact squarish card faces
  const renderContent = () => {
    if (isBack) {
      return (
        <div className="w-full h-full border border-[var(--acc)] rounded-lg bg-[var(--back)] flex items-center justify-center shadow-xs">
          <div className="w-[80%] h-[80%] border border-[var(--edge)] rounded-md bg-[var(--chip)] flex items-center justify-center">
            <span className="text-[var(--acc)] text-[11px] font-bold">7</span>
          </div>
        </div>
      );
    }

    const card = parseCardIdToCard(cardId);
    const red = isRedSuit(card.suit);
    const textColor = red ? "text-[var(--rc)]" : "text-[var(--fk)]";

    return (
      <div
        className={`w-full h-full border border-[var(--edge)] rounded-lg px-1.5 py-1 flex flex-col justify-between bg-[var(--face)] ${textColor} font-bold shadow-xs`}
      >
        <div className="flex items-center justify-between text-xs sm:text-sm leading-none">
          <span>{formatRank(card.rank)}</span>
          <span className="text-[11px] sm:text-xs">{formatSuit(card.suit)}</span>
        </div>
        <div className="text-center text-lg sm:text-xl leading-none my-auto">
          {formatSuit(card.suit)}
        </div>
      </div>
    );
  };

  if (onClick) {
    if (isCardPlayable && !shouldReduceMotion) {
      return (
        <m.button
          type="button"
          onClick={onClick}
          whileTap={{ scale: 0.96, transition: { duration: 0.08 } }}
          aria-label={alt}
          style={style}
          data-tile={dataTile}
          className={`${baseClasses} p-0 border-0 bg-transparent`}
        >
          {renderContent()}
        </m.button>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isCardDimmed}
        aria-label={alt}
        style={style}
        data-tile={dataTile}
        className={`${baseClasses} p-0 border-0 bg-transparent`}
      >
        {renderContent()}
      </button>
    );
  }

  return (
    <div className={baseClasses} aria-label={alt} style={style} data-tile={dataTile}>
      {renderContent()}
    </div>
  );
}
