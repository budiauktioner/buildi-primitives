import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface ClothingSeasonFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface ClothingSeasonDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly monthsCovered: readonly number[];
  readonly isAllSeason: boolean;
  readonly rank: number;
}

/**
 * Clothing/seasonal product season (`säsong`) used in fashion product feeds and retail
 * catalogs, e.g. `Spring`, `Summer`, `Autumn`, `Winter`, `All-Season`.
 */
export class ClothingSeason {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Clothing Season",
    localizedName: "Säsong",
    emoji: "🍂",
    sources: Object.freeze([
      "https://support.google.com/merchants/answer/6324470",
      "https://en.wikipedia.org/wiki/Season",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly monthsCovered: readonly number[];
  readonly isAllSeason: boolean;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: ClothingSeasonDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.monthsCovered = def.monthsCovered;
    this.isAllSeason = def.isAllSeason;
    this.rank = def.rank;
  }

  static readonly Spring = new ClothingSeason({
    value: "Spring",
    englishName: "Spring",
    localizedName: "Vår",
    monthsCovered: [3, 4, 5],
    isAllSeason: false,
    rank: 0,
  });

  static readonly Summer = new ClothingSeason({
    value: "Summer",
    englishName: "Summer",
    localizedName: "Sommar",
    monthsCovered: [6, 7, 8],
    isAllSeason: false,
    rank: 1,
  });

  static readonly Autumn = new ClothingSeason({
    value: "Autumn",
    englishName: "Autumn",
    localizedName: "Höst",
    monthsCovered: [9, 10, 11],
    isAllSeason: false,
    rank: 2,
  });

  static readonly Winter = new ClothingSeason({
    value: "Winter",
    englishName: "Winter",
    localizedName: "Vinter",
    monthsCovered: [12, 1, 2],
    isAllSeason: false,
    rank: 3,
  });

  static readonly AllSeason = new ClothingSeason({
    value: "All-Season",
    englishName: "All-Season",
    localizedName: "Året runt",
    monthsCovered: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isAllSeason: true,
    rank: 4,
  });

  /** All 5 values, in canonical order. */
  static get all(): readonly ClothingSeason[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): ClothingSeason | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): ClothingSeason {
    const result = ClothingSeason.tryParse(input);
    if (result === null) throw new Error(`Invalid clothing season.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ClothingSeason.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: ClothingSeasonFormatOptions,
  ): string | null {
    const r = ClothingSeason.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: ClothingSeasonFormatOptions,
  ): string | null {
    const r = ClothingSeason.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ClothingSeason.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  toDisplayString(): string {
    return this.displayName;
  }

  toEnglishString(): string {
    return this.englishName;
  }

  toLocalString(): string {
    return this.localizedName;
  }

  equals(other: ClothingSeason | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: ClothingSeason | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly ClothingSeason[] = [
  ClothingSeason.Spring,
  ClothingSeason.Summer,
  ClothingSeason.Autumn,
  ClothingSeason.Winter,
  ClothingSeason.AllSeason,
];

function fallback(
  input: string | null | undefined,
  options?: ClothingSeasonFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_/]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return foldOrdinalIgnoreCase(folded);
}

const ALIASES: readonly (readonly [ClothingSeason, readonly string[]])[] = [
  [ClothingSeason.Spring, ["spring", "springsummer", "springtime", "ss", "var", "varsasong"]],
  [ClothingSeason.Summer, ["sommar", "sommarsasong", "summer", "summertime"]],
  [
    ClothingSeason.Autumn,
    ["autumn", "autumnal", "autumnwinter", "aw", "fall", "fallwinter", "fw", "host", "hostsasong"],
  ],
  [ClothingSeason.Winter, ["vinter", "vintersasong", "winter", "wintertime"]],
  [
    ClothingSeason.AllSeason,
    [
      "4season",
      "allroundsasong",
      "allseason",
      "allyear",
      "aretom",
      "aretrunt",
      "fourseason",
      "helar",
      "multiseason",
      "yearround",
    ],
  ],
];

const LOOKUP = new Map<string, ClothingSeason>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}
