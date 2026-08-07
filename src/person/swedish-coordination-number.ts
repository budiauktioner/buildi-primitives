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

/** A Swedish Coordination Number (`samordningsnummer`). */
export class SwedishCoordinationNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Coordination Number",
    localizedName: "Samordningsnummer",
    emoji: "\u{1F194}",
    sources: Object.freeze([
      "https://skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e201130b.html",
      "https://sv.wikipedia.org/wiki/Samordningsnummer",
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
  get realDay(): number {
    return this._pin.realDay;
  }
  get dateOfBirthHint(): Date | null {
    return pinDateOfBirth(this._pin);
  }
  get ageHint(): number | null {
    return pinAgeInYears(this._pin, this._clock);
  }
  get genderHint(): "female" | "male" {
    return pinGender(this._pin);
  }

  static tryParse(
    input: string | null | undefined,
    options?: { clock?: Clock },
  ): SwedishCoordinationNumber | null {
    if (input == null || input.trim() === "") return null;
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length === 0 || sanitized.length > MAX_INPUT_LENGTH) return null;
    const clock = options?.clock ?? systemClock;
    const pin = parsePin(sanitized, clock);
    if (pin === null) return null;
    if (pin.kind !== "coordination") return null;
    return new SwedishCoordinationNumber(pin, clock);
  }

  static parse(input: string, options?: { clock?: Clock }): SwedishCoordinationNumber {
    const r = SwedishCoordinationNumber.tryParse(input, options);
    if (r === null) throw new Error("Invalid Swedish coordination number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishCoordinationNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean; clock?: Clock },
  ): string | null {
    const r = SwedishCoordinationNumber.tryParse(input, options);
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
    const r = SwedishCoordinationNumber.tryParse(input, options);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishCoordinationNumber.normalize(input) === input;
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
    if (pin === null || pin.kind !== "coordination") {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "Invalid coordination number format.",
        "Ogiltigt format för samordningsnummer.",
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

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishCoordinationNumber>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishCoordinationNumber>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const cn = SwedishCoordinationNumber.tryParse(m[0]);
      if (!cn) continue;
      out.push(
        new TextCandidate<SwedishCoordinationNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishCoordinationNumber",
          category: TextCandidateCategory.PersonalIdentifier,
          normalizedForm: cn.toNormalizedString(),
          formattedForm: cn.toString(),
          maskedForm: maskCoordinationNumber(cn),
          confidence: TextMatchConfidence.High,
          value: cn,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishCoordinationNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: SwedishCoordinationNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/** Mask a coordination number, e.g. `680164-2395` -> `680164-****`. */
export function maskCoordinationNumber(
  c: SwedishCoordinationNumber,
  options?: { maskBirthDate?: boolean },
): string {
  const f = c.formatted;
  if (options?.maskBirthDate) return "******-****";
  return f.slice(0, f.length - 4) + "****";
}
