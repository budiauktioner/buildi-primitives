import { describe, expect, it } from "vitest";
import * as product from "../../src/product/index.js";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";
import { TextMatchConfidence } from "../../src/text-scanning/text-match-confidence.js";
import vectors from "./value-dotnet-vectors.json" with { type: "json" };

/**
 * The Product types that carry a structured value rather than a name from a closed
 * set: capacities, identifiers, sizes and colors. Inputs come from the .NET suite's
 * own inline data, expanded into casing and spacing variants, and every expectation
 * was captured by running the .NET implementation over them.
 */

interface Case {
  input: string;
  valid: boolean;
  isValid: boolean;
  format: string | null;
  formatFallback: string | null;
  normalize: string | null;
  normalizeFallback: string | null;
  isNormalized: boolean;
  toString?: string;
  toNormalizedString?: string;
  toNaturalString?: string;
  masked?: string;
  properties?: Record<string, string | number | boolean | null>;
}

interface ScanCase {
  text: string;
  candidates: {
    text: string;
    start: number;
    length: number;
    normalized: string;
    formatted: string;
    masked: string;
    typeName: string;
    category: string;
    confidence: string;
  }[];
}

interface TypeVectors {
  typeInfo: { englishName: string; localizedName: string; emoji: string; sources: string[] };
  properties: { name: string; type: string; nullable: boolean }[];
  hasMask: boolean;
  cases: Case[];
  scans: ScanCase[];
}

interface ValueType {
  typeInfo: { englishName: string; localizedName: string; emoji: string; sources: string[] };
  tryParse(input: string | null | undefined): Record<string, unknown> | null;
  parse(input: string): Record<string, unknown>;
  isValid(input: string | null | undefined): boolean;
  format(input: string | null | undefined, options?: Record<string, unknown>): string | null;
  normalize(input: string | null | undefined, options?: Record<string, unknown>): string | null;
  isNormalized(input: string | null | undefined): boolean;
  findCandidatesInText?(text: string): readonly Record<string, unknown>[];
}

const exported = product as unknown as Record<string, unknown>;
const allVectors = vectors as unknown as Record<string, TypeVectors>;

const camel = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1);

/** Where a C# name only exists to dodge a type-name collision, TypeScript uses the plain one. */
const PROPERTY_ALIASES: Record<string, Record<string, string>> = {
  BatteryCapacity: { EnergyValue: "energy" },
};

/** Properties that hold another primitive rather than a scalar are checked via its string form. */
const NESTED_PROPERTY_TYPES = new Set([
  "DataSize",
  "ElectricCharge",
  "Energy",
  "Frequency",
  "Length",
  "OperatingSystemName",
  "OperatingSystemVersion",
]);

/** Nested C# enums are const objects in TypeScript, so members compare by name. */
const NESTED_ENUM_TYPES = new Set([
  "ClothingSizeSystem",
  "HsCodeLevel",
  "OperatingSystemFamily",
  "ShoeSizeSystem",
]);

/** The .NET run that produced these vectors used the invariant English culture. */
const inEnglish = <T>(run: () => T): T => {
  PrimitivesDefaults.uiCulture = "en-US";
  try {
    return run();
  } finally {
    PrimitivesDefaults.reset();
  }
};

/** Types still waiting for a port; the list shrinks to empty as the namespace is finished. */
const NOT_YET_PORTED = [
  "Color",
  "CameraResolution",
  "ScreenResolution",
  "ScreenSize",
  "IpRating",
  "HsCode",
  "GoogleProductCategory",
  "OperatingSystemInfo",
  "OperatingSystemName",
  "OperatingSystemVersion",
];

const ported = Object.keys(allVectors).filter((name) => exported[name] !== undefined);

it("has ported every Product value type that is not on the waiting list", () => {
  const expected = Object.keys(allVectors).filter((name) => !NOT_YET_PORTED.includes(name));
  expect(ported).toEqual(expected);
});

describe.each(ported)("%s against .NET vectors", (typeName) => {
  const data = allVectors[typeName]!;
  const type = exported[typeName] as ValueType;
  const mask = exported[`mask${typeName}`] as ((value: unknown) => string) | undefined;

  it("exposes the same type info", () => {
    expect(type.typeInfo.englishName).toBe(data.typeInfo.englishName);
    expect(type.typeInfo.localizedName).toBe(data.typeInfo.localizedName);
    expect(type.typeInfo.emoji).toBe(data.typeInfo.emoji);
    expect([...type.typeInfo.sources]).toEqual(data.typeInfo.sources);
  });

  if (data.hasMask) {
    it("exposes a masking helper", () => {
      expect(mask).toBeTypeOf("function");
    });
  }

  it.each(data.cases.map((c) => [c.input, c] as const))("parses %j like .NET", (_input, vector) => {
    inEnglish(() => {
      const parsed = type.tryParse(vector.input);

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

      if (parsed === null) {
        expect(() => type.parse(vector.input)).toThrow();
        return;
      }

      expect(String(parsed)).toBe(vector.toString);
      if (vector.toNormalizedString !== undefined) {
        expect((parsed.toNormalizedString as () => string).call(parsed)).toBe(
          vector.toNormalizedString,
        );
      }
      if (vector.toNaturalString !== undefined) {
        expect((parsed.toNaturalString as () => string).call(parsed)).toBe(vector.toNaturalString);
      }
      if (vector.masked !== undefined && mask) {
        expect(mask(parsed)).toBe(vector.masked);
      }

      for (const prop of data.properties) {
        const expected = vector.properties?.[prop.name];
        const actual = parsed[PROPERTY_ALIASES[typeName]?.[prop.name] ?? camel(prop.name)];
        if (expected === undefined) continue;

        if (Array.isArray(expected)) {
          expect(actual).toEqual(expected);
        } else if (expected === null) {
          expect(actual ?? null).toBeNull();
        } else if (NESTED_PROPERTY_TYPES.has(prop.type)) {
          expect(String(actual)).toBe(expected);
        } else if (NESTED_ENUM_TYPES.has(prop.type)) {
          const members = exported[prop.type] as Record<string, number>;
          expect(actual).toBe(members[expected as string]);
        } else if (prop.type === "Decimal") {
          // .NET keeps the scale of a decimal, so 3.5 GHz reads back as 3500000000.0 hertz;
          // the TypeScript getters expose plain numbers and compare by magnitude.
          expect(Number(actual)).toBeCloseTo(Number(expected), 9);
        } else {
          expect(actual ?? null).toBe(expected);
        }
      }
    });
  });

  it("treats null and undefined as invalid", () => {
    expect(type.tryParse(null)).toBeNull();
    expect(type.tryParse(undefined)).toBeNull();
    expect(type.isValid(null)).toBe(false);
    expect(type.format(null)).toBeNull();
    expect(type.normalize(null)).toBeNull();
    expect(type.isNormalized(null)).toBe(false);
  });

  if (data.scans.length > 0) {
    it.each(data.scans.map((s) => [s.text, s] as const))("scans %j like .NET", (_text, scan) => {
      const found = inEnglish(() => type.findCandidatesInText!(scan.text));
      expect(found.map((c) => c.originalText)).toEqual(scan.candidates.map((c) => c.text));

      for (const [index, expected] of scan.candidates.entries()) {
        const candidate = found[index]!;
        expect(candidate.startIndex).toBe(expected.start);
        expect(candidate.length).toBe(expected.length);
        expect(candidate.normalizedForm).toBe(expected.normalized);
        expect(candidate.formattedForm).toBe(expected.formatted);
        expect(candidate.maskedForm).toBe(expected.masked);
        expect(candidate.typeName).toBe(expected.typeName);
        expect(candidate.category).toBe(expected.category);
        expect(candidate.confidence).toBe(
          TextMatchConfidence[expected.confidence as keyof typeof TextMatchConfidence],
        );
      }
    });
  }
});
