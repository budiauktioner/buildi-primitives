import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { luhnIsValid } from "../internal/luhn.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationResult, validResult, invalidResult } from "../validation/validation-result.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";

/** OCR reference control type. */
export const OcrReferenceControlType = {
  CheckDigitOnly: "CheckDigitOnly",
  VariableLengthDigit: "VariableLengthDigit",
  FixedLength: "FixedLength",
} as const;
export type OcrReferenceControlType =
  (typeof OcrReferenceControlType)[keyof typeof OcrReferenceControlType];

/** Options controlling OCR reference parsing. */
export class OcrReferenceOptions {
  static readonly Default: OcrReferenceOptions = new OcrReferenceOptions(
    OcrReferenceControlType.CheckDigitOnly,
  );
  static readonly VariableLengthDigit: OcrReferenceOptions = new OcrReferenceOptions(
    OcrReferenceControlType.VariableLengthDigit,
  );

  readonly controlType: OcrReferenceControlType;
  readonly allowedLengths: readonly number[];

  constructor(
    controlType: OcrReferenceControlType = OcrReferenceControlType.CheckDigitOnly,
    allowedLengths: readonly number[] = [],
  ) {
    this.controlType = controlType;
    this.allowedLengths = Object.freeze([...allowedLengths]);
  }

  static fixedLength(...allowedLengths: number[]): OcrReferenceOptions {
    return new OcrReferenceOptions(OcrReferenceControlType.FixedLength, allowedLengths);
  }
}

/**
 * A Swedish OCR reference number (`OCR-nummer`), used in payment flows.
 * 2–25 digits with Luhn check digit; optional length-digit and fixed-length variants.
 */
export class SwedishOcrReferenceNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "OCR Reference Number",
    localizedName: "OCR-referens",
    emoji: "\u{1F4DD}",
    sources: Object.freeze([
      "https://www.bankgirot.se/en/services/incoming-payments/bankgiro-receivables/ocr-reference-control/",
      "https://www.bankgirot.se/en/services/incoming-payments/bankgiro-receivables/technical-information/",
    ]),
  });

  static readonly displayName = "OCR";
  static readonly displayNameShort = "OCR";

  readonly value: string;
  readonly formatted: string;
  readonly lengthDigit: number | null;

  get length(): number {
    return this.value.length;
  }
  get checkDigit(): number {
    return this.value.charCodeAt(this.value.length - 1) - 0x30;
  }

  private constructor(value: string, lengthDigit: number | null) {
    this.value = value;
    this.formatted = value;
    this.lengthDigit = lengthDigit;
  }

  static tryParse(
    input: string | null | undefined,
    options: OcrReferenceOptions = OcrReferenceOptions.Default,
  ): SwedishOcrReferenceNumber | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(sanitizeInput(input));
    if (digits.length < 2 || digits.length > 25) return null;
    if (!luhnIsValid(digits)) return null;
    const lengthDigit = validateByOptions(digits, options);
    if (lengthDigit === false) return null;
    return new SwedishOcrReferenceNumber(digits, lengthDigit);
  }

  static tryParseVariableLengthDigit(
    input: string | null | undefined,
  ): SwedishOcrReferenceNumber | null {
    return SwedishOcrReferenceNumber.tryParse(input, OcrReferenceOptions.VariableLengthDigit);
  }

  static tryParseFixedLength(
    input: string | null | undefined,
    fixedLengths: number | readonly number[],
  ): SwedishOcrReferenceNumber | null {
    const lengths = typeof fixedLengths === "number" ? [fixedLengths] : [...fixedLengths];
    return SwedishOcrReferenceNumber.tryParse(input, OcrReferenceOptions.fixedLength(...lengths));
  }

  static parse(
    input: string,
    options: OcrReferenceOptions = OcrReferenceOptions.Default,
  ): SwedishOcrReferenceNumber {
    const r = SwedishOcrReferenceNumber.tryParse(input, options);
    if (r === null) throw new Error("Invalid OCR reference number.");
    return r;
  }

  static isValid(
    input: string | null | undefined,
    options: OcrReferenceOptions = OcrReferenceOptions.Default,
  ): boolean {
    return SwedishOcrReferenceNumber.tryParse(input, options) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishOcrReferenceNumber.tryParse(input);
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
    const r = SwedishOcrReferenceNumber.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishOcrReferenceNumber.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toDisplayString(): string {
    return `${SwedishOcrReferenceNumber.displayName} ${this.formatted}`;
  }

  toShortDisplayString(): string {
    return `${SwedishOcrReferenceNumber.displayNameShort} ${this.formatted}`;
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

    if (digits.length < 2 || digits.length > 25)
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "OCR reference must be 2–25 digits.",
        "OCR-referens måste vara 2–25 siffror.",
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

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishOcrReferenceNumber>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishOcrReferenceNumber>[] = [];
    const re = /(?<!\d)\d{2,25}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = SwedishOcrReferenceNumber.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<SwedishOcrReferenceNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishOcrReferenceNumber",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskSwedishOcrReferenceNumber(r),
          confidence: TextMatchConfidence.Low,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishOcrReferenceNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: SwedishOcrReferenceNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function validateByOptions(digits: string, options: OcrReferenceOptions): number | null | false {
  switch (options.controlType) {
    case OcrReferenceControlType.CheckDigitOnly:
      return null;
    case OcrReferenceControlType.VariableLengthDigit: {
      if (digits.length < 3) return false;
      const expected = digits.length % 10;
      const actual = digits.charCodeAt(digits.length - 2) - 0x30;
      if (actual !== expected) return false;
      return actual;
    }
    case OcrReferenceControlType.FixedLength:
      return options.allowedLengths.length > 0 && options.allowedLengths.includes(digits.length)
        ? null
        : false;
    default:
      return false;
  }
}

/** Returns a fully masked OCR reference, e.g. `12345678901` → `***********`. */
export function maskSwedishOcrReferenceNumber(ocr: SwedishOcrReferenceNumber): string {
  return "*".repeat(ocr.value.length);
}
