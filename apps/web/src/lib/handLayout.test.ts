import { describe, expect, it } from "vitest";
import { computeHandLayout, splitHandIntoRows } from "./handLayout";

describe("handLayout", () => {
  it("computes two rows for 13 cards at 360px with >= 40px tappable width", () => {
    const layout = computeHandLayout(13, 360);
    expect(layout.rowCount).toBe(2);
    expect(layout.rowDistribution).toEqual([7, 6]);
    expect(layout.cardSize).toBe("md");
    expect(layout.minTappableWidth).toBeGreaterThanOrEqual(40);
  });

  it("computes two rows for 13 cards at 390px with >= 40px tappable width", () => {
    const layout = computeHandLayout(13, 390);
    expect(layout.rowCount).toBe(2);
    expect(layout.rowDistribution).toEqual([7, 6]);
    expect(layout.cardSize).toBe("md");
    expect(layout.minTappableWidth).toBeGreaterThanOrEqual(40);
  });

  it("computes two rows for 13 cards at 430px with >= 40px tappable width and lg cards", () => {
    const layout = computeHandLayout(13, 430);
    expect(layout.rowCount).toBe(2);
    expect(layout.rowDistribution).toEqual([7, 6]);
    expect(layout.cardSize).toBe("lg");
    expect(layout.minTappableWidth).toBeGreaterThanOrEqual(40);
  });

  it.each([
    [568, 54],
    [640, 62],
    [700, 70],
    [844, 78],
  ])("keeps 13-card hands tappable at every width from 320px up (height %i)", (height, defaultCardWidth) => {
    for (let viewportWidth = 320; viewportWidth <= 480; viewportWidth++) {
      const containerWidth = viewportWidth - 16;
      const cardWidth = height > 680 && viewportWidth <= 333 ? 64 : defaultCardWidth;
      const layout = computeHandLayout(13, containerWidth, cardWidth);
      expect(layout.rowCount).toBe(2);
      expect(layout.minTappableWidth, `${viewportWidth}px viewport`).toBeGreaterThanOrEqual(40);
    }
  });

  it("splits a 13-card hand into 7 and 6 cards across rows", () => {
    const mockCards = Array.from({ length: 13 }, (_, i) => `card-${i + 1}`);
    const rows360 = splitHandIntoRows(mockCards, 360);
    expect(rows360.length).toBe(2);
    expect(rows360[0]?.length).toBe(7);
    expect(rows360[1]?.length).toBe(6);
    expect(rows360[0]?.[0]).toBe("card-1");
    expect(rows360[0]?.[6]).toBe("card-7");
    expect(rows360[1]?.[0]).toBe("card-8");
    expect(rows360[1]?.[5]).toBe("card-13");
  });

  it("uses single row when 6 or fewer cards remain", () => {
    const layout = computeHandLayout(5, 360);
    expect(layout.rowCount).toBe(1);
    expect(layout.rowDistribution).toEqual([5]);
    expect(layout.minTappableWidth).toBeGreaterThanOrEqual(44);

    const mockCards = ["c1", "c2", "c3", "c4"];
    const rows = splitHandIntoRows(mockCards, 360);
    expect(rows.length).toBe(1);
    expect(rows[0]?.length).toBe(4);
  });
});

