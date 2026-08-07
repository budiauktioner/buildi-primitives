import { extractGtinDigits, validateGtinCheckDigit } from "../internal/gtin-check-digit.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskGtin14 } from "./product-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface Gtin14FormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const SCAN_PATTERN = /(?<!\d)\d{14}(?!\d)/gu;

/**
 * A 14-digit Global Trade Item Number (GTIN-14), used on cases and pallets and printed as an
 * ITF-14 barcode. The leading digit indicates the packaging level. Validated with the GS1
 * modulo-10 check digit.
 */
export class Gtin14 {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "GTIN-14",
    localizedName: "GTIN-14",
    emoji: "📦",
    sources: Object.freeze([
      "https://www.gs1.org/standards/id-keys/gtin",
      "https://www.gs1.org/services/check-digit-calculator",
      "https://en.wikipedia.org/wiki/ITF-14",
    ]),
  });

  /** The 14 digits, e.g. `10614141000415`. */
  readonly digits: string;

  /** The GS1 modulo-10 check digit (last digit). */
  readonly checkDigit: number;

  /**
   * The packaging indicator (first digit). 1–8 are defined packaging levels, 9 marks a
   * variable-measure trade item, and 0 means no specific level.
   */
  readonly indicatorDigit: number;

  /** The inner 13 digits, which represent the contained GTIN-13. */
  readonly innerGtin13Digits: string;

  private constructor(digits: string) {
    this.digits = digits;
    this.checkDigit = digits.charCodeAt(digits.length - 1) - 48;
    this.indicatorDigit = digits.charCodeAt(0) - 48;
    this.innerGtin13Digits = digits.slice(1);
  }

  static tryParse(input: string | null | undefined): Gtin14 | null {
    if (input == null || input.trim().length === 0) return null;
    const digits = extractGtinDigits(sanitizeInput(input));
    if (digits === null || digits.length !== 14) return null;
    if (!validateGtinCheckDigit(digits)) return null;
    return new Gtin14(digits);
  }

  static parse(input: string): Gtin14 {
    const result = Gtin14.tryParse(input);
    if (result === null) throw new Error("Invalid GTIN-14.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Gtin14.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: Gtin14FormatOptions): string | null {
    const r = Gtin14.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static normalize(input: string | null | undefined, options?: Gtin14FormatOptions): string | null {
    const r = Gtin14.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Gtin14.normalize(input) === input;
  }

  /**
   * Scans unstructured text for potential ITF-14 barcodes. Results are heuristic candidates
   * and may include false positives; nothing guarantees a candidate is a real product code.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<Gtin14>[] {
    if (!text) return [];
    const out: TextCandidate<Gtin14>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = Gtin14.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Gtin14>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Gtin14",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskGtin14(value),
          confidence: TextMatchConfidence.Medium,
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

  equals(other: Gtin14 | null | undefined): boolean {
    return other != null && this.digits === other.digits;
  }

  compareTo(other: Gtin14 | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: Gtin14FormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
