import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface ClothingFitFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface ClothingFitDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/**
 * Garment fit/silhouette (`passform`) used in apparel product feeds and fashion e-commerce,
 * e.g. `Slim`, `Regular`, `Loose`, `Oversized`, `Tailored`.
 */
export class ClothingFit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Clothing Fit",
    localizedName: "Passform",
    emoji: "🧥",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Clothing_sizes"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: ClothingFitDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly Slim = new ClothingFit({
    value: "Slim",
    englishName: "Slim",
    localizedName: "Smal",
    rank: 0,
  });

  static readonly Regular = new ClothingFit({
    value: "Regular",
    englishName: "Regular",
    localizedName: "Normal",
    rank: 1,
  });

  static readonly Loose = new ClothingFit({
    value: "Loose",
    englishName: "Loose",
    localizedName: "Lös",
    rank: 2,
  });

  static readonly Oversized = new ClothingFit({
    value: "Oversized",
    englishName: "Oversized",
    localizedName: "Oversize",
    rank: 3,
  });

  static readonly Tailored = new ClothingFit({
    value: "Tailored",
    englishName: "Tailored",
    localizedName: "Skräddarsydd",
    rank: 4,
  });

  /** All 5 values, in canonical order. */
  static get all(): readonly ClothingFit[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): ClothingFit | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): ClothingFit {
    const result = ClothingFit.tryParse(input);
    if (result === null) throw new Error(`Invalid clothing fit.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ClothingFit.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: ClothingFitFormatOptions,
  ): string | null {
    const r = ClothingFit.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: ClothingFitFormatOptions,
  ): string | null {
    const r = ClothingFit.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ClothingFit.normalize(input) === input;
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

  equals(other: ClothingFit | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: ClothingFit | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly ClothingFit[] = [
  ClothingFit.Slim,
  ClothingFit.Regular,
  ClothingFit.Loose,
  ClothingFit.Oversized,
  ClothingFit.Tailored,
];

function fallback(
  input: string | null | undefined,
  options?: ClothingFitFormatOptions,
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

const ALIASES: readonly (readonly [ClothingFit, readonly string[]])[] = [
  [
    ClothingFit.Slim,
    ["atsittande", "figurnara", "skinny", "skinnyfit", "slim", "slimfit", "smal", "tight"],
  ],
  [
    ClothingFit.Regular,
    [
      "klassiskpassform",
      "normal",
      "normalpassform",
      "rak",
      "rakpassform",
      "regular",
      "regularfit",
      "standard",
      "standardfit",
      "straight",
      "straightfit",
    ],
  ],
  [
    ClothingFit.Loose,
    [
      "bekvampassform",
      "comfortfit",
      "loose",
      "loosefit",
      "los",
      "lospassform",
      "relaxed",
      "relaxedfit",
      "vid",
      "vidpassform",
    ],
  ],
  [
    ClothingFit.Oversized,
    [
      "boxy",
      "boxyfit",
      "extravid",
      "overdimensionerad",
      "oversize",
      "oversized",
      "oversizedfit",
      "oversizefit",
      "xxlfit",
    ],
  ],
  [
    ClothingFit.Tailored,
    [
      "anpassadpassform",
      "formellpassform",
      "skraddarsydd",
      "slimtailored",
      "tailored",
      "tailoredfit",
    ],
  ],
];

const LOOKUP = new Map<string, ClothingFit>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}
