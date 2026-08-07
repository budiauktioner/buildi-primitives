import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepAsciiAlphanumericUppercase } from "../internal/input-sanitization.js";
import { luhnIsValid } from "../internal/luhn.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

const ISIN_LENGTH = 12;
const MAX_INPUT_LENGTH = 30;

/**
 * An International Securities Identification Number (ISO 6166), e.g. `SE0000108656`.
 * 2-letter country code + 9-character NSIN + 1 Luhn check digit.
 */
export class Isin {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "ISIN",
    localizedName: "ISIN",
    emoji: "\u{1F4C8}",
    sources: Object.freeze([
      "https://www.iso.org/standard/78502.html",
      "https://en.wikipedia.org/wiki/International_Securities_Identification_Number",
      "https://www.anna-web.org/",
    ]),
  });

  /** The 12-character ISIN in uppercase, e.g. `SE0000108656`. */
  readonly value: string;

  /** ISO 3166-1 alpha-2 country code (chars 1-2), e.g. `SE`. */
  get countryCode(): string {
    return this.value.slice(0, 2);
  }

  /** National Securities Identifying Number (chars 3-11), e.g. `000010865`. */
  get nsin(): string {
    return this.value.slice(2, 11);
  }

  /** Luhn check digit (last char), e.g. `6`. */
  get checkDigit(): string {
    return this.value.slice(11, 12);
  }

  private constructor(value: string) {
    this.value = value;
  }

  static tryParse(input: string | null | undefined): Isin | null {
    if (input == null || input.trim() === "") return null;
    const cleaned = keepAsciiAlphanumericUppercase(input);
    if (cleaned.length > MAX_INPUT_LENGTH) return null;
    if (cleaned.length !== ISIN_LENGTH) return null;

    const c0 = cleaned.charCodeAt(0);
    const c1 = cleaned.charCodeAt(1);
    if (c0 < 0x41 || c0 > 0x5a) return null;
    if (c1 < 0x41 || c1 > 0x5a) return null;
    const c11 = cleaned.charCodeAt(11);
    if (c11 < 0x30 || c11 > 0x39) return null;

    for (let i = 2; i < 11; i++) {
      const c = cleaned.charCodeAt(i);
      if (!((c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a))) return null;
    }

    if (!isValidLuhnCheckDigit(cleaned)) return null;

    return new Isin(cleaned);
  }

  static parse(input: string): Isin {
    const r = Isin.tryParse(input);
    if (r === null) throw new Error("Invalid ISIN (length, format, or check digit invalid).");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Isin.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Isin.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Isin.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Isin.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Isin>[] {
    if (!text) return [];
    const out: TextCandidate<Isin>[] = [];
    const re = /(?<![A-Z0-9])[A-Z]{2}[A-Z0-9]{9}\d(?![A-Z0-9])/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = Isin.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<Isin>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "Isin",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskIsin(r),
          confidence: TextMatchConfidence.High,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: Isin | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: Isin | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function isValidLuhnCheckDigit(isin: string): boolean {
  let digits = "";
  for (let i = 0; i < isin.length; i++) {
    const c = isin.charCodeAt(i);
    if (c >= 0x30 && c <= 0x39) {
      digits += isin[i];
    } else if (c >= 0x41 && c <= 0x5a) {
      digits += String(c - 0x41 + 10);
    } else {
      return false;
    }
  }
  return luhnIsValid(digits);
}

/**
 * Masks the ISIN preserving the country code, e.g. `SE0000108656` → `SE**********`.
 */
export function maskIsin(isin: Isin): string {
  return isin.countryCode + "*".repeat(isin.value.length - 2);
}
