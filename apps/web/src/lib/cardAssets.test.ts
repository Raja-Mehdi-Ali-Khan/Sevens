import { describe, expect, it } from "vitest";
import { readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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

  it("keeps all shipped WebP card art below the size budgets", async () => {
    const directory = fileURLToPath(new URL("../assets/cards/", import.meta.url));
    const files = (await readdir(directory)).filter((name) => name.endsWith(".webp"));
    expect(files).toHaveLength(53);
    expect(files).toContain("back.webp");

    const sizes = await Promise.all(
      files.map(async (name) => (await stat(new URL(`../assets/cards/${name}`, import.meta.url))).size),
    );
    expect(sizes.every((size) => size < 20 * 1024)).toBe(true);
    expect(sizes.reduce((total, size) => total + size, 0)).toBeLessThan(800 * 1024);
  });
});

