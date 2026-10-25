import { describe, expect, it } from "vitest";
import { hintLabel } from "./hintLabel";

describe("hintLabel", () => {
  it("formats the count without exposing card identities", () => {
    expect(hintLabel(0)).toBe("0 playable");
    expect(hintLabel(1)).toBe("1 playable");
    expect(hintLabel(3)).toBe("3 playable");
  });
});
