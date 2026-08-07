import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { resolveBank } from "./bank-resolver.js";
import { SwedishBank } from "./swedish-bank.js";
import { ValidationResult, validResult, invalidResult } from "../validation/validation-result.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";

const MAX_INPUT_LENGTH = 20;

/**
 * A Swedish clearing number (`clearingnummer`), 4 digits (or 5 starting with `8` for Swedbank).
 */
export class SwedishBankClearingNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Bank Clearing Number",
    localizedName: "Clearingnummer",
    emoji: "\u{1F511}",
    sources: Object.freeze([
      "https://www.bankinfrastruktur.se/framtidens-betalningsinfrastruktur/iban-och-svenskt-nationellt-kontonummer#clearingTable",
      "https://sv.wikipedia.org/wiki/Clearingnummer",
    ]),
  });

  readonly digits: string;
  readonly bank: SwedishBank;
  readonly bankName: string;

  private constructor(digits: string, bank: SwedishBank, bankName: string) {
    this.digits = digits;
    this.bank = bank;
    this.bankName = bankName;
  }

  static tryParse(input: string | null | undefined): SwedishBankClearingNumber | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(sanitizeInput(input));
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (digits.length < 4 || digits.length > 5) return null;

    if (digits.length === 5 && digits[0] !== "8") return null;
    if (digits.length === 4 && digits[0] === "8") return null;

    const clearing4 = parseInt4(digits);
    const { bank, bankName } = resolveBank(clearing4);
    if (bank === null || bankName === null) return null;

    return new SwedishBankClearingNumber(digits, bank, bankName);
  }

  static parse(input: string): SwedishBankClearingNumber {
    const r = SwedishBankClearingNumber.tryParse(input);
    if (r === null) throw new Error("Invalid clearing number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishBankClearingNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishBankClearingNumber.tryParse(input);
    if (r) return r.toString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishBankClearingNumber.tryParse(input);
    if (r) return r.digits;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishBankClearingNumber.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.digits;
  }

  toString(): string {
    return this.digits.length === 5 ? `${this.digits.slice(0, 4)}-${this.digits[4]}` : this.digits;
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

    if (digits.length < 4 || digits.length > 5)
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "Clearing number must be 4 or 5 digits.",
        "Clearingnummer måste vara 4 eller 5 siffror.",
      );

    if (digits.length === 5 && digits[0] !== "8")
      return invalidResult(
        input,
        ValidationErrorReason.InvalidSwedbankFormat,
        "A 5-digit clearing number must start with 8 (Swedbank).",
        "Ett 5-siffrigt clearingnummer måste börja med 8 (Swedbank).",
      );

    if (digits.length === 4 && digits[0] === "8")
      return invalidResult(
        input,
        ValidationErrorReason.InvalidSwedbankFormat,
        "Clearing numbers starting with 8 must be 5 digits (Swedbank).",
        "Clearingnummer som börjar med 8 måste vara 5 siffror (Swedbank).",
      );

    const clearing4 = parseInt4(digits);
    const { bank, bankName } = resolveBank(clearing4);
    if (bank === null || bankName === null)
      return invalidResult(
        input,
        ValidationErrorReason.UnknownClearingRange,
        "Clearing number does not match any known bank.",
        "Clearingnumret matchar ingen känd bank.",
      );

    return validResult(input);
  }

  equals(other: SwedishBankClearingNumber | null | undefined): boolean {
    return other != null && this.digits === other.digits;
  }
  compareTo(other: SwedishBankClearingNumber | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

function parseInt4(s: string): number {
  return (
    (s.charCodeAt(0) - 0x30) * 1000 +
    (s.charCodeAt(1) - 0x30) * 100 +
    (s.charCodeAt(2) - 0x30) * 10 +
    (s.charCodeAt(3) - 0x30)
  );
}

/** Returns a masked clearing number showing the bank identifier (first digit), e.g. `5001` → `5***`. */
export function maskSwedishBankClearingNumber(c: SwedishBankClearingNumber): string {
  const digits = c.digits;
  return digits.length <= 1 ? "*".repeat(digits.length) : digits[0] + "*".repeat(digits.length - 1);
}
