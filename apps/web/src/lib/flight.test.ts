import { describe, expect, it } from "vitest";
import { capFlights, flightGeometry } from "./flight";

describe("flightGeometry", () => {
  it("computes center-to-center coordinates and width scale", () => {
    const from = { left: 100, top: 400, width: 80, height: 112 };
    const to = { left: 200, top: 150, width: 40, height: 56 };
    expect(flightGeometry(from, to)).toEqual({
      fromX: 140,
      fromY: 456,
      toX: 220,
      toY: 178,
      scale: 0.5,
    });
  });

  it("returns scale 1 and identical centers for identical rectangles", () => {
    const rect = { left: 24, top: 48, width: 60, height: 90 };
    expect(flightGeometry(rect, rect)).toEqual({
      fromX: 54,
      fromY: 93,
      toX: 54,
      toY: 93,
      scale: 1,
    });
  });

  it("handles zero-size rectangles safely with scale 1", () => {
    const zero = { left: 10, top: 20, width: 0, height: 0 };
    const target = { left: 50, top: 60, width: 40, height: 60 };
    expect(flightGeometry(zero, target)).toEqual({
      fromX: 10,
      fromY: 20,
      toX: 70,
      toY: 90,
      scale: 1,
    });
    expect(flightGeometry(target, zero)).toEqual({
      fromX: 70,
      fromY: 90,
      toX: 10,
      toY: 20,
      scale: 1,
    });
  });
});

describe("capFlights", () => {
  it("keeps at most max most-recent items", () => {
    expect(capFlights([1, 2, 3], 4)).toEqual([1, 2, 3]);
    expect(capFlights([1, 2, 3, 4, 5], 4)).toEqual([2, 3, 4, 5]);
    expect(capFlights([1, 2, 3], 0)).toEqual([]);
  });
});
