import { describe, expect, it } from "vitest";
import * as measurement from "../../src/measurement/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/text-match-confidence.js";
import vectors from "./quantity-dotnet-vectors.json" with { type: "json" };

/**
 * Runs every quantity type against expectations captured from its .NET
 * counterpart. The inputs are derived from each unit's symbol, names, plurals
 * and aliases, so a unit table that is wrong in any field shows up here.
 *
 * `Temperature` is absent because it converts by offset rather than by factor
 * and is tested separately.
 */

interface Case {
  input: string;
  valid: boolean;
  format: string | null;
  formatFallback: string | null;
  normalize: string | null;
  normalizeFallback: string | null;
  isNormalized: boolean;
  isValid: boolean;
  toString?: string;
  normalized?: string;
  originalUnit?: string;
  naturalUnit?: string;
  natural?: string;
  natural2?: string;
  inLastUnit?: string;
  inLastUnit3?: string;
  masked?: string;
  values?: Record<string, string>;
}

interface TypeVectors {
  cases: Case[];
  unitLookup: (string | null)[][];
  scans: { text: string; candidates: Record<string, string | number>[] }[];
  accessors: string[];
  lastUnit: string;
  hasNatural: boolean;
}

interface QuantityStatics {
  tryParse(input: string): unknown;
  parse(input: string): unknown;
  isValid(input: string): boolean;
  format(input: string, options?: Record<string, unknown>): string | null;
  normalize(input: string, options?: Record<string, unknown>): string | null;
  isNormalized(input: string): boolean;
  findCandidatesInText(text: string): readonly Record<string, unknown>[];
  typeInfo: { englishName: string };
}

interface QuantityInstance {
  toString(): string;
  toNormalizedString(): string;
  toNaturalString(decimals?: number): string;
  toStringInUnit(unit: unknown, decimals?: number): string;
  originalUnit: { symbol: string };
  naturalUnit: { symbol: string };
}

const exported = measurement as unknown as Record<string, unknown>;
const camel = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1);

const typeNames = Object.keys(vectors);

describe.each(typeNames)("%s against .NET vectors", (typeName) => {
  const data = (vectors as unknown as Record<string, TypeVectors>)[typeName]!;
  const type = exported[typeName] as unknown as QuantityStatics;
  const unitType = exported[`${typeName}Unit`] as unknown as {
    tryParse(input: string): { symbol: string } | null;
    all: readonly { symbol: string }[];
  };
  const lastUnit = unitType.all[unitType.all.length - 1]!;
  const mask = exported[`mask${typeName}`] as (value: unknown) => string;

  it.each(data.cases.map((c) => [c.input, c] as const))("matches for %j", (_input, vector) => {
    const parsed = type.tryParse(vector.input) as QuantityInstance | null;

    expect(parsed !== null).toBe(vector.valid);
    expect(type.isValid(vector.input)).toBe(vector.isValid);
    expect(type.format(vector.input)).toBe(vector.format);
    expect(type.format(vector.input, { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      vector.formatFallback,
    );
    expect(type.normalize(vector.input)).toBe(vector.normalize);
    expect(type.normalize(vector.input, { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      vector.normalizeFallback,
    );
    expect(type.isNormalized(vector.input)).toBe(vector.isNormalized);

    if (parsed === null) return;

    expect(parsed.toString()).toBe(vector.toString);
    expect(parsed.toNormalizedString()).toBe(vector.normalized);
    expect(parsed.originalUnit.symbol).toBe(vector.originalUnit);
    expect(parsed.toStringInUnit(lastUnit)).toBe(vector.inLastUnit);
    expect(parsed.toStringInUnit(lastUnit, 3)).toBe(vector.inLastUnit3);
    expect(mask(parsed)).toBe(vector.masked);

    if (data.hasNatural) {
      expect(parsed.naturalUnit.symbol).toBe(vector.naturalUnit);
      expect(parsed.toNaturalString()).toBe(vector.natural);
      expect(parsed.toNaturalString(2)).toBe(vector.natural2);
    }

    const instance = parsed as unknown as Record<string, number>;
    for (const [property, expected] of Object.entries(vector.values ?? {})) {
      expect(String(instance[camel(property)])).toBe(String(Number(expected)));
    }
  });

  it.each(data.unitLookup)("resolves the unit %j to %s", (input, expected) => {
    expect(unitType.tryParse(input as string)?.symbol ?? null).toBe(expected);
  });

  it.each(data.scans.map((s) => [s.text, s.candidates] as const))(
    "finds the same candidates in %j",
    (text, expected) => {
      const found = type.findCandidatesInText(text);

      for (const field of [
        "startIndex",
        "length",
        "originalText",
        "normalizedForm",
        "formattedForm",
        "maskedForm",
      ]) {
        expect(found.map((c) => c[field])).toEqual(expected.map((c) => c[field]));
      }

      // .NET serializes the enum name; this package uses numeric levels.
      expect(found.map((c) => c.confidence)).toEqual(
        expected.map((c) => TextMatchConfidence[c.confidence as keyof typeof TextMatchConfidence]),
      );
    },
  );

  it("exposes a named accessor for every .NET accessor", () => {
    const instance = type.parse(data.cases.find((c) => c.valid)!.input) as Record<string, unknown>;
    for (const accessor of data.accessors) {
      expect(typeof instance[camel(accessor)]).toBe("number");
    }
  });

  it("throws from parse for invalid input", () => {
    expect(() => type.parse("definitely not a measurement")).toThrow(
      `Invalid ${type.typeInfo.englishName.toLowerCase()}.`,
    );
  });
});
