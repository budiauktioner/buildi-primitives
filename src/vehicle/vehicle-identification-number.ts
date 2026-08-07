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

/** Options for {@link VehicleIdentificationNumber.format} and `normalize`. */
export interface VehicleIdentificationNumberFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MAX_INPUT_LENGTH = 30;

// I, O and Q are excluded so they cannot be confused with 1 and 0.
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/u;
const SCAN_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/gu;

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

const TRANSLITERATION: Readonly<Record<string, number>> = Object.freeze({
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
});

// ISO 3779 / SAE J853 model year encoding; the cycle repeats every 30 years.
const MODEL_YEAR_MAP: Readonly<Record<string, readonly number[]>> = Object.freeze({
  A: [1980, 2010],
  B: [1981, 2011],
  C: [1982, 2012],
  D: [1983, 2013],
  E: [1984, 2014],
  F: [1985, 2015],
  G: [1986, 2016],
  H: [1987, 2017],
  J: [1988, 2018],
  K: [1989, 2019],
  L: [1990, 2020],
  M: [1991, 2021],
  N: [1992, 2022],
  P: [1993, 2023],
  R: [1994, 2024],
  S: [1995, 2025],
  T: [1996, 2026],
  V: [1997, 2027],
  W: [1998, 2028],
  X: [1999, 2029],
  Y: [2000, 2030],
  "1": [2001, 2031],
  "2": [2002, 2032],
  "3": [2003, 2033],
  "4": [2004, 2034],
  "5": [2005, 2035],
  "6": [2006, 2036],
  "7": [2007, 2037],
  "8": [2008, 2038],
  "9": [2009, 2039],
});

/**
 * A Vehicle Identification Number (VIN), also known as a chassis number
 * (`chassinummer`): the 17-character ISO 3779 code that uniquely identifies a motor
 * vehicle. Position 9 holds a MOD-11 check digit, mandatory in North America and
 * common but not universal in Europe.
 *
 * Sources:
 * - https://www.iso.org/standard/52200.html
 * - https://en.wikipedia.org/wiki/Vehicle_identification_number
 * - https://en.wikibooks.org/wiki/Vehicle_Identification_Numbers_(VIN_codes)/Check_digit
 */
export class VehicleIdentificationNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "VIN",
    localizedName: "Chassinummer",
    emoji: "🔧",
    sources: Object.freeze([
      "https://www.iso.org/standard/52200.html",
      "https://en.wikipedia.org/wiki/Vehicle_identification_number",
      "https://en.wikibooks.org/wiki/Vehicle_Identification_Numbers_(VIN_codes)/Check_digit",
    ]),
  });

  /** The 17-character VIN in uppercase, e.g. `WBA3A5C55CF256789`. */
  readonly value: string;

  /** World Manufacturer Identifier — positions 1–3. */
  readonly wmi: string;

  /** Vehicle Descriptor Section — positions 4–8. */
  readonly vds: string;

  /** The check digit at position 9 (a digit or `X`). */
  readonly checkDigit: string;

  /** Vehicle Indicator Section — positions 10–17. */
  readonly vis: string;

  /** The model year code at position 10. */
  readonly modelYearCode: string;

  /** The model years the code at position 10 can encode, e.g. `M` means 1991 or 2021. */
  readonly modelYears: readonly number[];

  /** The assembly plant code at position 11. */
  readonly assemblyPlantCode: string;

  /** The sequential production number — positions 12–17. */
  readonly sequentialNumber: string;

  /** Whether position 9 passes the ISO 3779 MOD-11 check. */
  readonly hasValidCheckDigit: boolean;

  private constructor(value: string, hasValidCheckDigit: boolean) {
    this.value = value;
    this.wmi = value.slice(0, 3);
    this.vds = value.slice(3, 8);
    this.checkDigit = value[8]!;
    this.vis = value.slice(9);
    this.modelYearCode = value[9]!;
    this.assemblyPlantCode = value[10]!;
    this.sequentialNumber = value.slice(11);
    this.hasValidCheckDigit = hasValidCheckDigit;
    this.modelYears = MODEL_YEAR_MAP[this.modelYearCode] ?? [];
  }

  static tryParse(input: string | null | undefined): VehicleIdentificationNumber | null {
    const cleaned = clean(input);
    if (cleaned === null || cleaned.length !== 17 || !VIN_PATTERN.test(cleaned)) return null;
    return new VehicleIdentificationNumber(cleaned, hasValidCheckDigit(cleaned));
  }

  static parse(input: string): VehicleIdentificationNumber {
    const result = VehicleIdentificationNumber.tryParse(input);
    if (result === null) throw new Error("Invalid Vehicle Identification Number (VIN).");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return VehicleIdentificationNumber.tryParse(input) !== null;
  }

  /** Returns the VIN in uppercase without separators, e.g. `WBA3A5C55CF256789`. */
  static format(
    input: string | null | undefined,
    options?: VehicleIdentificationNumberFormatOptions,
  ): string | null {
    const parsed = VehicleIdentificationNumber.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  /** Returns the VIN in uppercase without separators, e.g. `WBA3A5C55CF256789`. */
  static normalize(
    input: string | null | undefined,
    options?: VehicleIdentificationNumberFormatOptions,
  ): string | null {
    const parsed = VehicleIdentificationNumber.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && VehicleIdentificationNumber.normalize(input) === input;
  }

  /** Describes why the input is not a VIN, or reports it as valid. */
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

    if (cleaned.length !== 17) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "VIN must be exactly 17 characters.",
        "VIN måste vara exakt 17 tecken.",
      );
    }

    if (!VIN_PATTERN.test(cleaned)) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidCharacters,
        "VIN contains invalid characters (I, O, Q are not allowed).",
        "VIN innehåller ogiltiga tecken (I, O, Q är inte tillåtna).",
      );
    }

    return validResult(input);
  }

  /** Finds VIN candidates in unstructured text. */
  static findCandidatesInText(text: string): readonly TextCandidate<VehicleIdentificationNumber>[] {
    if (!text) return [];

    // .NET matches against the upper-cased copy but reports spans from the original.
    const upper = text.toUpperCase();
    const out: TextCandidate<VehicleIdentificationNumber>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(upper)) !== null) {
      const value = VehicleIdentificationNumber.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<VehicleIdentificationNumber>({
          startIndex: match.index,
          length: match[0].length,
          originalText: text.slice(match.index, match.index + match[0].length),
          typeName: "VehicleIdentificationNumber",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskVehicleIdentificationNumber(value),
          confidence: value.hasValidCheckDigit
            ? TextMatchConfidence.High
            : TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the 17-character VIN in uppercase, e.g. `WBA3A5C55CF256789`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the 17-character VIN in uppercase, e.g. `WBA3A5C55CF256789`. */
  toString(): string {
    return this.value;
  }

  equals(other: VehicleIdentificationNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: VehicleIdentificationNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/** Returns a VIN with only the manufacturer prefix visible, e.g. `WBA**************`. */
export function maskVehicleIdentificationNumber(vin: VehicleIdentificationNumber): string {
  return vin.wmi + "*".repeat(vin.value.length - vin.wmi.length);
}

function hasValidCheckDigit(vin: string): boolean {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i]!;
    const value = c >= "0" && c <= "9" ? c.charCodeAt(0) - 48 : TRANSLITERATION[c];
    if (value === undefined) return false;
    sum += value * WEIGHTS[i]!;
  }

  const remainder = sum % 11;
  return vin[8] === (remainder === 10 ? "X" : String(remainder));
}

function clean(input: string | null | undefined): string | null {
  if (input == null || input.trim().length === 0) return null;
  return sanitizeInput(input).trim().toUpperCase().replaceAll(" ", "").replaceAll("-", "");
}

function fallback(
  input: string | null | undefined,
  options?: VehicleIdentificationNumberFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
