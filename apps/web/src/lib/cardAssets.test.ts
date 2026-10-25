import { describe, expect, it } from "vitest";
import type { CardId, Rank, Suit } from "@cardgame/engine";
import { getAllLoadedCardKeys, getCardAsset } from "./cardAssets";
import { RANKS, SUITS } from "./cards";

describe("cardAssets", () => {
  it("resolves all 52 CardIds to valid asset URLs", () => {
    let resolvedCount = 0;
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const id = `${rank}${suit}` as CardId;
        const asset = getCardAsset(id);
        expect(asset, `Asset for ${id} must resolve`).toBeDefined();
        expect(typeof asset).toBe("string");
        expect(asset?.length).toBeGreaterThan(0);
        resolvedCount++;
      }
    }
    expect(resolvedCount).toBe(52);
  });

  it("resolves the card back asset", () => {
    const backAsset = getCardAsset("back");
    expect(backAsset).toBeDefined();
    expect(typeof backAsset).toBe("string");
    expect(backAsset?.length).toBeGreaterThan(0);
  });

  it("contains exactly 53 assets in total", () => {
    const keys = getAllLoadedCardKeys();
    expect(keys.length).toBe(53);
    expect(keys).toContain("back");
    expect(keys).toContain("1H");
    expect(keys).toContain("7H");
    expect(keys).toContain("13S");
  });
});

