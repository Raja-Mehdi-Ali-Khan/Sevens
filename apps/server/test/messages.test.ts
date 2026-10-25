import { describe, expect, it } from "vitest";
import {
  errorMessageSchema,
  eventMessageSchema,
  joinOptionsSchema,
  lobbyMessageSchema,
  playMessageSchema,
  startMessageSchema,
  viewMessageSchema,
} from "../src/messages";

describe("message schemas", () => {
  it("accepts valid join, start, and play inputs", () => {
    expect(joinOptionsSchema.safeParse({ name: "Ada" }).success).toBe(true);
    expect(joinOptionsSchema.parse({ name: "Ada", code: " ab234 " }).code).toBe("AB234");
    expect(startMessageSchema.safeParse(undefined).success).toBe(true);
    expect(playMessageSchema.safeParse({ card: "13D" }).success).toBe(true);
  });

  it("rejects invalid client inputs and unknown fields", () => {
    expect(joinOptionsSchema.safeParse({ name: "" }).success).toBe(false);
    expect(joinOptionsSchema.safeParse({ name: "x".repeat(21) }).success).toBe(false);
    expect(joinOptionsSchema.safeParse({ name: "Ada", extra: true }).success).toBe(false);
    expect(joinOptionsSchema.safeParse({ name: "Ada", code: "0O1I!" }).success).toBe(false);
    expect(startMessageSchema.safeParse({ anything: true }).success).toBe(false);
    expect(playMessageSchema.safeParse({ card: "14H" }).success).toBe(false);
    expect(playMessageSchema.safeParse({ card: "7H", extra: true }).success).toBe(false);
  });

  it("accepts each documented server payload shape and rejects extra fields", () => {
    const lobby = { code: "AB234", hostSeat: 0, players: [{ seat: 0, name: "Ada", connected: true }] };
    expect(lobbyMessageSchema.safeParse(lobby).success).toBe(true);
    expect(lobbyMessageSchema.safeParse({ ...lobby, secret: "hidden" }).success).toBe(false);

    const view = {
      seat: 0,
      round: 1,
      phase: "in_round",
      currentSeat: 0,
      hand: [{ suit: "H", rank: 7 }],
      legalCards: ["7H"],
      turnPlan: "auto_play",
      table: { H: null, D: null, C: null, S: null },
      handCounts: [13, 13, 13, 13],
      playableCounts: [null, null, null, null],
      totals: [0, 0, 0, 0],
      roundScores: null,
      roundWinner: null,
      winners: null,
    };
    expect(viewMessageSchema.safeParse(view).success).toBe(true);
    expect(viewMessageSchema.safeParse({ ...view, playableCounts: [4, null, null, null] }).success).toBe(false);
    expect(viewMessageSchema.safeParse({ ...view, playableCounts: [null, null, null] }).success).toBe(false);
    expect(viewMessageSchema.safeParse({ ...view, otherHand: [] }).success).toBe(false);
    expect(eventMessageSchema.safeParse({ type: "passed", seat: 1 }).success).toBe(true);
    expect(eventMessageSchema.safeParse({ type: "passed", seat: 1, cards: [] }).success).toBe(false);
    expect(errorMessageSchema.safeParse({ code: "INVALID", message: "bad input" }).success).toBe(true);
    expect(errorMessageSchema.safeParse({ code: "INVALID", message: "bad input", secret: "x" }).success).toBe(false);
  });
});
