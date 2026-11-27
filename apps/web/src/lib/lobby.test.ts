import { describe, expect, it } from "vitest";
import { botCount, startButtonLabel } from "./lobby";

describe("botCount", () => {
  it("returns 4 minus humanCount clamped to 0..4", () => {
    expect(botCount(0)).toBe(4);
    expect(botCount(1)).toBe(3);
    expect(botCount(2)).toBe(2);
    expect(botCount(3)).toBe(1);
    expect(botCount(4)).toBe(0);
    expect(botCount(5)).toBe(0);
    expect(botCount(-1)).toBe(4);
  });
});

describe("startButtonLabel", () => {
  it("returns 'Start game' when all 4 seats are human", () => {
    expect(startButtonLabel(4, false)).toBe("Start game");
    expect(startButtonLabel(4, true)).toBe("Start game");
  });

  it("uses singular 'bot' when 1 bot is needed", () => {
    expect(startButtonLabel(3, false)).toBe("Start with 1 bot");
    expect(startButtonLabel(3, true)).toBe("Tap again to start with 1 bot");
  });

  it("uses plural 'bots' when 2 or 3 bots are needed", () => {
    expect(startButtonLabel(2, false)).toBe("Start with 2 bots");
    expect(startButtonLabel(2, true)).toBe("Tap again to start with 2 bots");
    expect(startButtonLabel(1, false)).toBe("Start with 3 bots");
    expect(startButtonLabel(1, true)).toBe("Tap again to start with 3 bots");
  });
});
