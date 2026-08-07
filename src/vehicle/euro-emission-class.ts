import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options shared by the string-in, string-out helpers. */
export interface EuroEmissionClassFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface EuroEmissionClassDef {
  readonly euroClass: string;
  readonly level: number;
  readonly subLevel: string | null;
  readonly swedishMiljoklass: string;
  readonly introductionYear: number;
  readonly value: string;
  readonly rank: number;
}

/**
 * A European vehicle emission standard (`Euroklass`) with the related Swedish environmental
 * class label (`miljöklass`).
 */
export class EuroEmissionClass {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Euro Emission Class",
    localizedName: "Euroklass",
    emoji: "🌿",
    sources: Object.freeze([
      "https://commission.europa.eu/energy-climate-change-environment/standards-tools-and-labels/labels-certificates-and-standards/vehicles-and-transport-labelling-standards/european-emission-standards_en",
      "https://www.transportstyrelsen.se/",
    ]),
  });

  readonly euroClass: string;
  readonly level: number;
  readonly subLevel: string | null;
  readonly swedishMiljoklass: string;
  readonly introductionYear: number;
  readonly value: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: EuroEmissionClassDef) {
    this.euroClass = def.euroClass;
    this.level = def.level;
    this.subLevel = def.subLevel;
    this.swedishMiljoklass = def.swedishMiljoklass;
    this.introductionYear = def.introductionYear;
    this.value = def.value;
    this.rank = def.rank;
  }

  static readonly Euro1 = new EuroEmissionClass({
    euroClass: "Euro 1",
    level: 1,
    subLevel: null,
    swedishMiljoklass: "Miljöklass 1",
    introductionYear: 1992,
    value: "Euro 1",
    rank: 1,
  });

  static readonly Euro2 = new EuroEmissionClass({
    euroClass: "Euro 2",
    level: 2,
    subLevel: null,
    swedishMiljoklass: "Miljöklass 2",
    introductionYear: 1996,
    value: "Euro 2",
    rank: 2,
  });

  static readonly Euro3 = new EuroEmissionClass({
    euroClass: "Euro 3",
    level: 3,
    subLevel: null,
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2000,
    value: "Euro 3",
    rank: 3,
  });

  static readonly Euro4 = new EuroEmissionClass({
    euroClass: "Euro 4",
    level: 4,
    subLevel: null,
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2005,
    value: "Euro 4",
    rank: 4,
  });

  static readonly Euro5 = new EuroEmissionClass({
    euroClass: "Euro 5",
    level: 5,
    subLevel: null,
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2009,
    value: "Euro 5",
    rank: 5,
  });

  static readonly Euro5a = new EuroEmissionClass({
    euroClass: "Euro 5a",
    level: 5,
    subLevel: "a",
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2009,
    value: "Euro 5a",
    rank: 5,
  });

  static readonly Euro5b = new EuroEmissionClass({
    euroClass: "Euro 5b",
    level: 5,
    subLevel: "b",
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2011,
    value: "Euro 5b",
    rank: 5,
  });

  static readonly Euro6 = new EuroEmissionClass({
    euroClass: "Euro 6",
    level: 6,
    subLevel: null,
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2014,
    value: "Euro 6",
    rank: 8,
  });

  static readonly Euro6b = new EuroEmissionClass({
    euroClass: "Euro 6b",
    level: 6,
    subLevel: "b",
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2014,
    value: "Euro 6b",
    rank: 8,
  });

  static readonly Euro6c = new EuroEmissionClass({
    euroClass: "Euro 6c",
    level: 6,
    subLevel: "c",
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2017,
    value: "Euro 6c",
    rank: 8,
  });

  static readonly Euro6dTemp = new EuroEmissionClass({
    euroClass: "Euro 6d-temp",
    level: 6,
    subLevel: "d-temp",
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2017,
    value: "Euro 6d-temp",
    rank: 8,
  });

  static readonly Euro6d = new EuroEmissionClass({
    euroClass: "Euro 6d",
    level: 6,
    subLevel: "d",
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2020,
    value: "Euro 6d",
    rank: 8,
  });

  static readonly Euro6e = new EuroEmissionClass({
    euroClass: "Euro 6e",
    level: 6,
    subLevel: "e",
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2023,
    value: "Euro 6e",
    rank: 8,
  });

  static readonly Euro7 = new EuroEmissionClass({
    euroClass: "Euro 7",
    level: 7,
    subLevel: null,
    swedishMiljoklass: "Miljöklass 2005",
    introductionYear: 2025,
    value: "Euro 7",
    rank: 14,
  });

  static readonly El = new EuroEmissionClass({
    euroClass: "El",
    level: 0,
    subLevel: null,
    swedishMiljoklass: "Miljöklass El",
    introductionYear: 0,
    value: "El",
    rank: 0,
  });

  /** All 15 values, in canonical order. */
  static get all(): readonly EuroEmissionClass[] {
    return ALL;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): EuroEmissionClass | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): EuroEmissionClass {
    const result = EuroEmissionClass.tryParse(input);
    if (result === null) throw new Error(`Invalid euro emission class.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EuroEmissionClass.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: EuroEmissionClassFormatOptions,
  ): string | null {
    const r = EuroEmissionClass.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: EuroEmissionClassFormatOptions,
  ): string | null {
    const r = EuroEmissionClass.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EuroEmissionClass.normalize(input) === input;
  }

  /** Finds euro emission class mentions in unstructured text. */
  static findCandidatesInText(text: string): readonly TextCandidate<EuroEmissionClass>[] {
    if (!text) return [];
    const out: TextCandidate<EuroEmissionClass>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const value = EuroEmissionClass.tryParse(m[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<EuroEmissionClass>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "EuroEmissionClass",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: value.euroClass,
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: EuroEmissionClass | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: EuroEmissionClass | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly EuroEmissionClass[] = [
  EuroEmissionClass.Euro1,
  EuroEmissionClass.Euro2,
  EuroEmissionClass.Euro3,
  EuroEmissionClass.Euro4,
  EuroEmissionClass.Euro5,
  EuroEmissionClass.Euro5a,
  EuroEmissionClass.Euro5b,
  EuroEmissionClass.Euro6,
  EuroEmissionClass.Euro6b,
  EuroEmissionClass.Euro6c,
  EuroEmissionClass.Euro6dTemp,
  EuroEmissionClass.Euro6d,
  EuroEmissionClass.Euro6e,
  EuroEmissionClass.Euro7,
  EuroEmissionClass.El,
];

function fallback(
  input: string | null | undefined,
  options?: EuroEmissionClassFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /\s+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, " ");
  return folded;
}

const ALIASES: readonly (readonly [EuroEmissionClass, readonly string[]])[] = [
  [EuroEmissionClass.Euro1, ["euro 1", "euro1", "miljoklass 1"]],
  [EuroEmissionClass.Euro2, ["euro 2", "euro2", "miljoklass 2"]],
  [EuroEmissionClass.Euro3, ["euro 3", "euro3"]],
  [EuroEmissionClass.Euro4, ["euro 4", "euro4"]],
  [EuroEmissionClass.Euro5, ["2005pm", "eev", "euro 5", "euro5", "miljoklass 2005pm"]],
  [EuroEmissionClass.Euro5a, ["euro 5a", "euro5a"]],
  [EuroEmissionClass.Euro5b, ["2008", "2008pm", "euro 5b", "euro5b", "miljoklass 2008"]],
  [EuroEmissionClass.Euro6, ["euro 6", "euro6", "miljoklass 2005", "mk2005"]],
  [EuroEmissionClass.Euro6b, ["euro 6b", "euro6b"]],
  [EuroEmissionClass.Euro6c, ["euro 6c", "euro6c"]],
  [EuroEmissionClass.Euro6dTemp, ["euro 6d-temp", "euro6d-temp"]],
  [EuroEmissionClass.Euro6d, ["euro 6d", "euro6d"]],
  [EuroEmissionClass.Euro6e, ["euro 6e", "euro6e"]],
  [EuroEmissionClass.Euro7, ["euro 7", "euro7"]],
  [EuroEmissionClass.El, ["el", "elbil", "miljoklass el"]],
];

const LOOKUP = new Map<string, EuroEmissionClass>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}

const SCAN_PATTERN = /(?<![\p{L}\p{N}_])Euro\s*[1-7](?!\d)(?:\s*[a-z][a-z-]*)?(?![\p{L}\p{N}_])/giu;
