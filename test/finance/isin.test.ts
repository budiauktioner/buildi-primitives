import { describe, expect, it } from "vitest";
import { Isin, maskIsin } from "../../src/finance/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/index.js";

describe("Isin.isValid", () => {
  it.each(["SE0000108656", "SE0000667891", "US0378331005", "GB0002374006", "DE0007164600"])(
    "isValid for %s",
    (input) => {
      expect(Isin.isValid(input)).toBe(true);
    },
  );

  it.each([
    null,
    "",
    " ",
    "SE000010865",
    "SE00001086560",
    "SE0000108657",
    "12SE00001086",
    "ABCDEFGHIJKL",
    "1234567890AB",
  ])("invalid input %s", (input) => {
    expect(Isin.isValid(input)).toBe(false);
  });
});

describe("Isin.tryParse / parse", () => {
  it.each([
    ["SE0000108656", "SE", "000010865", "6"],
    ["US0378331005", "US", "037833100", "5"],
    ["GB0002374006", "GB", "000237400", "6"],
  ])(
    "extracts components from %s",
    (input: string, expectedCountry: string, expectedNsin: string, expectedCheckDigit: string) => {
      const r = Isin.tryParse(input);
      expect(r).not.toBeNull();
      expect(r!.value).toBe(input);
      expect(r!.countryCode).toBe(expectedCountry);
      expect(r!.nsin).toBe(expectedNsin);
      expect(r!.checkDigit).toBe(expectedCheckDigit);
    },
  );

  it.each([null, "", " ", "INVALID", "SE0000108657"])("returns null for %s", (input) => {
    expect(Isin.tryParse(input)).toBeNull();
  });

  it.each(["INVALID", "SE0000108657"])("Parse throws for %s", (input) => {
    expect(() => Isin.parse(input)).toThrow();
  });

  it.each([
    ["se0000108656", "SE0000108656"],
    ["SE 0000 1086 56", "SE0000108656"],
    ["  SE0000108656  ", "SE0000108656"],
    ["se-0000-108656", "SE0000108656"],
  ])("normalizes %s -> %s", (input, expected) => {
    const r = Isin.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.value).toBe(expected);
  });
});

describe("Isin format / normalize", () => {
  it.each([
    ["SE0000108656", "SE0000108656"],
    ["se0000108656", "SE0000108656"],
    [null, null],
    ["", null],
    ["INVALID", null],
  ])("format(%s) -> %s", (input, expected) => {
    expect(Isin.format(input)).toBe(expected);
  });

  it.each([
    ["SE0000108656", "SE0000108656"],
    ["se0000108656", "SE0000108656"],
    [null, null],
    ["INVALID", null],
  ])("normalize(%s) -> %s", (input, expected) => {
    expect(Isin.normalize(input)).toBe(expected);
  });

  it.each([
    ["SE0000108656", true],
    ["se0000108656", false],
    [null, false],
  ])("isNormalized(%s) -> %s", (input, expected) => {
    expect(Isin.isNormalized(input)).toBe(expected);
  });

  it("format with fallback returns trimmed input for invalid", () => {
    expect(Isin.format("  INVALID  ", { fallbackToTrimmedInputWhenInvalid: true })).toBe("INVALID");
    expect(Isin.format(null, { fallbackToTrimmedInputWhenInvalid: true })).toBeNull();
    expect(Isin.format("  ", { fallbackToTrimmedInputWhenInvalid: true })).toBeNull();
  });

  it("normalize with fallback returns trimmed input for invalid", () => {
    expect(Isin.normalize("  INVALID  ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "INVALID",
    );
    expect(Isin.normalize(null, { fallbackToTrimmedInputWhenInvalid: true })).toBeNull();
    expect(Isin.normalize("  ", { fallbackToTrimmedInputWhenInvalid: true })).toBeNull();
  });

  it("toString returns value", () => {
    const r = Isin.parse("SE0000108656");
    expect(r.toString()).toBe("SE0000108656");
    expect(r.toNormalizedString()).toBe("SE0000108656");
  });
});

describe("Isin equality and ordering", () => {
  it("same value is equal", () => {
    expect(Isin.parse("SE0000108656").equals(Isin.parse("SE0000108656"))).toBe(true);
  });

  it("different values not equal", () => {
    expect(Isin.parse("SE0000108656").equals(Isin.parse("US0378331005"))).toBe(false);
  });

  it("compareTo orders correctly", () => {
    const a = Isin.parse("GB0002374006");
    const b = Isin.parse("SE0000108656");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(a)).toBe(0);
  });

  it("compareTo null returns positive", () => {
    expect(Isin.parse("SE0000108656").compareTo(null)).toBe(1);
  });
});

describe("Isin.findCandidatesInText", () => {
  it("finds ISIN in text", () => {
    const r = Isin.findCandidatesInText("Volvo har ISIN SE0000108656 enligt prospekt.");
    expect(r).toHaveLength(1);
    expect(r[0]!.confidence).toBe(TextMatchConfidence.High);
    expect(r[0]!.value.value).toBe("SE0000108656");
    expect(r[0]!.maskedForm).toBe("SE**********");
  });

  it("returns empty for text without ISINs", () => {
    expect(Isin.findCandidatesInText("Inga ISIN här.")).toHaveLength(0);
  });

  it("returns empty for empty input", () => {
    expect(Isin.findCandidatesInText("")).toHaveLength(0);
  });

  it("filters out invalid Luhn", () => {
    expect(Isin.findCandidatesInText("Tomt SE0000108657 falskt.")).toHaveLength(0);
  });
});

describe("maskIsin", () => {
  it("masks ISIN preserving country code", () => {
    expect(maskIsin(Isin.parse("SE0000108656"))).toBe("SE**********");
  });
});
