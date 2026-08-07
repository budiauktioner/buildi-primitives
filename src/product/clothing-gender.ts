import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface ClothingGenderFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface ClothingGenderDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/**
 * Clothing target gender (`klädkön`) as used in product feeds and fashion e-commerce, e.g.
 * `Male` (`Herr`), `Female` (`Dam`), `Unisex`.
 */
export class ClothingGender {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Clothing Gender",
    localizedName: "Klädkön",
    emoji: "🚻",
    sources: Object.freeze([
      "https://support.google.com/merchants/answer/6324479",
      "https://schema.org/GenderType",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: ClothingGenderDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly Male = new ClothingGender({
    value: "Male",
    englishName: "Male",
    localizedName: "Herr",
    rank: 0,
  });

  static readonly Female = new ClothingGender({
    value: "Female",
    englishName: "Female",
    localizedName: "Dam",
    rank: 1,
  });

  static readonly Unisex = new ClothingGender({
    value: "Unisex",
    englishName: "Unisex",
    localizedName: "Unisex",
    rank: 2,
  });

  static readonly Boys = new ClothingGender({
    value: "Boys",
    englishName: "Boys",
    localizedName: "Pojke",
    rank: 3,
  });

  static readonly Girls = new ClothingGender({
    value: "Girls",
    englishName: "Girls",
    localizedName: "Flicka",
    rank: 4,
  });

  /** All 5 values, in canonical order. */
  static get all(): readonly ClothingGender[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): ClothingGender | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): ClothingGender {
    const result = ClothingGender.tryParse(input);
    if (result === null) throw new Error(`Invalid clothing gender.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ClothingGender.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: ClothingGenderFormatOptions,
  ): string | null {
    const r = ClothingGender.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: ClothingGenderFormatOptions,
  ): string | null {
    const r = ClothingGender.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ClothingGender.normalize(input) === input;
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

  equals(other: ClothingGender | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: ClothingGender | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly ClothingGender[] = [
  ClothingGender.Male,
  ClothingGender.Female,
  ClothingGender.Unisex,
  ClothingGender.Boys,
  ClothingGender.Girls,
];

function fallback(
  input: string | null | undefined,
  options?: ClothingGenderFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLookupKey(value: string): string {
  const folded = value.trim().toLowerCase();
  return foldOrdinalIgnoreCase(folded);
}

const ALIASES: readonly (readonly [ClothingGender, readonly string[]])[] = [
  [
    ClothingGender.Male,
    [
      "gentleman",
      "gentlemen",
      "herr",
      "herrar",
      "herrkläder",
      "male",
      "man",
      "men",
      "men's",
      "mens",
    ],
  ],
  [
    ClothingGender.Female,
    [
      "dam",
      "damer",
      "damkläder",
      "female",
      "kvinna",
      "kvinnor",
      "ladies",
      "lady",
      "woman",
      "women",
      "women's",
      "womens",
    ],
  ],
  [ClothingGender.Unisex, ["both", "uni", "unisex"]],
  [ClothingGender.Boys, ["boy", "boys", "killar", "kille", "pojk", "pojkar", "pojke"]],
  [ClothingGender.Girls, ["flicka", "flickor", "girl", "girls", "tjej", "tjejer"]],
];

const LOOKUP = new Map<string, ClothingGender>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}
