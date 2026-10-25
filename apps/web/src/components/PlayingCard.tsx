import { useState, type CSSProperties } from "react";
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
  style?: CSSProperties;
  onClick?: () => void;
}

export function PlayingCard({
  cardId,
  size,
  state = "normal",
  isRecent = false,
  className = "",
  style,
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

  // 'table', 'sm', 'md', 'lg' use raster card faces (or CSS if the asset fails)
  const assetUrl = getCardAsset(cardId);

  const renderContent = () => {
    if (assetUrl && !imgError) {
      return (
        <img
          src={assetUrl}
          alt={alt}
          width={167}
          height={243}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none drop-shadow-2xs rounded bg-transparent"
        />
      );
    }

    // CSS Fallback rendering if SVG is missing or failed to load
    if (isBack) {
      return (
        <div className="w-full h-full border-2 border-[var(--acc)] rounded-md bg-[var(--back)] flex items-center justify-center shadow-inner">
          <div className="w-[85%] h-[85%] border-2 border-[var(--acc)] rounded-sm bg-[var(--chip)] flex items-center justify-center">
            <span className="text-[var(--acc)] text-xs font-bold">♠♥♦♣</span>
          </div>
        </div>
      );
    }

    const card = parseCardIdToCard(cardId);
    const red = isRedSuit(card.suit);
    const textColor = red ? "text-[var(--rc)]" : "text-[var(--fk)]";

    return (
      <div
        className={`w-full h-full border border-[var(--edge)] rounded-md p-1 flex flex-col justify-between bg-[var(--face)] ${textColor} font-bold`}
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
        style={style}
        className={`${baseClasses} p-0 border-0 bg-transparent`}
      >
        {renderContent()}
      </button>
    );
  }

  return (
    <div className={baseClasses} aria-label={alt} style={style}>
      {renderContent()}
    </div>
  );
}
