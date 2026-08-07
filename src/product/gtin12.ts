import { extractGtinDigits, validateGtinCheckDigit } from "../internal/gtin-check-digit.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskGtin12 } from "./product-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface Gtin12FormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const SCAN_PATTERN = /(?<!\d)\d{12}(?!\d)/gu;

/**
 * A 12-digit Global Trade Item Number (GTIN-12), better known as a UPC-A barcode and used
 * mainly in North America. Validated with the GS1 modulo-10 check digit.
 */
export class Gtin12 {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "GTIN-12",
    localizedName: "GTIN-12",
    emoji: "📦",
    sources: Object.freeze([
      "https://www.gs1.org/standards/id-keys/gtin",
      "https://www.gs1.org/services/check-digit-calculator",
      "https://en.wikipedia.org/wiki/Universal_Product_Code",
    ]),
  });

  /** The 12 digits, e.g. `614141000036`. */
  readonly digits: string;

  /** The GS1 modulo-10 check digit (last digit). */
  readonly checkDigit: number;

  private constructor(digits: string) {
    this.digits = digits;
    this.checkDigit = digits.charCodeAt(digits.length - 1) - 48;
  }

  /** Returns the GTIN zero-padded to 14 digits, the form used for cross-length comparison. */
  toGtin14Digits(): string {
    return this.digits.padStart(14, "0");
  }

  static tryParse(input: string | null | undefined): Gtin12 | null {
    if (input == null || input.trim().length === 0) return null;
    const digits = extractGtinDigits(sanitizeInput(input));
    if (digits === null || digits.length !== 12) return null;
    if (!validateGtinCheckDigit(digits)) return null;
    return new Gtin12(digits);
  }

  static parse(input: string): Gtin12 {
    const result = Gtin12.tryParse(input);
    if (result === null) throw new Error("Invalid GTIN-12.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Gtin12.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: Gtin12FormatOptions): string | null {
    const r = Gtin12.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static normalize(input: string | null | undefined, options?: Gtin12FormatOptions): string | null {
    const r = Gtin12.tryParse(input);
    if (r !== null) return r.digits;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Gtin12.normalize(input) === input;
  }

  /**
   * Scans unstructured text for potential UPC-A barcodes. Results are heuristic candidates
   * and may include false positives; nothing guarantees a candidate is a real product code.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<Gtin12>[] {
    if (!text) return [];
    const out: TextCandidate<Gtin12>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = Gtin12.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Gtin12>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Gtin12",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskGtin12(value),
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

  equals(other: Gtin12 | null | undefined): boolean {
    return other != null && this.digits === other.digits;
  }

  compareTo(other: Gtin12 | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: Gtin12FormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
