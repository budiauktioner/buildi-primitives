import {
  GTIN_VALID_LENGTHS,
  extractGtinDigits,
  validateGtinCheckDigit,
} from "../internal/gtin-check-digit.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options shared by the string-in, string-out helpers. */
export interface GtinFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * A Global Trade Item Number of any GS1 length: 8, 12, 13 or 14 digits. Use this when the
 * length is not known up front; the fixed-length types expose the parts specific to each
 * format. Validated with the GS1 modulo-10 check digit.
 */
export class Gtin {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "GTIN",
    localizedName: "GTIN",
    emoji: "📦",
    sources: Object.freeze([
      "https://www.gs1.org/standards/id-keys/gtin",
      "https://www.gs1.org/services/check-digit-calculator",
      "https://en.wikipedia.org/wiki/Global_Trade_Item_Number",
    ]),
  });

  /** The digits, e.g. `5901234123457`. */
  readonly digits: string;

  /** Number of digits: 8, 12, 13 or 14. */
  readonly length: number;

  /** The GS1 modulo-10 check digit (last digit). */
  readonly checkDigit: number;

  private constructor(digits: string) {
    this.digits = digits;
    this.length = digits.length;
    this.checkDigit = digits.charCodeAt(digits.length - 1) - 48;
  }

  /** Returns the GTIN zero-padded to 14 digits, the form used for cross-length comparison. */
  toGtin14Digits(): string {
    return this.digits.padStart(14, "0");
  }

  static tryParse(input: string | null | undefined): Gtin | null {
    if (input == null || input.trim().length === 0) return null;
    const digits = extractGtinDigits(sanitizeInput(input));
    if (digits === null || !GTIN_VALID_LENGTHS.includes(digits.length)) return null;
    if (!validateGtinCheckDigit(digits)) return null;
    return new Gtin(digits);
  }

  static parse(input: string): Gtin {
    const result = Gtin.tryParse(input);
    if (result === null) throw new Error("Invalid GTIN.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Gtin.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: GtinFormatOptions): string | null {
    const r = Gtin.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static normalize(input: string | null | undefined, options?: GtinFormatOptions): string | null {
    const r = Gtin.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Gtin.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.digits;
  }

  toString(): string {
    return this.digits;
  }

  equals(other: Gtin | null | undefined): boolean {
    return other != null && this.digits === other.digits;
  }

  compareTo(other: Gtin | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: GtinFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
