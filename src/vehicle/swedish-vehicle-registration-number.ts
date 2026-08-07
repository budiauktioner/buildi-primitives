import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";
import {
  invalidResult,
  validResult,
  type ValidationResult,
} from "../validation/validation-result.js";

/** Options for {@link SwedishVehicleRegistrationNumber.format} and `normalize`. */
export interface SwedishVehicleRegistrationNumberFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MAX_INPUT_LENGTH = 20;

// I, Q, V, Å, Ä and Ö are never used; O is additionally barred from the last position.
const PATTERN = /^[A-HJ-NOPR-UW-Z]{3}\d{2}[\dA-HJ-NPR-UW-Z]$/u;
const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])[A-HJ-NOPR-UW-Z]{3}\s?\d{2}[\dA-HJ-NPR-UW-Z](?![\p{L}\p{N}_])/giu;

/** Transportstyrelsen's mapping from the tax digit to the month tax falls due. */
const TAX_MONTH_BY_DIGIT = [3, 4, 5, 6, 8, 10, 11, 12, 1, 2];

/**
 * A Swedish vehicle registration number (`registreringsnummer`) issued by
 * Transportstyrelsen. The classic form is three letters and three digits
 * (`ABC 123`); since 2019 the final digit may instead be a letter (`ABC 12A`).
 *
 * The tax payment month is derived structurally from the number and says nothing
 * about any particular vehicle's actual tax status.
 *
 * Sources:
 * - https://www.transportstyrelsen.se/en/road/vehicles/licence-plates/
 * - https://www.transportstyrelsen.se/en/road/vehicles/taxes-and-fees/vehicle-tax/
 * - https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Sweden
 */
export class SwedishVehicleRegistrationNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Registration Number",
    localizedName: "Registreringsnummer",
    emoji: "🚗",
    sources: Object.freeze([
      "https://www.transportstyrelsen.se/en/road/vehicles/licence-plates/",
      "https://www.transportstyrelsen.se/en/road/vehicles/taxes-and-fees/vehicle-tax/",
      "https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Sweden",
    ]),
  });

  /** The registration number without spaces, e.g. `ABC123`. */
  readonly value: string;

  /** Display form with a space, e.g. `ABC 123`. */
  readonly formatted: string;

  /** The three-letter prefix, e.g. `ABC`. */
  readonly letters: string;

  /** The part after the letter prefix, e.g. `123` or `12A`. */
  readonly suffix: string;

  /** `true` when the number uses the 2019 format whose last character is a letter. */
  readonly isNewFormat: boolean;

  /** The digit the tax payment month is derived from. */
  readonly taxPaymentDigit: number;

  /** The month (1–12) when vehicle tax is normally due. */
  readonly taxPaymentMonth: number;

  private constructor(value: string, letters: string, suffix: string, isNewFormat: boolean) {
    this.value = value;
    this.formatted = `${letters} ${suffix}`;
    this.letters = letters;
    this.suffix = suffix;
    this.isNewFormat = isNewFormat;
    this.taxPaymentDigit = Number(isNewFormat ? value[4] : value[5]);
    this.taxPaymentMonth = TAX_MONTH_BY_DIGIT[this.taxPaymentDigit]!;
  }

  static tryParse(input: string | null | undefined): SwedishVehicleRegistrationNumber | null {
    const cleaned = clean(input);
    if (cleaned === null || cleaned.length !== 6 || !PATTERN.test(cleaned)) return null;

    return new SwedishVehicleRegistrationNumber(
      cleaned,
      cleaned.slice(0, 3),
      cleaned.slice(3),
      /[A-Z]/u.test(cleaned[5]!),
    );
  }

  static parse(input: string): SwedishVehicleRegistrationNumber {
    const result = SwedishVehicleRegistrationNumber.tryParse(input);
    if (result === null) throw new Error("Invalid Swedish vehicle registration number.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishVehicleRegistrationNumber.tryParse(input) !== null;
  }

  /** Returns the display form with a space, e.g. `ABC 123`. */
  static format(
    input: string | null | undefined,
    options?: SwedishVehicleRegistrationNumberFormatOptions,
  ): string | null {
    const parsed = SwedishVehicleRegistrationNumber.tryParse(input);
    if (parsed !== null) return parsed.formatted;
    return fallback(input, options);
  }

  /** Returns the number without spaces, e.g. `ABC123`. */
  static normalize(
    input: string | null | undefined,
    options?: SwedishVehicleRegistrationNumberFormatOptions,
  ): string | null {
    const parsed = SwedishVehicleRegistrationNumber.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishVehicleRegistrationNumber.normalize(input) === input;
  }

  /** Describes why the input is not a registration number, or reports it as valid. */
  static validate(input: string | null | undefined): ValidationResult {
    if (input == null || input.trim() === "") {
      return invalidResult(
        input,
        ValidationErrorReason.InputIsEmpty,
        "Input is empty or whitespace.",
        "Värdet är tomt.",
      );
    }

    const cleaned = clean(input)!;

    if (cleaned.length > MAX_INPUT_LENGTH) {
      return invalidResult(
        input,
        ValidationErrorReason.InputTooLong,
        "Input contains too many characters.",
        "Värdet innehåller för många tecken.",
      );
    }

    if (cleaned.length !== 6) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "Registration number must be exactly 6 characters.",
        "Registreringsnumret måste vara exakt 6 tecken.",
      );
    }

    if (!PATTERN.test(cleaned)) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "Registration number must be three letters followed by two digits and one digit or letter (I, Q, V, Å, Ä, Ö excluded).",
        "Registreringsnumret måste vara tre bokstäver följt av två siffror och en siffra eller bokstav (I, Q, V, Å, Ä, Ö exkluderade).",
      );
    }

    return validResult(input);
  }

  /** Finds registration-number candidates in unstructured text. */
  static findCandidatesInText(
    text: string,
  ): readonly TextCandidate<SwedishVehicleRegistrationNumber>[] {
    if (!text) return [];

    const out: TextCandidate<SwedishVehicleRegistrationNumber>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = SwedishVehicleRegistrationNumber.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<SwedishVehicleRegistrationNumber>({
          startIndex: match.index,
          length: match[0].length,
          originalText: text.slice(match.index, match.index + match[0].length),
          typeName: "SwedishVehicleRegistrationNumber",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskSwedishVehicleRegistrationNumber(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the number without spaces, e.g. `ABC123`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the display form with a space, e.g. `ABC 123`. */
  toString(): string {
    return this.formatted;
  }

  equals(other: SwedishVehicleRegistrationNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: SwedishVehicleRegistrationNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/** Returns a masked registration number, e.g. `ABC 123` becomes `*** ***`. */
export function maskSwedishVehicleRegistrationNumber(
  registration: SwedishVehicleRegistrationNumber,
): string {
  return `${"*".repeat(registration.letters.length)} ${"*".repeat(registration.suffix.length)}`;
}

function clean(input: string | null | undefined): string | null {
  if (input == null || input.trim().length === 0) return null;
  return sanitizeInput(input).trim().toUpperCase().replaceAll(" ", "").replaceAll("-", "");
}

function fallback(
  input: string | null | undefined,
  options?: SwedishVehicleRegistrationNumberFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
