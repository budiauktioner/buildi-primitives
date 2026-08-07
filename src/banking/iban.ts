import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepAsciiAlphanumericUppercase, sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationResult, validResult, invalidResult } from "../validation/validation-result.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";

const MAX_INPUT_LENGTH = 50;

const NORMALIZED_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;

const COUNTRY_IBAN_LENGTHS: Readonly<Record<string, number>> = Object.freeze({
  AL: 28,
  AD: 24,
  AT: 20,
  AZ: 28,
  BE: 16,
  BA: 20,
  BG: 22,
  BH: 22,
  BR: 29,
  CH: 21,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IS: 26,
  IT: 27,
  IQ: 23,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SC: 31,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  ST: 25,
  SV: 28,
  TL: 23,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
});

/**
 * The International Bank Account Number (ISO 13616), e.g. `SE4550000000058398257466`.
 * Validated using MOD-97 check digits.
 */
export class Iban {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "IBAN",
    localizedName: "IBAN",
    emoji: "\u{1F3E6}",
    sources: Object.freeze([
      "https://www.iso.org/standard/81090.html",
      "https://www.iban.com/",
      "https://en.wikipedia.org/wiki/International_Bank_Account_Number",
    ]),
  });

  static readonly displayName = "IBAN";
  static readonly displayNameShort = "IBAN";

  /** Normalized IBAN without spaces, e.g. `SE4550000000058398257466`. */
  readonly value: string;
  /** ISO 3166-1 alpha-2 country code, e.g. `SE`. */
  readonly countryCode: string;
  /** Display form grouped in blocks of four characters, e.g. `SE45 5000 0000 0583 9825 7466`. */
  readonly formatted: string;

  private constructor(value: string, countryCode: string, formatted: string) {
    this.value = value;
    this.countryCode = countryCode;
    this.formatted = formatted;
  }

  static tryParse(input: string | null | undefined): Iban | null;
  static tryParse(input: string | null | undefined, countryCode: string): Iban | null;
  static tryParse(input: string | null | undefined, countryCode?: string): Iban | null {
    if (input == null || input.trim() === "") return null;
    const normalized = keepAsciiAlphanumericUppercase(sanitizeInput(input));
    if (normalized.length > MAX_INPUT_LENGTH) return null;
    if (!isStructurallyValid(normalized)) return null;
    if (!hasValidCheckDigits(normalized)) return null;

    const cc = normalized.slice(0, 2);
    if (countryCode !== undefined && cc !== countryCode.toUpperCase()) return null;
    return new Iban(normalized, cc, formatValue(normalized));
  }

  static parse(input: string): Iban {
    const r = Iban.tryParse(input);
    if (r === null) throw new Error("Invalid IBAN.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Iban.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Iban.tryParse(input);
    if (r) return r.formatted;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Iban.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Iban.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toDisplayString(): string {
    return `${Iban.displayName} ${this.formatted}`;
  }

  toShortDisplayString(): string {
    return `${Iban.displayNameShort} ${this.formatted}`;
  }

  toString(): string {
    return this.formatted;
  }

  static validate(input: string | null | undefined): ValidationResult {
    if (input == null || input.trim() === "")
      return invalidResult(
        input,
        ValidationErrorReason.InputIsEmpty,
        "Input is empty or whitespace.",
        "Värdet är tomt.",
      );

    const normalized = keepAsciiAlphanumericUppercase(sanitizeInput(input));

    if (normalized.length > MAX_INPUT_LENGTH)
      return invalidResult(
        input,
        ValidationErrorReason.InputTooLong,
        "Input contains too many characters.",
        "Värdet innehåller för många tecken.",
      );

    if (normalized.length < 15 || normalized.length > 34)
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "IBAN must be 15–34 characters.",
        "IBAN måste vara 15–34 tecken.",
      );

    if (!NORMALIZED_PATTERN.test(normalized))
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "IBAN has an invalid format.",
        "IBAN har ett ogiltigt format.",
      );

    const cc = normalized.slice(0, 2);
    const expectedLength = COUNTRY_IBAN_LENGTHS[cc];
    if (expectedLength === undefined)
      return invalidResult(
        input,
        ValidationErrorReason.UnknownCountryCode,
        "Unknown IBAN country code.",
        "Okänd IBAN-landskod.",
      );

    if (normalized.length !== expectedLength)
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLengthForCountry,
        "IBAN length is wrong for the specified country.",
        "IBAN-längden stämmer inte för det angivna landet.",
      );

    if (!hasValidCheckDigits(normalized))
      return invalidResult(
        input,
        ValidationErrorReason.InvalidCheckDigit,
        "Invalid IBAN check digits.",
        "Ogiltiga IBAN-kontrollsiffror.",
      );

    return validResult(input);
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Iban>[] {
    if (!text) return [];
    const out: TextCandidate<Iban>[] = [];
    const re = /\b[A-Z]{2}\d{2}\s?[A-Z0-9]{4}[\sA-Z0-9]{6,30}\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = Iban.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<Iban>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "Iban",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskIban(r),
          confidence: TextMatchConfidence.High,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: Iban | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: Iban | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function isStructurallyValid(normalized: string): boolean {
  if (normalized.length < 15 || normalized.length > 34) return false;
  if (!NORMALIZED_PATTERN.test(normalized)) return false;
  const cc = normalized.slice(0, 2);
  const expected = COUNTRY_IBAN_LENGTHS[cc];
  if (expected === undefined) return false;
  if (normalized.length !== expected) return false;
  return true;
}

/** ISO 7064 MOD-97-10: rotate first 4 chars to end, A=10..Z=35, remainder must be 1. */
function hasValidCheckDigits(normalized: string): boolean {
  let remainder = 0;
  const len = normalized.length;
  for (let i = 4; i < len + 4; i++) {
    const c = normalized.charCodeAt(i % len);
    if (c >= 0x30 && c <= 0x39) {
      remainder = (remainder * 10 + (c - 0x30)) % 97;
    } else {
      const value = c - 0x41 + 10;
      const tens = Math.floor(value / 10);
      const ones = value % 10;
      remainder = (remainder * 10 + tens) % 97;
      remainder = (remainder * 10 + ones) % 97;
    }
  }
  return remainder === 1;
}

function formatValue(normalized: string): string {
  const parts: string[] = [];
  for (let i = 0; i < normalized.length; i += 4) {
    parts.push(normalized.slice(i, i + 4));
  }
  return parts.join(" ");
}

/**
 * Returns a masked IBAN preserving the country code and check digits,
 * e.g. `SE45 **** **** **** **** ****`.
 */
export function maskIban(iban: Iban): string {
  const formatted = iban.formatted;
  const firstSpace = formatted.indexOf(" ");
  if (firstSpace < 0) {
    const prefix = formatted.slice(0, Math.min(4, formatted.length));
    return prefix + "*".repeat(Math.max(0, formatted.length - 4));
  }
  const prefix = formatted.slice(0, firstSpace);
  const rest = formatted.slice(firstSpace + 1);
  let masked = "";
  for (const ch of rest) masked += ch === " " ? " " : "*";
  return `${prefix} ${masked}`;
}
