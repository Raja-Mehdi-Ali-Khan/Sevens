import { describe, expect, it } from "vitest";
import { parseClientOrigins } from "../src/cors";

describe("parseClientOrigins", () => {
  it("trims and de-duplicates a comma-separated origin list", () => {
    expect(parseClientOrigins(" https://cards.example , https://play.example/ ,https://cards.example", "production"))
      .toEqual(["https://cards.example", "https://play.example"]);
  });

  it("defaults to the local Vite origin outside production", () => {
    expect(parseClientOrigins(undefined, "development")).toEqual(["http://localhost:5173"]);
  });

  it("allows no browser origins in production when not configured", () => {
    expect(parseClientOrigins(undefined, "production")).toEqual([]);
  });

  it("rejects URLs that are not origins", () => {
    expect(() => parseClientOrigins("https://cards.example/path", "production"))
      .toThrow("CLIENT_ORIGIN values must be HTTP or HTTPS origins");
  });
});
