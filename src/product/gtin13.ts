import { resolveGs1Prefix } from "../internal/gs1-prefix.js";
import { extractGtinDigits, validateGtinCheckDigit } from "../internal/gtin-check-digit.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskGtin13 } from "./product-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface Gtin13FormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const SCAN_PATTERN = /(?<!\d)\d{13}(?!\d)/gu;

/**
 * A 13-digit Global Trade Item Number (GTIN-13), also known as EAN-13, the most widely used
 * consumer barcode. The first three digits form the GS1 prefix identifying the issuing member
 * organization. Validated with the GS1 modulo-10 check digit.
 */
export class Gtin13 {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "GTIN-13",
    localizedName: "GTIN-13",
    emoji: "📦",
    sources: Object.freeze([
      "https://www.gs1.org/standards/id-keys/gtin",
      "https://www.gs1.org/services/check-digit-calculator",
      "https://en.wikipedia.org/wiki/International_Article_Number",
    ]),
  });

  /** The 13 digits, e.g. `5901234123457`. */
  readonly digits: string;

  /** The GS1 modulo-10 check digit (last digit). */
  readonly checkDigit: number;

  /** The 3-digit GS1 prefix identifying the issuing member organization, e.g. `590` for Poland. */
  readonly gs1Prefix: string;

  /**
   * Organization or country behind the prefix, e.g. `Sweden` for 730–739 or `Books (ISBN)` for
   * 978–979. `null` when the prefix falls outside every published range.
   */
  readonly gs1PrefixName: string | null;

  /**
   * ISO 3166-1 alpha-2 code for the prefix, e.g. `SE`. `null` when the prefix maps to a
   * non-country assignment such as ISBN or coupons, or is unknown.
   */
  readonly gs1PrefixCountryCode: string | null;

  private constructor(digits: string) {
    this.digits = digits;
    this.checkDigit = digits.charCodeAt(digits.length - 1) - 48;
    this.gs1Prefix = digits.slice(0, 3);
    const resolved = resolveGs1Prefix(this.gs1Prefix);
    this.gs1PrefixName = resolved?.name ?? null;
    this.gs1PrefixCountryCode = resolved?.countryCode ?? null;
  }

  /** Returns the GTIN zero-padded to 14 digits, the form used for cross-length comparison. */
  toGtin14Digits(): string {
    return this.digits.padStart(14, "0");
  }

  static tryParse(input: string | null | undefined): Gtin13 | null {
    if (input == null || input.trim().length === 0) return null;
    const digits = extractGtinDigits(sanitizeInput(input));
    if (digits === null || digits.length !== 13) return null;
    if (!validateGtinCheckDigit(digits)) return null;
    return new Gtin13(digits);
  }

  static parse(input: string): Gtin13 {
    const result = Gtin13.tryParse(input);
    if (result === null) throw new Error("Invalid GTIN-13.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Gtin13.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: Gtin13FormatOptions): string | null {
    const r = Gtin13.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static normalize(input: string | null | undefined, options?: Gtin13FormatOptions): string | null {
    const r = Gtin13.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Gtin13.normalize(input) === input;
  }

  /**
   * Scans unstructured text for potential EAN-13 barcodes. Results are heuristic candidates
   * and may include false positives; nothing guarantees a candidate is a real product code.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<Gtin13>[] {
    if (!text) return [];
    const out: TextCandidate<Gtin13>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = Gtin13.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Gtin13>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Gtin13",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskGtin13(value),
          confidence: TextMatchConfidence.High,
          value,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.digits;
  }

  toString(): string {
    return this.digits;
  }

  equals(other: Gtin13 | null | undefined): boolean {
    return other != null && this.digits === other.digits;
  }

  compareTo(other: Gtin13 | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: Gtin13FormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
