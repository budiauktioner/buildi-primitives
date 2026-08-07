import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { luhnIsValid } from "../internal/luhn.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationResult, validResult, invalidResult } from "../validation/validation-result.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";

const MAX_INPUT_LENGTH = 20;
const DIGITS_7_OR_8 = /^\d{7,8}$/;

/**
 * A Swedish Bankgiro number (`bankgironummer`), e.g. `5805-6201`.
 * 7 or 8 digits with Luhn check digit.
 */
export class SwedishBankgiroNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Bankgiro Number",
    localizedName: "Bankgironummer",
    emoji: "\u{1F4B3}",
    sources: Object.freeze([
      "https://www.bankgirot.se/en/services/incoming-payments/bankgiro-number/",
      "https://sv.wikipedia.org/wiki/Bankgirot",
    ]),
  });

  static readonly displayName = "Bankgiro";
  static readonly displayNameShort = "BG";

  /** Digit-only value, e.g. `58056201`. */
  readonly digits: string;
  /** Hyphenated display form, e.g. `5805-6201`. */
  readonly formatted: string;

  private constructor(digits: string, formatted: string) {
    this.digits = digits;
    this.formatted = formatted;
  }

  static tryParse(input: string | null | undefined): SwedishBankgiroNumber | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(sanitizeInput(input));
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (!DIGITS_7_OR_8.test(digits)) return null;
    if (!luhnIsValid(digits)) return null;

    const formatted =
      digits.length === 7
        ? `${digits.slice(0, 3)}-${digits.slice(3)}`
        : `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return new SwedishBankgiroNumber(digits, formatted);
  }

  static parse(input: string): SwedishBankgiroNumber {
    const r = SwedishBankgiroNumber.tryParse(input);
    if (r === null) throw new Error("Invalid Bankgiro number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishBankgiroNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishBankgiroNumber.tryParse(input);
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
    return SwedishBankgiroNumber.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishBankgiroNumber.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.formatted;
  }

  toDisplayString(): string {
    return `${SwedishBankgiroNumber.displayName} ${this.formatted}`;
  }

  toShortDisplayString(): string {
    return `${SwedishBankgiroNumber.displayNameShort} ${this.formatted}`;
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

    if (!DIGITS_7_OR_8.test(digits))
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "Bankgiro number must be 7 or 8 digits.",
        "Bankgironummer måste vara 7 eller 8 siffror.",
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

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishBankgiroNumber>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishBankgiroNumber>[] = [];
    const re = /(?<!\d)\d{3,4}-\d{4}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = SwedishBankgiroNumber.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<SwedishBankgiroNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishBankgiroNumber",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskSwedishBankgiroNumber(r),
          confidence: TextMatchConfidence.High,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishBankgiroNumber | null | undefined): boolean {
    return other != null && this.formatted === other.formatted;
  }
  compareTo(other: SwedishBankgiroNumber | null | undefined): number {
    if (other == null) return 1;
    return this.formatted < other.formatted ? -1 : this.formatted > other.formatted ? 1 : 0;
  }
}

/** Returns the Bankgirot search URL for this Bankgiro number. */
export function getBankgirotUrl(bg: SwedishBankgiroNumber): string {
  return `https://www.bankgirot.se/sok-bankgironummer/?bgnr=${bg.formatted}`;
}

/**
 * Returns a masked Bankgiro number, e.g. `****-6201` (default) or `5805-****` when
 * `showLastDigits` is `false`.
 */
export function maskSwedishBankgiroNumber(
  bg: SwedishBankgiroNumber,
  options?: { showLastDigits?: boolean },
): string {
  const showLastDigits = options?.showLastDigits ?? true;
  const formatted = bg.formatted;
  const dashIndex = formatted.indexOf("-");
  if (dashIndex < 0) return "*".repeat(formatted.length);
  if (showLastDigits) {
    return `${"*".repeat(dashIndex)}-${formatted.slice(dashIndex + 1)}`;
  }
  return `${formatted.slice(0, dashIndex)}-${"*".repeat(formatted.length - dashIndex - 1)}`;
}
