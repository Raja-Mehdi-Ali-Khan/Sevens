import { describe, expect, it } from "vitest";
import {
  isValidPlayerName,
  isValidRoomCode,
  normalizePlayerName,
  normalizeRoomCode,
  parseInviteCode,
} from "./home";

describe("home form helpers", () => {
  it("accepts valid names and trims whitespace", () => {
    expect(isValidPlayerName(" Alice ")).toBe(true);
    expect(normalizePlayerName(" Alice ")).toBe("Alice");
  });

  it("rejects blank names and names longer than 20 characters", () => {
    expect(isValidPlayerName("   ")).toBe(false);
    expect(isValidPlayerName("123456789012345678901")).toBe(false);
  });

  it("normalizes lower-case room codes before validating them", () => {
    expect(normalizeRoomCode("abcde")).toBe("ABCDE");
    expect(isValidRoomCode("abcde")).toBe(true);
  });

  it("rejects room codes with invalid length or characters", () => {
    expect(isValidRoomCode("ABCD")).toBe(false);
    expect(isValidRoomCode("ABCDO")).toBe(false);
    expect(isValidRoomCode("AB12!" )).toBe(false);
  });

  it("parses a normalized invite code and returns null when it is missing or invalid", () => {
    expect(parseInviteCode("?code=abcde")).toBe("ABCDE");
    expect(parseInviteCode("?room=ABCDE")).toBeNull();
    expect(parseInviteCode("?code=ABCDO")).toBeNull();
  });
});
