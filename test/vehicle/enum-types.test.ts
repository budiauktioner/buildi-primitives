import { afterEach, describe, expect, it } from "vitest";
import * as vehicle from "../../src/vehicle/index.js";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";
import { TextMatchConfidence } from "../../src/text-scanning/text-match-confidence.js";
import metadata from "./enum-dotnet-metadata.json" with { type: "json" };
import pairs from "./enum-dotnet-pairs.json" with { type: "json" };
import vectors from "./enum-dotnet-vectors.json" with { type: "json" };

/**
 * The Vehicle types that are closed sets of named values. Each one resolves input
 * through a table of aliases and renders a display name that depends on the UI
 * language, so every expectation here was captured from the .NET implementation
 * under both `en-US` and `sv-SE`.
 */

interface Case {
  input: string;
  valid: boolean;
  member: string | null;
  formatEn: string | null;
  formatFallbackEn: string | null;
  formatSv: string | null;
  normalize: string | null;
  normalizeFallback: string | null;
  isNormalized: boolean;
  toStringEn: string | null;
  toStringSv: string | null;
}

interface MemberView {
  member: string;
  toStringEn: string;
  toStringSv: string;
  [key: string]: string | number | boolean | null;
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
  cases: Case[];
  memberViews: MemberView[];
  scans: ScanCase[];
}

interface Metadata {
  type: string;
  typeInfo: { englishName: string; localizedName: string; emoji: string; sources: string[] };
  properties: { name: string; type: string }[];
  members: Record<string, string | number | boolean | null>[];
  order: string[];
  lookup: [string, string][];
}

interface EnumLike {
  typeInfo: { englishName: string; localizedName: string; emoji: string; sources: string[] };
  all: readonly Record<string, unknown>[];
  tryParse(input: string | null | undefined): Record<string, unknown> | null;
  parse(input: string): Record<string, unknown>;
  isValid(input: string | null | undefined): boolean;
  format(input: string | null | undefined, options?: Record<string, unknown>): string | null;
  normalize(input: string | null | undefined, options?: Record<string, unknown>): string | null;
  isNormalized(input: string | null | undefined): boolean;
  findCandidatesInText?(text: string): readonly Record<string, unknown>[];
}

const exported = vehicle as unknown as Record<string, EnumLike>;
const allVectors = vectors as unknown as Record<string, TypeVectors>;
const allPairs = pairs as unknown as Record<string, [string, string, number, boolean][]>;
const allMetadata = metadata as unknown as Metadata[];

const camel = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1);

/** `DisplayName` is a getter in both languages, so it is compared separately. */
const DERIVED_PROPERTIES = new Set(["DisplayName"]);

const withCulture = <T>(uiCulture: string, run: () => T): T => {
  PrimitivesDefaults.uiCulture = uiCulture;
  try {
    return run();
  } finally {
    PrimitivesDefaults.reset();
  }
};

afterEach(() => {
  PrimitivesDefaults.reset();
});

const typeNames = Object.keys(allVectors);

it("covers every enum-like Vehicle type", () => {
  expect(typeNames.length).toBe(15);
});

describe.each(typeNames)("%s against .NET vectors", (typeName) => {
  const data = allVectors[typeName]!;
  const meta = allMetadata.find((m) => m.type === typeName)!;
  const type = exported[typeName]!;
  const membersByName = new Map(meta.members.map((m) => [m.member as string, m]));

  it("exposes the same type info", () => {
    expect(type.typeInfo.englishName).toBe(meta.typeInfo.englishName);
    expect(type.typeInfo.localizedName).toBe(meta.typeInfo.localizedName);
    expect(type.typeInfo.emoji).toBe(meta.typeInfo.emoji);
    expect([...type.typeInfo.sources]).toEqual(meta.typeInfo.sources);
  });

  it("exposes the same members in the same order", () => {
    const statics = type as unknown as Record<string, Record<string, unknown>>;
    expect(type.all.map((m) => m.value)).toEqual(
      meta.order.map((name) => membersByName.get(name)!.Value ?? membersByName.get(name)!.Code),
    );
    for (const name of meta.order) expect(statics[name]).toBeDefined();
  });

  it.each(data.cases.map((c) => [c.input, c] as const))("parses %j like .NET", (_input, vector) => {
    const parsed = type.tryParse(vector.input);

    expect(parsed !== null).toBe(vector.valid);
    expect(type.isValid(vector.input)).toBe(vector.valid);

    withCulture("en-US", () => {
      expect(type.format(vector.input)).toBe(vector.formatEn);
      expect(type.format(vector.input, { fallbackToTrimmedInputWhenInvalid: true })).toBe(
        vector.formatFallbackEn,
      );
      if (parsed !== null) expect(String(parsed)).toBe(vector.toStringEn);
    });

    withCulture("sv-SE", () => {
      expect(type.format(vector.input)).toBe(vector.formatSv);
      if (parsed !== null) expect(String(parsed)).toBe(vector.toStringSv);
    });

    expect(type.normalize(vector.input)).toBe(vector.normalize);
    expect(type.normalize(vector.input, { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      vector.normalizeFallback,
    );
    expect(type.isNormalized(vector.input)).toBe(vector.isNormalized);

    if (parsed === null) {
      expect(() => type.parse(vector.input)).toThrow();
      return;
    }

    const statics = type as unknown as Record<string, unknown>;
    expect(parsed).toBe(statics[vector.member!]);
    expect((parsed.toNormalizedString as () => string).call(parsed)).toBe(vector.normalize);
  });

  it.each(data.memberViews.map((v) => [v.member, v] as const))(
    "exposes %s with the same property values",
    (_member, view) => {
      const statics = type as unknown as Record<string, Record<string, unknown>>;
      const instance = statics[view.member]!;

      for (const prop of meta.properties) {
        if (DERIVED_PROPERTIES.has(prop.name)) continue;
        const expected = view[`${prop.name}En`];
        const actual = instance[camel(prop.name)];
        if (prop.type === "Decimal") {
          expect(Number(actual)).toBe(Number(expected));
        } else if (prop.type === "SwedishDrivingLicenseVehicleGroup") {
          const group = vehicle.SwedishDrivingLicenseVehicleGroup as Record<string, number>;
          expect(actual).toBe(group[expected as string]);
        } else {
          expect(actual).toBe(expected);
        }
      }

      withCulture("en-US", () => {
        expect(String(instance)).toBe(view.toStringEn);
        if (meta.properties.some((p) => p.name === "DisplayName")) {
          expect(instance.displayName).toBe(view.DisplayNameEn);
        }
      });
      withCulture("sv-SE", () => {
        expect(String(instance)).toBe(view.toStringSv);
        if (meta.properties.some((p) => p.name === "DisplayName")) {
          expect(instance.displayName).toBe(view.DisplayNameSv);
        }
      });
    },
  );

  it("compares and equates members like .NET", () => {
    const rows = allPairs[typeName];
    if (!rows) return;
    const statics = type as unknown as Record<string, Record<string, unknown>>;

    for (const [aName, bName, sign, equal] of rows) {
      const a = statics[aName]!;
      const b = statics[bName]!;
      expect((a.equals as (o: unknown) => boolean).call(a, b)).toBe(equal);
      const compareTo = a.compareTo as ((o: unknown) => number) | undefined;
      if (compareTo) expect(Math.sign(compareTo.call(a, b))).toBe(sign);
    }
  });

  it("treats null and undefined as invalid", () => {
    expect(type.tryParse(null)).toBeNull();
    expect(type.tryParse(undefined)).toBeNull();
    expect(type.isValid(null)).toBe(false);
    expect(type.format(null)).toBeNull();
    expect(type.normalize(null)).toBeNull();
    expect(type.isNormalized(null)).toBe(false);
  });

  it("returns 1 when compared against null", () => {
    const first = type.all[0]! as Record<string, unknown>;
    const compareTo = first.compareTo as ((o: unknown) => number) | undefined;
    if (compareTo) expect(compareTo.call(first, null)).toBe(1);
    expect((first.equals as (o: unknown) => boolean).call(first, null)).toBe(false);
  });

  if (data.scans.length > 0) {
    // The formatted form of a candidate follows the UI language; .NET captured these under en-US.
    it.each(data.scans.map((s) => [s.text, s] as const))("scans %j like .NET", (_text, scan) => {
      const found = withCulture("en-US", () => type.findCandidatesInText!(scan.text));
      expect(found.length).toBe(scan.candidates.length);

      for (const [index, expected] of scan.candidates.entries()) {
        const candidate = found[index]! as Record<string, unknown>;
        expect(candidate.originalText).toBe(expected.text);
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
