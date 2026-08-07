import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { formatEuShoeSize } from "../internal/shoe-size-format.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { ShoeSizeSystem } from "./shoe-size-system.js";

/** Options shared by the string-in, string-out helpers. */
export interface AdultShoeSizeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const US_MEN_OFFSET = 33;
const US_WOMEN_OFFSET = 31.5;
const UK_OFFSET = 33.5;

const EU_PATTERN = /^\s*EU\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const UK_PATTERN = /^\s*UK\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const US_WOMEN_PATTERN = /^\s*US\s+(?:WOMEN|W)\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const US_MEN_PATTERN = /^\s*US\s+(?:MEN|M)\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const US_BARE_PATTERN = /^\s*US\s+([0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const BARE_NUMBER_PATTERN = /^\s*([0-9]+(?:[.,][0-9]+)?)\s*$/u;

/**
 * Adult shoe size (`skostorlek`) stored as an EU size between 35 and 50 in half steps, with
 * US men's, US women's and UK conversions. A bare number below 35 is rejected so that children's
 * sizes do not silently resolve as adult ones.
 *
 * Conversions follow common retail charts with EU as the anchor: US men ≈ EU − 33,
 * US women ≈ EU − 31.5, UK ≈ EU − 33.5.
 */
export class AdultShoeSize {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Adult Shoe Size",
    localizedName: "Skostorlek (vuxen)",
    emoji: "👞",
    sources: Object.freeze([
      "https://www.iso.org/standard/83106.html",
      "https://www.iso.org/standard/71594.html",
      "https://en.wikipedia.org/wiki/Shoe_size",
    ]),
  });

  /** The EU size, e.g. `42` or `42.5`. */
  readonly euSize: number;

  /** The sizing system the value was parsed from. */
  readonly system: ShoeSizeSystem;

  /** Display form as an EU size, e.g. `EU 42` or `EU 42.5`. */
  readonly value: string;

  private constructor(euSize: number, system: ShoeSizeSystem) {
    this.euSize = euSize;
    this.system = system;
    this.value = formatEuShoeSize(euSize);
  }

  /** US men's size derived from EU, e.g. `9` for EU 42. */
  get usMenSize(): number {
    return this.euSize - US_MEN_OFFSET;
  }

  /** US women's size derived from EU, e.g. `10.5` for EU 42. */
  get usWomenSize(): number {
    return this.euSize - US_WOMEN_OFFSET;
  }

  /** UK size derived from EU, e.g. `8.5` for EU 42. */
  get ukSize(): number {
    return this.euSize - UK_OFFSET;
  }

  static tryParse(input: string | null | undefined): AdultShoeSize | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();
    const match =
      matchOffset(text, EU_PATTERN, 0, ShoeSizeSystem.EU) ??
      matchOffset(text, UK_PATTERN, UK_OFFSET, ShoeSizeSystem.UK) ??
      matchOffset(text, US_WOMEN_PATTERN, US_WOMEN_OFFSET, ShoeSizeSystem.USWomen) ??
      matchOffset(text, US_MEN_PATTERN, US_MEN_OFFSET, ShoeSizeSystem.USMen) ??
      matchOffset(text, US_BARE_PATTERN, US_MEN_OFFSET, ShoeSizeSystem.USMen) ??
      matchBareEu(text);

    if (match === null || !isValidEuSize(match.euSize)) return null;
    return new AdultShoeSize(match.euSize, match.system);
  }

  static parse(input: string): AdultShoeSize {
    const result = AdultShoeSize.tryParse(input);
    if (result === null) throw new Error("Invalid adult shoe size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return AdultShoeSize.tryParse(input) !== null;
  }

  /** Returns the canonical `EU 42` form. */
  static format(
    input: string | null | undefined,
    options?: AdultShoeSizeFormatOptions,
  ): string | null {
    const r = AdultShoeSize.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical `EU 42` form, the same as {@link format} for this type. */
  static normalize(
    input: string | null | undefined,
    options?: AdultShoeSizeFormatOptions,
  ): string | null {
    const r = AdultShoeSize.tryParse(input);
    if (r !== null) return r.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && AdultShoeSize.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: AdultShoeSize | null | undefined): boolean {
    return other != null && this.euSize === other.euSize;
  }

  compareTo(other: AdultShoeSize | null | undefined): number {
    if (other == null) return 1;
    return this.euSize < other.euSize ? -1 : this.euSize > other.euSize ? 1 : 0;
  }
}

interface SizeMatch {
  readonly euSize: number;
  readonly system: ShoeSizeSystem;
}

function matchOffset(
  text: string,
  pattern: RegExp,
  offset: number,
  system: ShoeSizeSystem,
): SizeMatch | null {
  const match = pattern.exec(text);
  if (match === null) return null;

  const value = parseDecimalNumber(match[1]!);
  return value === null ? null : { euSize: value + offset, system };
}

function matchBareEu(text: string): SizeMatch | null {
  const match = BARE_NUMBER_PATTERN.exec(text);
  if (match === null) return null;

  const value = parseDecimalNumber(match[1]!);
  if (value === null || value < 35) return null;
  return { euSize: value, system: ShoeSizeSystem.EU };
}

function parseDecimalNumber(text: string): number | null {
  return Decimal.parse(text.replace(",", "."))?.toNumber() ?? null;
}

function isValidEuSize(euSize: number): boolean {
  return euSize >= 35 && euSize <= 50 && Number.isInteger(euSize * 2);
}

function fallback(
  input: string | null | undefined,
  options?: AdultShoeSizeFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
