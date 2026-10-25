export interface HandLayoutResult {
  rowCount: number;
  rowDistribution: number[];
  cardSize: "sm" | "md" | "lg";
  minTappableWidth: number;
}

export const CARD_WIDTHS = {
  sm: 44,
  md: 56,
  lg: 64,
} as const;

/**
 * Pure function: calculates the layout (rows, card size, and min tappable width)
 * for a hand on a given viewport/container width.
 *
 * Rules:
 * - At 360px wide with 13 cards, cards are arranged in two overlapping rows (7 and 6).
 * - Every card must have at least 40px of horizontal tappable width.
 * - 'md' card size for narrower phones (< 400px), 'lg' for 400px+.
 */
export function computeHandLayout(cardCount: number, width: number, measuredCardWidth?: number): HandLayoutResult {
  if (cardCount <= 0) {
    return {
      rowCount: 0,
      rowDistribution: [],
      cardSize: width >= 400 ? "lg" : "md",
      minTappableWidth: 0,
    };
  }

  const cardSize: "sm" | "md" | "lg" = width >= 400 ? "lg" : "md";
  const cardWidth = measuredCardWidth ?? CARD_WIDTHS[cardSize];
  const availableWidth = Math.max(width, cardWidth);

  // If 6 or fewer cards, they fit in a single row comfortably
  if (cardCount <= 6) {
    const minStep = cardCount > 1 ? (availableWidth - cardWidth) / (cardCount - 1) : cardWidth;
    return {
      rowCount: 1,
      rowDistribution: [cardCount],
      cardSize,
      minTappableWidth: Math.min(cardWidth, Math.max(minStep, 0)),
    };
  }

  // 2 overlapping rows: row 1 gets ceil(count/2), row 2 gets floor(count/2)
  const topRowCount = Math.ceil(cardCount / 2);
  const bottomRowCount = Math.floor(cardCount / 2);
  const maxInRow = Math.max(topRowCount, bottomRowCount);

  const step = (availableWidth - cardWidth) / (maxInRow - 1);
  const minTappableWidth = Math.min(cardWidth, step);

  return {
    rowCount: 2,
    rowDistribution: [topRowCount, bottomRowCount],
    cardSize,
    minTappableWidth,
  };
}

/**
 * Pure function: splits an array of cards into rows based on viewport width.
 */
export function splitHandIntoRows<T>(cards: readonly T[], width: number): T[][] {
  const layout = computeHandLayout(cards.length, width);
  if (layout.rowCount === 0) return [];
  if (layout.rowCount === 1) return [[...cards]];

  const rows: T[][] = [];
  let startIndex = 0;
  for (const count of layout.rowDistribution) {
    rows.push(cards.slice(startIndex, startIndex + count));
    startIndex += count;
  }
  return rows;
}

