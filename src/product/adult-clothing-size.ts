import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { ClothingSizeSystem } from "./clothing-size-system.js";

/** Options shared by the string-in, string-out helpers. */
export interface AdultClothingSizeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/** Letter codes with the EU size each maps to, longest first so `XXL` wins over `XL`. */
const LETTER_SIZES: readonly (readonly [string, number])[] = [
  ["XXXXL", 48],
  ["XXXL", 46],
  ["XXL", 44],
  ["XL", 42],
  ["XXS", 32],
  ["XS", 34],
  ["S", 36],
  ["M", 38],
  ["L", 40],
];

const PREFIXED_SIZE_PATTERN = /^(EU|US|UK)\s*(\d+)$/iu;
const BARE_NUMBER_PATTERN = /^\d+$/u;

/**
 * Adult clothing size (`klädstorlek`) with approximate conversions between the EU numeric, US,
 * UK and letter (XXS–XXXXL) systems. Stored as an even EU size between 32 and 56. A bare number
 * is always read as EU; US and UK sizes need an explicit prefix.
 *
 * The conversions are industry approximations (EU ≈ US + 30, EU ≈ UK + 28) and vary by brand.
 */
export class AdultClothingSize {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Adult Clothing Size",
    localizedName: "Klädstorlek (vuxen)",
    emoji: "👔",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/EN_13402",
      "https://www.iso.org/standard/85084.html",
      "https://en.wikipedia.org/wiki/Clothing_sizes",
    ]),
  });

  /** EU numeric size, even and between 32 and 56, e.g. `40`. */
  readonly euSize: number;

  /** Approximate US numeric size (EU − 30), e.g. `10` for EU 40. */
  readonly usSize: number;

  /** Approximate UK numeric size (EU − 28), e.g. `12` for EU 40. */
  readonly ukSize: number;

  /** Standard letter size when the EU size maps to one; otherwise `null`. */
  readonly letterSize: string | null;

  /** The sizing system the value was parsed from. */
  readonly system: ClothingSizeSystem;

  /** Display form: the letter when mapped, e.g. `L`, otherwise `EU 50`. */
  readonly value: string;

  private constructor(euSize: number, system: ClothingSizeSystem) {
    this.euSize = euSize;
    this.system = system;
    this.usSize = euSize - 30;
    this.ukSize = euSize - 28;
    this.letterSize = letterForEuSize(euSize);
    this.value = this.letterSize ?? euDisplay(euSize);
  }

  static tryParse(input: string | null | undefined): AdultClothingSize | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();
    if (text.length === 0) return null;

    const fromLetter = euSizeForLetter(text);
    if (fromLetter !== null) return new AdultClothingSize(fromLetter, ClothingSizeSystem.Letter);

    const prefixed = PREFIXED_SIZE_PATTERN.exec(text);
    if (prefixed !== null) {
      const system = prefixed[1]!.toUpperCase();
      const number = Number(prefixed[2]);
      const euSize = system === "EU" ? number : system === "US" ? number + 30 : number + 28;
      if (!isValidEuSize(euSize)) return null;
      return new AdultClothingSize(
        euSize,
        system === "EU"
          ? ClothingSizeSystem.EU
          : system === "US"
            ? ClothingSizeSystem.US
            : ClothingSizeSystem.UK,
      );
    }

    if (BARE_NUMBER_PATTERN.test(text)) {
      const euSize = Number(text);
      if (isValidEuSize(euSize)) return new AdultClothingSize(euSize, ClothingSizeSystem.EU);
    }

    return null;
  }

  static parse(input: string): AdultClothingSize {
    const result = AdultClothingSize.tryParse(input);
    if (result === null) throw new Error("Invalid adult clothing size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return AdultClothingSize.tryParse(input) !== null;
  }

  /** Returns the letter size when the EU size maps to one, otherwise the `EU 40` form. */
  static format(
    input: string | null | undefined,
    options?: AdultClothingSizeFormatOptions,
  ): string | null {
    const r = AdultClothingSize.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical EU form, e.g. `EU 40`. */
  static normalize(
    input: string | null | undefined,
    options?: AdultClothingSizeFormatOptions,
  ): string | null {
    const r = AdultClothingSize.tryParse(input);
    if (r !== null) return euDisplay(r.euSize);
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && AdultClothingSize.normalize(input) === input;
  }

  toNormalizedString(): string {
    return euDisplay(this.euSize);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AdultClothingSize | null | undefined): boolean {
    return other != null && this.euSize === other.euSize;
  }

  compareTo(other: AdultClothingSize | null | undefined): number {
    if (other == null) return 1;
    return this.euSize < other.euSize ? -1 : this.euSize > other.euSize ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: AdultClothingSizeFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEuSize(euSize: number): boolean {
  return euSize >= 32 && euSize <= 56 && euSize % 2 === 0;
}

function euDisplay(euSize: number): string {
  return `EU ${euSize}`;
}

function euSizeForLetter(text: string): number | null {
  const upper = text.toUpperCase();
  return LETTER_SIZES.find(([letter]) => letter === upper)?.[1] ?? null;
}

function letterForEuSize(euSize: number): string | null {
  return LETTER_SIZES.find(([, size]) => size === euSize)?.[0] ?? null;
}
