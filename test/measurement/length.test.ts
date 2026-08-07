import { describe, expect, it } from "vitest";
import { Length, LengthUnit, maskLength } from "../../src/measurement/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/text-match-confidence.js";
import vectors from "./length-dotnet-vectors.json" with { type: "json" };

/**
 * Expectations are captured from the .NET `Length` type rather than written by
 * hand, so this compares against the behavioural specification directly.
 */

interface Case {
  input: string;
  valid: string;
  toString?: string;
  normalized?: string;
  natural?: string;
  natural2?: string;
  originalUnit?: string;
  naturalUnit?: string;
  meters?: string;
  kilometers?: string;
  feet?: string;
  inches?: string;
  swedishMiles?: string;
  inKm?: string;
  inFt3?: string;
  masked?: string;
  format: string | null;
  formatFallback: string | null;
  formatKm: string | null;
  formatKm2: string | null;
  normalize: string | null;
  normalizeFallback: string | null;
  isNormalized: string;
  isValid: string;
}

interface ScanCandidate {
  startIndex: number;
  length: number;
  originalText: string;
  normalizedForm: string;
  formattedForm: string;
  maskedForm: string;
  confidence: string;
}

const cases = vectors.cases as unknown as Case[];

describe("Length against .NET vectors", () => {
  it.each(cases.map((c) => [c.input, c] as const))("matches .NET for %j", (_input, vector) => {
    const parsed = Length.tryParse(vector.input);
    const expectedValid = vector.valid === "true";

    expect(parsed !== null).toBe(expectedValid);
    expect(Length.isValid(vector.input)).toBe(vector.isValid === "true");

    if (parsed !== null) {
      expect(parsed.toString()).toBe(vector.toString);
      expect(parsed.toNormalizedString()).toBe(vector.normalized);
      expect(parsed.toNaturalString()).toBe(vector.natural);
      expect(parsed.toNaturalString(2)).toBe(vector.natural2);
      expect(parsed.originalUnit.symbol).toBe(vector.originalUnit);
      expect(parsed.naturalUnit.symbol).toBe(vector.naturalUnit);
      expect(parsed.toStringInUnit(LengthUnit.Kilometer)).toBe(vector.inKm);
      expect(parsed.toStringInUnit(LengthUnit.Foot, 3)).toBe(vector.inFt3);
      expect(maskLength(parsed)).toBe(vector.masked);

      expect(String(parsed.meters)).toBe(String(Number(vector.meters)));
      expect(String(parsed.kilometers)).toBe(String(Number(vector.kilometers)));
      expect(String(parsed.feet)).toBe(String(Number(vector.feet)));
      expect(String(parsed.inches)).toBe(String(Number(vector.inches)));
      expect(String(parsed.swedishMiles)).toBe(String(Number(vector.swedishMiles)));
    }

    expect(Length.format(vector.input)).toBe(vector.format);
    expect(Length.format(vector.input, { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      vector.formatFallback,
    );
    expect(Length.format(vector.input, { unit: LengthUnit.Kilometer })).toBe(vector.formatKm);
    expect(Length.format(vector.input, { unit: LengthUnit.Kilometer, decimals: 2 })).toBe(
      vector.formatKm2,
    );
    expect(Length.normalize(vector.input)).toBe(vector.normalize);
    expect(Length.normalize(vector.input, { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      vector.normalizeFallback,
    );
    expect(Length.isNormalized(vector.input)).toBe(vector.isNormalized === "true");
  });

  it.each(vectors.natural as unknown as string[][])(
    "picks the natural unit for %s m",
    (meters, expectedSymbol, expectedString) => {
      const parsed = Length.parse(`${meters} m`);
      expect(parsed.naturalUnit.symbol).toBe(expectedSymbol);
      expect(parsed.toNaturalString()).toBe(expectedString);
    },
  );

  it.each(
    (vectors.scans as unknown as { text: string; candidates: ScanCandidate[] }[]).map(
      (s) => [s.text, s.candidates] as const,
    ),
  )("finds the same candidates in %j", (text, expected) => {
    const found = Length.findCandidatesInText(text);

    expect(found.map((c) => c.originalText)).toEqual(expected.map((c) => c.originalText));
    expect(found.map((c) => c.startIndex)).toEqual(expected.map((c) => c.startIndex));
    expect(found.map((c) => c.length)).toEqual(expected.map((c) => c.length));
    expect(found.map((c) => c.normalizedForm)).toEqual(expected.map((c) => c.normalizedForm));
    expect(found.map((c) => c.formattedForm)).toEqual(expected.map((c) => c.formattedForm));
    expect(found.map((c) => c.maskedForm)).toEqual(expected.map((c) => c.maskedForm));
    // .NET serializes the enum name; this package uses ordered numeric levels.
    expect(found.map((c) => c.confidence)).toEqual(
      expected.map((c) => TextMatchConfidence[c.confidence as keyof typeof TextMatchConfidence]),
    );
  });
});

describe("Length.parse", () => {
  it("throws for invalid input", () => {
    expect(() => Length.parse("nonsense")).toThrow("Invalid length.");
  });

  it("returns an instance for valid input", () => {
    expect(Length.parse("10 km").toNormalizedString()).toBe("10000 m");
  });
});

describe("Length factories", () => {
  it.each([
    ["fromMeters", Length.fromMeters(10), "10 m"],
    ["fromKilometers", Length.fromKilometers(1.5), "1.5 km"],
    ["fromCentimeters", Length.fromCentimeters(250), "250 cm"],
    ["fromFeet", Length.fromFeet(3), "3 ft"],
    ["fromInches", Length.fromInches(7), "7 in"],
    ["fromSwedishMiles", Length.fromSwedishMiles(2), "2 mil"],
    ["fromNanometers", Length.fromNanometers(1), "1 nm"],
  ])("%s round-trips through toString", (_name, length, expected) => {
    expect(length.toString()).toBe(expected);
  });

  it("scales exactly, avoiding binary floating point drift", () => {
    expect(Length.fromFeet(3).toNormalizedString()).toBe("0.9144 m");
    expect(Length.fromInches(7).toNormalizedString()).toBe("0.1778 m");
  });

  it("handles numbers JavaScript renders in exponent notation", () => {
    expect(Length.fromMeters(1e-7).toNormalizedString()).toBe("0.0000001 m");
  });

  it("creates from a value and unit", () => {
    expect(Length.create(2, LengthUnit.Kilometer).toNormalizedString()).toBe("2000 m");
  });
});

describe("Length arithmetic", () => {
  it("adds and subtracts across units", () => {
    const total = Length.parse("1 km").plus(Length.parse("500 m"));
    expect(total.toNormalizedString()).toBe("1500 m");
    expect(total.toString()).toBe("1.5 km");

    expect(Length.parse("1 km").minus(Length.parse("500 m")).toNormalizedString()).toBe("500 m");
  });

  it("compares across units", () => {
    expect(Length.parse("1 km").equals(Length.parse("1000 m"))).toBe(true);
    expect(Length.parse("1 km").isGreaterThan(Length.parse("999 m"))).toBe(true);
    expect(Length.parse("999 m").isLessThan(Length.parse("1 km"))).toBe(true);
    expect(Length.parse("1 km").compareTo(null)).toBe(1);
    expect(Length.parse("1 km").equals(null)).toBe(false);
  });

  it("negates", () => {
    expect(Length.parse("3 ft").negated().toNormalizedString()).toBe("-0.9144 m");
  });
});

describe("Length.typeInfo", () => {
  it("carries the .NET metadata", () => {
    expect(Length.typeInfo.englishName).toBe("Length");
    expect(Length.typeInfo.localizedName).toBe("Längd");
    expect(Length.typeInfo.emoji).toBe("📏");
    expect(Length.typeInfo.sources.length).toBeGreaterThan(0);
  });
});
