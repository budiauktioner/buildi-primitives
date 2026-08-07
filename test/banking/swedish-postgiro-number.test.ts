import { describe, expect, it } from "vitest";
import { SwedishPostgiroNumber, maskSwedishPostgiroNumber } from "../../src/banking/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("SwedishPostgiroNumber.isValid", () => {
  it.each(["4131300-8", "900122-3", "10000-8"])("returns true for %s", (input) => {
    expect(SwedishPostgiroNumber.isValid(input)).toBe(true);
  });

  it.each([null, "", " ", "1234567-8", "1"])("returns false for %s", (input) => {
    expect(SwedishPostgiroNumber.isValid(input)).toBe(false);
  });
});

describe("SwedishPostgiroNumber.tryParse", () => {
  it.each([
    ["4131300-8", "41313008", "4131300-8"],
    ["41313008", "41313008", "4131300-8"],
    [" 4131300 8 ", "41313008", "4131300-8"],
  ])("parses %s", (input, digits, formatted) => {
    const r = SwedishPostgiroNumber.tryParse(input)!;
    expect(r.digits).toBe(digits);
    expect(r.formatted).toBe(formatted);
  });
});

describe("SwedishPostgiroNumber string conversions", () => {
  it("toDisplayString prefixes with Plusgiro", () => {
    expect(SwedishPostgiroNumber.parse("4131300-8").toDisplayString()).toBe("Plusgiro 4131300-8");
  });
  it("toShortDisplayString prefixes with PG", () => {
    expect(SwedishPostgiroNumber.parse("4131300-8").toShortDisplayString()).toBe("PG 4131300-8");
  });
});

describe("SwedishPostgiroNumber.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["1", false, ValidationErrorReason.InvalidLength],
    ["1234-5", false, ValidationErrorReason.InvalidCheckDigit],
    ["4131300-8", true, null],
  ])("validates %s", (input, expected, reason) => {
    const r = SwedishPostgiroNumber.validate(input as string | null);
    expect(r.isValid).toBe(expected);
    if (reason) expect(r.issues[0]!.reason).toBe(reason);
  });
});

describe("maskSwedishPostgiroNumber", () => {
  it("default shows control digit", () => {
    expect(maskSwedishPostgiroNumber(SwedishPostgiroNumber.parse("4131300-8"))).toBe("*******-8");
  });
  it("can hide control digit", () => {
    expect(
      maskSwedishPostgiroNumber(SwedishPostgiroNumber.parse("4131300-8"), {
        showControlDigit: false,
      }),
    ).toBe("4131300-*");
  });
});

describe("SwedishPostgiroNumber.findCandidatesInText", () => {
  it("finds plusgiro in text", () => {
    const cands = SwedishPostgiroNumber.findCandidatesInText("Pay plusgiro 4131300-8 today.");
    expect(cands.length).toBe(1);
  });
});
