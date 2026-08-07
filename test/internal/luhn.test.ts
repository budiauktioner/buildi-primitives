import { describe, expect, it } from "vitest";
import { luhnIsValid } from "../../src/internal/luhn.js";

describe("luhnIsValid", () => {
  it.each([
    ["4242424242424242"], // Visa example, well-known valid Luhn
    ["79927398713"], // Wikipedia Luhn example
    ["8112289874"],
    ["1881129009"],
  ])("returns true for valid Luhn input %s", (input) => {
    expect(luhnIsValid(input)).toBe(true);
  });

  it.each([["1234567890"], ["8112289875"], ["1881129002"], ["abc"], [""], ["123 456"]])(
    "returns false for invalid Luhn input %s",
    (input) => {
      expect(luhnIsValid(input)).toBe(false);
    },
  );
});
