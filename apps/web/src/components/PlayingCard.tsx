import { useState } from "react";
import type { CardId } from "@cardgame/engine";
import { getCardAsset } from "../lib/cardAssets";
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
  onClick?: () => void;
}

export function PlayingCard({
  cardId,
  size,
  state = "normal",
  isRecent = false,
  className = "",
  onClick,
}: PlayingCardProps) {
  const [imgError, setImgError] = useState(false);
  const alt = cardAltText(cardId);
  const isBack = cardId === "back";
  const isCardPlayable = state === "playable";
  const isCardDimmed = state === "dimmed";

  // Card size classes
  const sizeClasses = {
    tile: "w-full h-[18px] sm:h-[20px] text-[10px] sm:text-xs",
    table: "w-[66px] h-[94px] sm:w-[74px] sm:h-[106px] text-xs sm:text-sm",
    sm: "w-[32px] h-[46px] min-w-[32px]",
    md: "w-[56px] h-[81px] min-w-[56px]",
    lg: "w-[64px] h-[93px] min-w-[64px]",
  }[size];

  // State styling
  const stateClasses = isCardPlayable
    ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-md -translate-y-1 z-10 cursor-pointer active:translate-y-0"
    : isCardDimmed
    ? "opacity-40 cursor-not-allowed"
    : "shadow-2xs";

  const recentClasses = isRecent
    ? "ring-2 ring-amber-400 shadow-sm"
    : "";

  // Common wrapper styles
  const baseClasses = `relative select-none touch-manipulation rounded flex items-center justify-center overflow-hidden transition-all ${sizeClasses} ${stateClasses} ${recentClasses} ${className}`;

  // 'tile' mode is drawn with CSS and text for compact mini tiles
  if (size === "tile") {
    if (isBack) {
      const tileContent = (
        <div className="w-full h-full bg-blue-800 border border-blue-950 rounded flex items-center justify-center">
          <div className="w-[80%] h-[80%] border border-blue-400/50 rounded-xs bg-blue-700/60" />
        </div>
      );
      if (onClick) {
        return (
          <button
            type="button"
            onClick={onClick}
            disabled={isCardDimmed}
            aria-label={alt}
            className={`${baseClasses} p-0 border-0 bg-transparent`}
          >
            {tileContent}
          </button>
        );
      }
      return (
        <div className={baseClasses} aria-label={alt}>
          {tileContent}
        </div>
      );
    }

    const card = parseCardIdToCard(cardId);
    const red = isRedSuit(card.suit);
    const textColor = red ? "text-red-600" : "text-zinc-900";

    const tileContent = (
      <div
        className={`w-full h-full bg-white border border-zinc-300 rounded flex items-center justify-center gap-1 font-bold leading-none ${textColor}`}
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
          className={`${baseClasses} p-0 border-0 bg-transparent`}
        >
          {tileContent}
        </button>
      );
    }
    return (
      <div className={baseClasses} aria-label={alt}>
        {tileContent}
      </div>
    );
  }

  // 'table', 'sm', 'md', 'lg' use SVG card faces (or fallback to CSS if SVG fails)
  const assetUrl = getCardAsset(cardId);

  const renderContent = () => {
    if (assetUrl && !imgError) {
      return (
        <img
          src={assetUrl}
          alt={alt}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none drop-shadow-2xs rounded bg-white"
        />
      );
    }

    // CSS Fallback rendering if SVG is missing or failed to load
    if (isBack) {
      return (
        <div className="w-full h-full bg-blue-800 border-2 border-white rounded-md flex items-center justify-center shadow-inner">
          <div className="w-[85%] h-[85%] border-2 border-blue-300/40 rounded-sm bg-blue-700/80 flex items-center justify-center">
            <span className="text-white/40 text-xs font-mono font-bold">♠♥♦♣</span>
          </div>
        </div>
      );
    }

    const card = parseCardIdToCard(cardId);
    const red = isRedSuit(card.suit);
    const textColor = red ? "text-red-600" : "text-zinc-900";

    return (
      <div
        className={`w-full h-full bg-white border border-zinc-300 rounded-md p-1 flex flex-col justify-between ${textColor} shadow-xs font-bold`}
      >
        <div className="text-left text-xs leading-none">
          <div>{formatRank(card.rank)}</div>
          <div className="text-[10px]">{formatSuit(card.suit)}</div>
        </div>
        <div className="text-center text-lg leading-none">{formatSuit(card.suit)}</div>
        <div className="text-right text-xs leading-none rotate-180">
          <div>{formatRank(card.rank)}</div>
          <div className="text-[10px]">{formatSuit(card.suit)}</div>
        </div>
      </div>
    );
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isCardDimmed}
        aria-label={alt}
        className={`${baseClasses} p-0 border-0 bg-transparent`}
      >
        {renderContent()}
      </button>
    );
  }

  return (
    <div className={baseClasses} aria-label={alt}>
      {renderContent()}
    </div>
  );
}
