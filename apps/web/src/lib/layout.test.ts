import { describe, expect, it } from "vitest";
import type { Seat } from "@cardgame/engine";
import { getOpponents, getScreenPosition, getSeatLayout } from "./layout";

describe("layout", () => {
  it("maps seat 0 (me) correctly", () => {
    const layout = getSeatLayout(0);
    expect(layout).toEqual({
      bottom: 0,
      right: 1,
      top: 2,
      left: 3,
    });
    expect(getScreenPosition(0, 0)).toBe("bottom");
    expect(getScreenPosition(1, 0)).toBe("right");
    expect(getScreenPosition(2, 0)).toBe("top");
    expect(getScreenPosition(3, 0)).toBe("left");
    expect(getOpponents(0)).toEqual([
      { position: "left", seat: 3 },
      { position: "top", seat: 2 },
      { position: "right", seat: 1 },
    ]);
  });

  it("maps seat 1 (me) correctly", () => {
    const layout = getSeatLayout(1);
    expect(layout).toEqual({
      bottom: 1,
      right: 2,
      top: 3,
      left: 0,
    });
    expect(getScreenPosition(1, 1)).toBe("bottom");
    expect(getScreenPosition(2, 1)).toBe("right");
    expect(getScreenPosition(3, 1)).toBe("top");
    expect(getScreenPosition(0, 1)).toBe("left");
    expect(getOpponents(1)).toEqual([
      { position: "left", seat: 0 },
      { position: "top", seat: 3 },
      { position: "right", seat: 2 },
    ]);
  });

  it("maps seat 2 (me) correctly", () => {
    const layout = getSeatLayout(2);
    expect(layout).toEqual({
      bottom: 2,
      right: 3,
      top: 0,
      left: 1,
    });
    expect(getScreenPosition(2, 2)).toBe("bottom");
    expect(getScreenPosition(3, 2)).toBe("right");
    expect(getScreenPosition(0, 2)).toBe("top");
    expect(getScreenPosition(1, 2)).toBe("left");
    expect(getOpponents(2)).toEqual([
      { position: "left", seat: 1 },
      { position: "top", seat: 0 },
      { position: "right", seat: 3 },
    ]);
  });

  it("maps seat 3 (me) correctly", () => {
    const layout = getSeatLayout(3);
    expect(layout).toEqual({
      bottom: 3,
      right: 0,
      top: 1,
      left: 2,
    });
    expect(getScreenPosition(3, 3)).toBe("bottom");
    expect(getScreenPosition(0, 3)).toBe("right");
    expect(getScreenPosition(1, 3)).toBe("top");
    expect(getScreenPosition(2, 3)).toBe("left");
    expect(getOpponents(3)).toEqual([
      { position: "left", seat: 2 },
      { position: "top", seat: 1 },
      { position: "right", seat: 0 },
    ]);
  });

  it("preserves anticlockwise order (+1 right, +2 top, +3 left) for all seats", () => {
    const allSeats: Seat[] = [0, 1, 2, 3];
    for (const me of allSeats) {
      const layout = getSeatLayout(me);
      expect(layout.bottom).toBe(me);
      expect(layout.right).toBe((me + 1) % 4);
      expect(layout.top).toBe((me + 2) % 4);
      expect(layout.left).toBe((me + 3) % 4);
    }
  });
});
