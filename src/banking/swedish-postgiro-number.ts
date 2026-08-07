import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { luhnIsValid } from "../internal/luhn.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationResult, validResult, invalidResult } from "../validation/validation-result.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";

const MAX_INPUT_LENGTH = 20;
const DIGITS_2_TO_8 = /^\d{2,8}$/;

/**
 * A Swedish Plusgiro number (`plusgironummer`), e.g. `1234567-9`.
 * 2–8 digits with Luhn check digit.
 */
export class SwedishPostgiroNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Plusgiro Number",
    localizedName: "Plusgironummer",
    emoji: "\u{1F4EE}",
    sources: Object.freeze([
      "https://www.bankgirot.se/",
      "https://sv.wikipedia.org/wiki/Plusgirot",
    ]),
  });

  static readonly displayName = "Plusgiro";
  static readonly displayNameShort = "PG";

  /** Digit-only value, e.g. `41313008`. */
  readonly digits: string;
  /** Hyphenated display form, e.g. `4131300-8`. */
  readonly formatted: string;

  private constructor(digits: string, formatted: string) {
    this.digits = digits;
    this.formatted = formatted;
  }

  static tryParse(input: string | null | undefined): SwedishPostgiroNumber | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(sanitizeInput(input));
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (!DIGITS_2_TO_8.test(digits)) return null;
    if (!luhnIsValid(digits)) return null;

    const base = digits.slice(0, digits.length - 1);
    const control = digits.slice(digits.length - 1);
    return new SwedishPostgiroNumber(digits, `${base}-${control}`);
  }

  static parse(input: string): SwedishPostgiroNumber {
    const r = SwedishPostgiroNumber.tryParse(input);
    if (r === null) throw new Error("Invalid Plusgiro number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishPostgiroNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishPostgiroNumber.tryParse(input);
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
    return SwedishPostgiroNumber.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishPostgiroNumber.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.formatted;
  }

  toDisplayString(): string {
    return `${SwedishPostgiroNumber.displayName} ${this.formatted}`;
  }

  toShortDisplayString(): string {
    return `${SwedishPostgiroNumber.displayNameShort} ${this.formatted}`;
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

    const digits = keepDigits(sanitizeInput(input));

    if (digits.length > MAX_INPUT_LENGTH)
      return invalidResult(
        input,
        ValidationErrorReason.InputTooLong,
        "Input contains too many characters.",
        "Värdet innehåller för många tecken.",
      );

    if (!DIGITS_2_TO_8.test(digits))
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "Plusgiro number must be 2–8 digits.",
        "Plusgironummer måste vara 2–8 siffror.",
      );

    if (!luhnIsValid(digits))
      return invalidResult(
        input,
        ValidationErrorReason.InvalidCheckDigit,
        "Invalid Luhn check digit.",
        "Ogiltig kontrollsiffra.",
      );

    return validResult(input);
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishPostgiroNumber>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishPostgiroNumber>[] = [];
    const re = /(?<!\d)\d{1,7}-\d(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = SwedishPostgiroNumber.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<SwedishPostgiroNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishPostgiroNumber",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskSwedishPostgiroNumber(r),
          confidence: TextMatchConfidence.Medium,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishPostgiroNumber | null | undefined): boolean {
    return other != null && this.formatted === other.formatted;
  }
  compareTo(other: SwedishPostgiroNumber | null | undefined): number {
    if (other == null) return 1;
    return this.formatted < other.formatted ? -1 : this.formatted > other.formatted ? 1 : 0;
  }
}

/**
 * Returns a masked Plusgiro number, e.g. `******-9` (default, showing the control digit) or
 * `123456-*` when `showControlDigit` is `false`.
 */
export function maskSwedishPostgiroNumber(
  pg: SwedishPostgiroNumber,
  options?: { showControlDigit?: boolean },
): string {
  const showControlDigit = options?.showControlDigit ?? true;
  const formatted = pg.formatted;
  const dashIndex = formatted.indexOf("-");
  if (dashIndex < 0) return "*".repeat(formatted.length);
  if (showControlDigit) {
    return `${"*".repeat(dashIndex)}-${formatted.slice(dashIndex + 1)}`;
  }
  return `${formatted.slice(0, dashIndex)}-${"*".repeat(formatted.length - dashIndex - 1)}`;
}
