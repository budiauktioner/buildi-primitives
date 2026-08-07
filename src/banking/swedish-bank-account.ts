import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationResult, validResult, invalidResult } from "../validation/validation-result.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";
import { SwedishBankClearingNumber } from "./swedish-bank-clearing-number.js";
import { SwedishBank } from "./swedish-bank.js";
import {
  isHandelsbanken,
  isNordeaPersonkonto,
  isNordeaPlusgirot,
  isRiksgalden,
  isSparbankenSyd,
  isSwedbank10DigitsAccountNumber,
  resolveBank,
} from "./bank-resolver.js";

const MAX_INPUT_LENGTH = 40;
const DIGITS_11_TO_15 = /^\d{11,15}$/;

/**
 * A Swedish bank account, identified by clearing number + account number with
 * bank-specific length rules.
 */
export class SwedishBankAccount {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Bank Account",
    localizedName: "Bankkonto",
    emoji: "\u{1F3E7}",
    sources: Object.freeze([
      "https://www.bankinfrastruktur.se/framtidens-betalningsinfrastruktur/iban-och-svenskt-nationellt-kontonummer#clearingTable",
      "https://sv.wikipedia.org/wiki/Clearingnummer",
    ]),
  });

  static readonly displayName = "Bankkonto";

  readonly clearing: SwedishBankClearingNumber;
  readonly accountNumber: string;
  readonly formatted: string;

  get clearingNumber(): string {
    return this.clearing.digits;
  }
  get bankName(): string | null {
    return this.clearing.bankName;
  }
  get bank(): SwedishBank | null {
    return this.clearing.bank;
  }

  private constructor(
    clearing: SwedishBankClearingNumber,
    accountNumber: string,
    formatted: string,
  ) {
    this.clearing = clearing;
    this.accountNumber = accountNumber;
    this.formatted = formatted;
  }

  static tryParse(input: string | null | undefined): SwedishBankAccount | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(sanitizeInput(input));
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (!DIGITS_11_TO_15.test(digits)) return null;
    if (!isValidLength(digits)) return null;

    const { clearingDigits, account } = splitClearingAndAccount(digits);
    const clearing = SwedishBankClearingNumber.tryParse(clearingDigits);
    if (clearing === null) return null;

    return new SwedishBankAccount(clearing, account, `${clearingDigits}-${account}`);
  }

  static parse(input: string): SwedishBankAccount {
    const r = SwedishBankAccount.tryParse(input);
    if (r === null) throw new Error("Invalid Bankkonto number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishBankAccount.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishBankAccount.tryParse(input);
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
    const r = SwedishBankAccount.tryParse(input);
    if (r) return r.clearingNumber + r.accountNumber;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishBankAccount.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.clearingNumber + this.accountNumber;
  }

  toDisplayString(): string {
    return `${SwedishBankAccount.displayName} ${this.formatted}`;
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

    if (!DIGITS_11_TO_15.test(digits))
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "Bank account must be 11–15 digits.",
        "Bankkonto måste vara 11–15 siffror.",
      );

    if (!isValidLength(digits))
      return invalidResult(
        input,
        ValidationErrorReason.InvalidAccountLengthForBank,
        "Account length is wrong for the identified bank.",
        "Kontolängden stämmer inte för den identifierade banken.",
      );

    const { clearingDigits } = splitClearingAndAccount(digits);
    if (SwedishBankClearingNumber.tryParse(clearingDigits) === null)
      return invalidResult(
        input,
        ValidationErrorReason.InvalidClearingNumber,
        "The clearing number part is invalid.",
        "Clearingnummerdelen är ogiltig.",
      );

    return validResult(input);
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishBankAccount>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishBankAccount>[] = [];
    const re = /(?<!\d)\d{4,5}[\s-]?\d{5,10}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = SwedishBankAccount.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<SwedishBankAccount>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishBankAccount",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskSwedishBankAccount(r),
          confidence: TextMatchConfidence.Low,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishBankAccount | null | undefined): boolean {
    return (
      other != null &&
      this.clearingNumber === other.clearingNumber &&
      this.accountNumber === other.accountNumber
    );
  }
  compareTo(other: SwedishBankAccount | null | undefined): number {
    if (other == null) return 1;
    const a = this.toNormalizedString();
    const b = other.toNormalizedString();
    return a < b ? -1 : a > b ? 1 : 0;
  }
}

function isValidLength(digits: string): boolean {
  const length = digits.length;
  const c4 = parseInt4(digits);

  if (isHandelsbanken(c4)) return length >= 12 && length <= 13;
  if (isNordeaPersonkonto(c4)) return length === 14;
  if (isNordeaPlusgirot(c4)) return length === 14;
  if (isSparbankenSyd(c4)) return length === 14;
  if (isRiksgalden(c4)) return length === 14;
  if (isSwedbank10DigitsAccountNumber(c4)) return length >= 7 && length <= 15;

  const { bank } = resolveBank(c4);
  return bank !== null && length === 11;
}

function splitClearingAndAccount(digits: string): { clearingDigits: string; account: string } {
  if (digits[0] === "8") {
    return { clearingDigits: digits.slice(0, 5), account: digits.slice(5) };
  }
  return { clearingDigits: digits.slice(0, 4), account: digits.slice(4) };
}

function parseInt4(s: string): number {
  return (
    (s.charCodeAt(0) - 0x30) * 1000 +
    (s.charCodeAt(1) - 0x30) * 100 +
    (s.charCodeAt(2) - 0x30) * 10 +
    (s.charCodeAt(3) - 0x30)
  );
}

/**
 * Returns a masked bank account showing the clearing number, e.g. `5100-*******`.
 * Pass `maskClearingNumber: true` to also mask the clearing number.
 */
export function maskSwedishBankAccount(
  account: SwedishBankAccount,
  options?: { maskClearingNumber?: boolean },
): string {
  const maskClearing = options?.maskClearingNumber ?? false;
  const clearing = maskClearing
    ? "*".repeat(account.clearingNumber.length)
    : account.clearingNumber;
  return `${clearing}-${"*".repeat(account.accountNumber.length)}`;
}
