import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { Clock, systemClock } from "../internal/clock.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationErrorReason, ValidationResult } from "../validation/index.js";
import { invalidResult, validResult } from "../validation/validation-result.js";
import {
  ParsedPin,
  parsePin,
  pinAgeInYears,
  pinDateOfBirth,
  pinGender,
  pinTo10Digit,
  pinTo12Digit,
} from "./personnummer-parser.js";

const MAX_INPUT_LENGTH = 20;

const SCAN_PATTERN = /(?<!\d)(\d{6,8})([-+])(\d{4})(?!\d)/g;

/** A Swedish Personal Identity Number (`personnummer`). */
export class SwedishPersonalIdentityNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Personal Identity Number",
    localizedName: "Personnummer",
    emoji: "\u{1FAAA}",
    sources: Object.freeze([
      "https://skatteverket.se/privat/folkbokforing/personnummer.4.3810a01c150939e893f18c29.html",
      "https://sv.wikipedia.org/wiki/Personnummer_i_Sverige",
      "https://en.wikipedia.org/wiki/Luhn_algorithm",
    ]),
  });

  readonly _pin: ParsedPin;
  readonly _clock: Clock;

  private constructor(pin: ParsedPin, clock: Clock) {
    this._pin = pin;
    this._clock = clock;
  }

  get formatted(): string {
    return pinTo10Digit(this._pin, this._clock);
  }
  get value(): string {
    return pinTo12Digit(this._pin);
  }
  get dateOfBirthHint(): Date {
    const d = pinDateOfBirth(this._pin);
    if (d === null) throw new Error("Date of birth is unknown.");
    return d;
  }
  get ageHint(): number {
    const a = pinAgeInYears(this._pin, this._clock);
    if (a === null) throw new Error("Age is unknown.");
    return a;
  }
  get genderHint(): "female" | "male" {
    return pinGender(this._pin);
  }

  static tryParse(
    input: string | null | undefined,
    options?: { clock?: Clock },
  ): SwedishPersonalIdentityNumber | null {
    if (input == null || input.trim() === "") return null;
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length === 0 || sanitized.length > MAX_INPUT_LENGTH) return null;
    const clock = options?.clock ?? systemClock;
    const pin = parsePin(sanitized, clock);
    if (pin === null) return null;
    if (pin.kind !== "personal") return null;
    return new SwedishPersonalIdentityNumber(pin, clock);
  }

  static parse(input: string, options?: { clock?: Clock }): SwedishPersonalIdentityNumber {
    const r = SwedishPersonalIdentityNumber.tryParse(input, options);
    if (r === null) throw new Error("Invalid Swedish personal identity number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishPersonalIdentityNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean; clock?: Clock },
  ): string | null {
    const r = SwedishPersonalIdentityNumber.tryParse(input, options);
    if (r) return r.formatted;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean; clock?: Clock },
  ): string | null {
    const r = SwedishPersonalIdentityNumber.tryParse(input, options);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishPersonalIdentityNumber.normalize(input) === input;
  }

  static validate(input: string | null | undefined): ValidationResult {
    if (input == null || input.trim() === "") {
      return invalidResult(
        input,
        ValidationErrorReason.InputIsEmpty,
        "Input is empty or whitespace.",
        "Värdet är tomt.",
      );
    }
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length > MAX_INPUT_LENGTH) {
      return invalidResult(
        input,
        ValidationErrorReason.InputTooLong,
        "Input contains too many characters.",
        "Värdet innehåller för många tecken.",
      );
    }
    const pin = parsePin(sanitized);
    if (pin === null || pin.kind !== "personal") {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "Invalid personal identity number format.",
        "Ogiltigt format för personnummer.",
      );
    }
    return validResult(input);
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.formatted;
  }

  to10DigitString(): string {
    return this.formatted;
  }
  to12DigitString(): string {
    return this.value;
  }

  static findCandidatesInText(
    text: string,
  ): readonly TextCandidate<SwedishPersonalIdentityNumber>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishPersonalIdentityNumber>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const pin = SwedishPersonalIdentityNumber.tryParse(m[0]);
      if (!pin) continue;
      out.push(
        new TextCandidate<SwedishPersonalIdentityNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishPersonalIdentityNumber",
          category: TextCandidateCategory.PersonalIdentifier,
          normalizedForm: pin.toNormalizedString(),
          formattedForm: pin.toString(),
          maskedForm: maskPersonalIdentityNumber(pin),
          confidence: TextMatchConfidence.High,
          value: pin,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishPersonalIdentityNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: SwedishPersonalIdentityNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/** Mask a personal identity number, e.g. `990807-2391` -> `990807-****`. */
export function maskPersonalIdentityNumber(
  p: SwedishPersonalIdentityNumber,
  options?: { maskBirthDate?: boolean },
): string {
  const f = p.formatted;
  if (options?.maskBirthDate) return "******-****";
  return f.slice(0, f.length - 4) + "****";
}
