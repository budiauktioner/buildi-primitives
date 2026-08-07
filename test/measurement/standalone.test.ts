import { describe, expect, it } from "vitest";
import * as measurement from "../../src/measurement/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/text-match-confidence.js";
import vectors from "./standalone-dotnet-vectors.json" with { type: "json" };

/**
 * The measurement types that are not quantities: they have no unit table and no
 * conversion, so they do not fit the shared harness. Expectations come from
 * their .NET counterparts.
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
  masked?: string;
  natural?: string;
  format1?: string | null;
  firstDay?: string;
  lastDay?: string;
  properties?: Record<string, string>;
}

interface TypeVectors {
  cases: Case[];
  scans: { text: string; candidates: Record<string, string | number>[] }[];
  hasScan: boolean;
  properties: string[];
}

interface Statics {
  tryParse(input: string): unknown;
  parse(input: string): unknown;
  isValid(input: string): boolean;
  format(input: string, options?: Record<string, unknown>): string | null;
  normalize(input: string, options?: Record<string, unknown>): string | null;
  isNormalized(input: string): boolean;
  findCandidatesInText?(text: string): readonly Record<string, unknown>[];
}

const exported = measurement as unknown as Record<string, unknown>;
const camel = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1);
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const typeNames = Object.keys(vectors);

describe.each(typeNames)("%s against .NET vectors", (typeName) => {
  const data = (vectors as unknown as Record<string, TypeVectors>)[typeName]!;
  const type = exported[typeName] as unknown as Statics;
  const mask = exported[`mask${typeName}`] as (value: unknown) => string;

  it.each(data.cases.map((c) => [c.input, c] as const))("matches for %j", (_input, vector) => {
    const parsed = type.tryParse(vector.input) as Record<string, unknown> | null;

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

    expect(String(parsed)).toBe(vector.toString);
    expect((parsed as { toNormalizedString(): string }).toNormalizedString()).toBe(
      vector.normalized,
    );
    expect(mask(parsed)).toBe(vector.masked);

    if (vector.natural !== undefined) {
      expect((parsed as { toNaturalString(): string }).toNaturalString()).toBe(vector.natural);
    }
    if (vector.format1 !== undefined) {
      expect(type.format(vector.input, { decimals: 1 })).toBe(vector.format1);
    }
    if (vector.firstDay !== undefined) {
      const withDates = parsed as { toFirstDayOfMonth(): Date; toLastDayOfMonth(): Date };
      expect(isoDate(withDates.toFirstDayOfMonth())).toBe(vector.firstDay);
      expect(isoDate(withDates.toLastDayOfMonth())).toBe(vector.lastDay);
    }

    for (const [property, expected] of Object.entries(vector.properties ?? {})) {
      const actual = parsed[camel(property)];

      if (property === "Weighting") {
        // .NET renders the enum by name; this package uses numeric levels.
        expect(actual).toBe(
          measurement.SoundWeighting[expected as keyof typeof measurement.SoundWeighting],
        );
      } else if (typeof actual === "number") {
        expect(String(actual)).toBe(String(Number(expected)));
      } else {
        expect(String(actual)).toBe(expected);
      }
    }
  });

  if (data.hasScan) {
    it.each(data.scans.map((s) => [s.text, s.candidates] as const))(
      "finds the same candidates in %j",
      (text, expected) => {
        const found = type.findCandidatesInText!(text);

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

        expect(found.map((c) => c.confidence)).toEqual(
          expected.map(
            (c) => TextMatchConfidence[c.confidence as keyof typeof TextMatchConfidence],
          ),
        );
      },
    );
  }
});
