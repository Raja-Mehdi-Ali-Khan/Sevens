import { describe, expect, it } from "vitest";
import { generateRoomCode, normalizeRoomCode, releaseRoomCode } from "../src/roomCode";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

describe("room codes", () => {
  it("uses five characters from the allowed alphabet", () => {
    const code = generateRoomCode();
    try {
      expect(code).toHaveLength(5);
      expect([...code].every((character) => ALPHABET.includes(character))).toBe(true);
    } finally {
      releaseRoomCode(code);
    }
  });

  it("allocates distinct codes and normalizes user input", () => {
    const codes = Array.from({ length: 10_000 }, () => generateRoomCode());
    try {
      expect(new Set(codes).size).toBe(10_000);
      expect(normalizeRoomCode(`  ${codes[0]!.toLowerCase()} `)).toBe(codes[0]);
    } finally {
      for (const code of codes) releaseRoomCode(code);
    }
  });
});
