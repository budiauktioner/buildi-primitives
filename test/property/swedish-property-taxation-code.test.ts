import { afterEach, describe, expect, it } from "vitest";
import {
  SwedishPropertyTaxationCategory,
  SwedishPropertyTaxationCode,
} from "../../src/property/index.js";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";

describe("SwedishPropertyTaxationCode.isValid", () => {
  it.each(["220", "320", "110", "420", "630", "890"])("valid %s", (input) => {
    expect(SwedishPropertyTaxationCode.isValid(input)).toBe(true);
  });

  it.each([null, "", " ", "22", "2200", "099", "000", "900", "abc"])("invalid %s", (input) => {
    expect(SwedishPropertyTaxationCode.isValid(input)).toBe(false);
  });
});

describe("SwedishPropertyTaxationCode.tryParse", () => {
  it.each([
    [
      "220",
      "220",
      220,
      SwedishPropertyTaxationCategory.Smahusenhet,
      "Small house unit, developed",
      "Småhusenhet, bebyggd",
    ],
    [
      "320",
      "320",
      320,
      SwedishPropertyTaxationCategory.Hyreshusenhet,
      "Rental property unit, developed, residential",
      "Hyreshusenhet, bebyggd, bostäder",
    ],
    [
      "110",
      "110",
      110,
      SwedishPropertyTaxationCategory.Lantbruksenhet,
      "Agricultural unit, undeveloped",
      "Lantbruksenhet, obebyggd",
    ],
    [
      "630",
      "630",
      630,
      SwedishPropertyTaxationCategory.Elproduktionsenhet,
      "Power production unit, wind power",
      "Elproduktionsenhet, vindkraftverk",
    ],
  ])(
    "extracts known code %s",
    (
      input: string,
      expectedCode: string,
      expectedNumeric: number,
      expectedCategory: SwedishPropertyTaxationCategory,
      expectedEnglish: string,
      expectedSwedish: string,
    ) => {
      const r = SwedishPropertyTaxationCode.tryParse(input);
      expect(r).not.toBeNull();
      expect(r!.code).toBe(expectedCode);
      expect(r!.numericCode).toBe(expectedNumeric);
      expect(r!.category).toBe(expectedCategory);
      expect(r!.englishDescription).toBe(expectedEnglish);
      expect(r!.localizedDescription).toBe(expectedSwedish);
      expect(r!.isKnown).toBe(true);
    },
  );

  it("returns valid result for unknown code with category", () => {
    const r = SwedishPropertyTaxationCode.tryParse("199");
    expect(r).not.toBeNull();
    expect(r!.code).toBe("199");
    expect(r!.numericCode).toBe(199);
    expect(r!.category).toBe(SwedishPropertyTaxationCategory.Lantbruksenhet);
    expect(r!.isKnown).toBe(false);
    expect(r!.englishDescription).toBeNull();
    expect(r!.localizedDescription).toBeNull();
  });

  it.each([null, "", " ", "22", "099"])("returns null for invalid %s", (input) => {
    expect(SwedishPropertyTaxationCode.tryParse(input)).toBeNull();
  });

  it.each(["22", "099"])("Parse throws for invalid %s", (input) => {
    expect(() => SwedishPropertyTaxationCode.parse(input)).toThrow();
  });

  it.each([
    ["  220  ", "220"],
    [" 3 2 0 ", "320"],
  ])("normalizes input %s -> %s", (input, expected) => {
    expect(SwedishPropertyTaxationCode.tryParse(input)!.code).toBe(expected);
  });
});

describe("SwedishPropertyTaxationCode format / normalize / display", () => {
  afterEach(() => PrimitivesDefaults.reset());

  it("format returns localized description for known code", () => {
    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(SwedishPropertyTaxationCode.format("220")).toBe("Småhusenhet, bebyggd");
  });

  it("format returns code for unknown valid code", () => {
    expect(SwedishPropertyTaxationCode.format("199")).toBe("199");
  });

  it.each([
    [null, null],
    ["", null],
    ["22", null],
  ])("format invalid %s -> %s", (input, expected) => {
    expect(SwedishPropertyTaxationCode.format(input)).toBe(expected);
  });

  it.each([
    ["220", "220"],
    [" 220 ", "220"],
    [null, null],
    ["22", null],
  ])("normalize %s -> %s", (input, expected) => {
    expect(SwedishPropertyTaxationCode.normalize(input)).toBe(expected);
  });

  it.each([
    ["220", true],
    [" 220 ", false],
    [null, false],
  ])("isNormalized %s -> %s", (input, expected) => {
    expect(SwedishPropertyTaxationCode.isNormalized(input)).toBe(expected);
  });

  it("format with fallback returns trimmed input for invalid", () => {
    expect(
      SwedishPropertyTaxationCode.format("  22  ", { fallbackToTrimmedInputWhenInvalid: true }),
    ).toBe("22");
    expect(
      SwedishPropertyTaxationCode.format(null, { fallbackToTrimmedInputWhenInvalid: true }),
    ).toBeNull();
  });

  it("toString returns localized description for known code", () => {
    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(SwedishPropertyTaxationCode.parse("220").toString()).toBe("Småhusenhet, bebyggd");
  });

  it("toString returns code for unknown", () => {
    expect(SwedishPropertyTaxationCode.parse("199").toString()).toBe("199");
  });

  it("toNormalizedString returns code", () => {
    expect(SwedishPropertyTaxationCode.parse("220").toNormalizedString()).toBe("220");
  });
});

describe("SwedishPropertyTaxationCode category mapping", () => {
  it.each([
    [100, SwedishPropertyTaxationCategory.Lantbruksenhet],
    [200, SwedishPropertyTaxationCategory.Smahusenhet],
    [300, SwedishPropertyTaxationCategory.Hyreshusenhet],
    [400, SwedishPropertyTaxationCategory.Industrienhet],
    [500, SwedishPropertyTaxationCategory.Taktmark],
    [600, SwedishPropertyTaxationCategory.Elproduktionsenhet],
    [700, SwedishPropertyTaxationCategory.Specialenhet],
    [800, SwedishPropertyTaxationCategory.OvrigMark],
  ])("category for %s is %s", (numeric, expected) => {
    expect(SwedishPropertyTaxationCode.parse(numeric.toString()).category).toBe(expected);
  });
});

describe("SwedishPropertyTaxationCode equality and ordering", () => {
  it("same value equal", () => {
    expect(
      SwedishPropertyTaxationCode.parse("220").equals(SwedishPropertyTaxationCode.parse("220")),
    ).toBe(true);
  });

  it("different not equal", () => {
    expect(
      SwedishPropertyTaxationCode.parse("220").equals(SwedishPropertyTaxationCode.parse("320")),
    ).toBe(false);
  });

  it("equals null", () => {
    expect(SwedishPropertyTaxationCode.parse("220").equals(null)).toBe(false);
  });

  it("compareTo orders", () => {
    const a = SwedishPropertyTaxationCode.parse("220");
    const b = SwedishPropertyTaxationCode.parse("320");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(a)).toBe(0);
  });

  it("compareTo null", () => {
    expect(SwedishPropertyTaxationCode.parse("220").compareTo(null)).toBe(1);
  });
});
