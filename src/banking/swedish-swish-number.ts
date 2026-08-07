import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { PhoneNumber, maskPhoneNumber } from "../contact/phone-number.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

const MAX_INPUT_LENGTH = 50;
const DIGITS_7_STARTING_90 = /^90\d{5}$/;

/**
 * A Swedish Swish payment number (`Swish-nummer`).
 * Accepts:
 * - Swish 123 numbers (10 digits starting with `123`)
 * - 90-numbers (7 digits starting with `90X`, expanded to `123` + 7 digits)
 * - Swedish mobile phone numbers
 */
export class SwedishSwishNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Swish Number",
    localizedName: "Swish-nummer",
    emoji: "\u{1F4F1}",
    sources: Object.freeze([
      "https://www.swish.nu/faq/company/what-is-the-format-of-the-swish-number",
      "https://github.com/cisene/swish-123",
      "https://www.insamlingskontroll.se/",
    ]),
  });

  readonly value: string;
  readonly formatted: string;
  readonly isSwish123: boolean;
  readonly isMobileNumber: boolean;
  readonly is90Number: boolean;
  readonly phoneNumber: PhoneNumber | null;

  private constructor(
    value: string,
    formatted: string,
    isSwish123: boolean,
    isMobileNumber: boolean,
    is90Number: boolean,
    phoneNumber: PhoneNumber | null,
  ) {
    this.value = value;
    this.formatted = formatted;
    this.isSwish123 = isSwish123;
    this.isMobileNumber = isMobileNumber;
    this.is90Number = is90Number;
    this.phoneNumber = phoneNumber;
  }

  static tryParse(input: string | null | undefined): SwedishSwishNumber | null {
    if (input == null || input.trim() === "") return null;
    const cleaned = sanitizeInput(input).trim();
    if (cleaned.length > MAX_INPUT_LENGTH) return null;

    const digits = keepDigits(cleaned);

    if (DIGITS_7_STARTING_90.test(digits)) {
      const expanded = "123" + digits;
      return new SwedishSwishNumber(expanded, format90Number(digits), true, false, true, null);
    }

    if (digits.length === 10 && digits.startsWith("123")) {
      const is90 = digits.startsWith("1239");
      return new SwedishSwishNumber(
        digits,
        is90 ? format90Number(digits.slice(3)) : formatSwish123(digits),
        true,
        false,
        is90,
        null,
      );
    }

    const phone = PhoneNumber.tryParse(cleaned);
    if (phone !== null && phone.isSwedish && phone.isMobile) {
      return new SwedishSwishNumber(phone.digits, phone.formatted, false, true, false, phone);
    }

    return null;
  }

  static parse(input: string): SwedishSwishNumber {
    const r = SwedishSwishNumber.tryParse(input);
    if (r === null) throw new Error("Invalid Swish number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishSwishNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishSwishNumber.tryParse(input);
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
    const r = SwedishSwishNumber.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishSwishNumber.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.formatted;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishSwishNumber>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishSwishNumber>[] = [];
    const re =
      /(?<!\d)123[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)|(?<!\d)90[0-9][\s-]?\d{2}[\s-]?\d{2}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = SwedishSwishNumber.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<SwedishSwishNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishSwishNumber",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskSwedishSwishNumber(r),
          confidence: TextMatchConfidence.Medium,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishSwishNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: SwedishSwishNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function formatSwish123(digits: string): string {
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

function format90Number(shortDigits: string): string {
  if (shortDigits.length !== 7) return shortDigits;
  return `${shortDigits.slice(0, 3)} ${shortDigits.slice(3, 5)} ${shortDigits.slice(5, 7)}`;
}

/**
 * Returns a masked Swish number, e.g. `123-*** ** **` for 123-numbers,
 * `9** ** **` for 90-numbers.
 */
export function maskSwedishSwishNumber(swish: SwedishSwishNumber): string {
  if (swish.is90Number) {
    const shortDigits = swish.value.slice(3);
    return `${shortDigits[0]}** ** **`;
  }
  if (swish.isSwish123) return "123-*** ** **";
  return swish.phoneNumber !== null
    ? maskPhoneNumber(swish.phoneNumber)
    : "*".repeat(swish.value.length);
}
