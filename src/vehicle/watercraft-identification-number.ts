import { Country } from "../geography/country.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";
import { ValidationIssue } from "../validation/validation-issue.js";
import {
  invalidResult,
  validResult,
  type ValidationResult,
} from "../validation/validation-result.js";

/** Options for {@link WatercraftIdentificationNumber.format} and `normalize`. */
export interface WatercraftIdentificationNumberFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/** The scheme a {@link WatercraftIdentificationNumber} was written in. */
export const WatercraftIdentificationNumberScheme = {
  Unknown: 0,
  /**
   * ISO 10087 craft or watercraft identification number (CIN/WIN): a two-letter
   * country code, a hyphen and twelve characters, e.g. `NL-HXAB7A33G506`.
   */
  Iso10087: 1,
  /**
   * United States hull identification number (HIN) in the twelve-character format
   * required since 1 August 1984 by 33 CFR 181.25, e.g. `ZZZ00001A020`.
   */
  UnitedStatesHullIdentificationNumber: 2,
} as const;

export type WatercraftIdentificationNumberScheme =
  (typeof WatercraftIdentificationNumberScheme)[keyof typeof WatercraftIdentificationNumberScheme];

const MAX_INPUT_LENGTH = 30;
const ISO_LENGTH = 14;
const UNITED_STATES_LENGTH = 12;

const ALLOWED_CHARACTERS_PATTERN = /^[A-Z0-9-]+$/u;
// sanitizeInput has already turned every whitespace character into an ASCII space and dropped
// U+0085, U+FEFF, \v and \f, so a space is all that is left to strip. `\s` would differ from the
// .NET port, where it also matches U+0085 but not U+FEFF.
const WHITESPACE_PATTERN = / +/g;
const LOWERCASE_ASCII_PATTERN = /[a-z]/g;
const DOTNET_WHITESPACE_ONLY_PATTERN = /^[\p{Z}\t\n\v\f\r\u0085]*$/u;
const DOTNET_TRIM_PATTERN = /^[\p{Z}\t\n\v\f\r\u0085]+|[\p{Z}\t\n\v\f\r\u0085]+$/gu;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/u;

// ISO 10087 §4.3: letters and numerals, except the numerals 0 and 1.
const ISO_MANUFACTURER_CODE_PATTERN = /^[A-Z2-9]{3}$/u;

// 33 CFR 181.25(a) leaves the characters of a Coast Guard assigned code unrestricted.
const UNITED_STATES_MANUFACTURER_CODE_PATTERN = /^[A-Z0-9]{3}$/u;

// ISO 10087 §4.4 and 33 CFR 181.25(b): letters and numerals, except the letters I, O and Q.
const SERIAL_NUMBER_PATTERN = /^[A-HJ-NPR-Z0-9]{5}$/u;

const YEAR_DIGITS_PATTERN = /^[0-9]{3}$/u;

const SCAN_PATTERN = /(?<![A-Z0-9-])(?:[A-Z]{2}-?[A-Z0-9]{12}|[A-Z0-9]{12})(?![A-Z0-9-])/gu;

/**
 * A watercraft identification number (`skrovnummer`), the hull marking of a small
 * craft: either the ISO 10087 craft identification number (CIN, now called WIN by
 * Transportstyrelsen) of fourteen characters plus a hyphen, or the twelve-character
 * US hull identification number (HIN).
 *
 * The number is assigned by the manufacturer and carries no check digit, so a parsed
 * value is structurally valid only — it does not prove that the manufacturer code is
 * registered or that the number belongs to a particular craft. The production year
 * and model year are encoded as one and two digits respectively, so the century
 * cannot be derived from the number alone; they are exposed as digits rather than
 * full years. Older markings that predate these formats (for example US HINs from
 * before August 1984) are not accepted.
 *
 * Sources:
 * - https://www.iso.org/standard/82383.html
 * - https://www.ecfr.gov/current/title-33/chapter-I/subchapter-S/part-181/subpart-C/section-181.25
 * - https://www.transportstyrelsen.se/sv/sjofart/fritidsbatar/lagar-och-regler-for-fritidsbatar/cemarkning/bygga-om-tillverka-distribuera-och-importera/tillverka/instruktionsbok-tillverkarskylt-och-win/
 */
export class WatercraftIdentificationNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Watercraft Identification Number",
    localizedName: "Skrovnummer",
    emoji: "🚤",
    sources: Object.freeze([
      "https://www.iso.org/standard/82383.html",
      "https://www.ecfr.gov/current/title-33/chapter-I/subchapter-S/part-181/subpart-C/section-181.25",
      "https://www.transportstyrelsen.se/sv/sjofart/fritidsbatar/lagar-och-regler-for-fritidsbatar/cemarkning/bygga-om-tillverka-distribuera-och-importera/tillverka/instruktionsbok-tillverkarskylt-och-win/",
    ]),
  });

  /**
   * The number in uppercase without separators: fourteen characters for ISO 10087,
   * e.g. `NLHXAB7A33G506`, or twelve for a US HIN, e.g. `ZZZ00001A020`.
   */
  readonly value: string;

  /**
   * The number as it is marked on the hull: ISO 10087 with the hyphen after the
   * country code, e.g. `NL-HXAB7A33G506`, and a US HIN unchanged, e.g. `ZZZ00001A020`.
   */
  readonly formatted: string;

  /** Which of the two supported formats the number follows. */
  readonly scheme: WatercraftIdentificationNumberScheme;

  /**
   * The ISO 3166-1 alpha-2 code of the country where the manufacturer is established,
   * e.g. `NL`, or `null` for a US HIN, which carries no country.
   */
  readonly countryCode: string | null;

  /** The country of {@link countryCode}, or `null` for a US HIN. */
  readonly country: Country | null;

  /** The three-character manufacturer identification code (MIC), e.g. `HXA`. */
  readonly manufacturerCode: string;

  /** The five-character serial number assigned by the manufacturer, e.g. `B7A33`. */
  readonly serialNumber: string;

  /**
   * The production month letter, `A` for January through `L` for December. For a US
   * HIN this is the month of certification when one is required, otherwise the month
   * of manufacture.
   */
  readonly productionMonthCode: string;

  /** The production month decoded from {@link productionMonthCode}, 1–12. */
  readonly productionMonth: number;

  /** The last digit of the production year, 0–9. The decade is not encoded. */
  readonly productionYearDigit: number;

  /** The last two digits of the model year as written, e.g. `06`. The century is not encoded. */
  readonly modelYearDigits: string;

  private constructor(
    value: string,
    scheme: WatercraftIdentificationNumberScheme,
    country: Country | null,
  ) {
    this.value = value;
    this.scheme = scheme;
    this.country = country;

    const isIso = scheme === WatercraftIdentificationNumberScheme.Iso10087;
    const body = isIso ? value.slice(2) : value;
    this.countryCode = isIso ? value.slice(0, 2) : null;
    this.formatted = this.countryCode === null ? value : `${this.countryCode}-${body}`;
    this.manufacturerCode = body.slice(0, 3);
    this.serialNumber = body.slice(3, 8);
    this.productionMonthCode = body[8]!;
    this.productionMonth = body.charCodeAt(8) - 64;
    this.productionYearDigit = body.charCodeAt(9) - 48;
    this.modelYearDigits = body.slice(10, 12);
  }

  static tryParse(input: string | null | undefined): WatercraftIdentificationNumber | null {
    return WatercraftIdentificationNumber.tryParseCore(input, null);
  }

  static parse(input: string): WatercraftIdentificationNumber {
    const result = WatercraftIdentificationNumber.tryParse(input);
    if (result === null) throw new Error("Invalid watercraft identification number.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return WatercraftIdentificationNumber.tryParse(input) !== null;
  }

  /**
   * Returns the number as it is marked on the hull, e.g. `NL-HXAB7A33G506` or
   * `ZZZ00001A020`.
   */
  static format(
    input: string | null | undefined,
    options?: WatercraftIdentificationNumberFormatOptions,
  ): string | null {
    const parsed = WatercraftIdentificationNumber.tryParse(input);
    if (parsed !== null) return parsed.formatted;
    return fallback(input, options);
  }

  /**
   * Returns the number in uppercase without separators, e.g. `NLHXAB7A33G506` or
   * `ZZZ00001A020`.
   */
  static normalize(
    input: string | null | undefined,
    options?: WatercraftIdentificationNumberFormatOptions,
  ): string | null {
    const parsed = WatercraftIdentificationNumber.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && WatercraftIdentificationNumber.normalize(input) === input;
  }

  /**
   * Describes every invalid segment of the input, one issue per segment, or reports
   * it as valid.
   */
  static validate(input: string | null | undefined): ValidationResult {
    const issues: ValidationIssue[] = [];
    return WatercraftIdentificationNumber.tryParseCore(input, issues) !== null
      ? validResult(input)
      : invalidResult(input, issues);
  }

  /**
   * Finds watercraft identification number candidates in unstructured text. An ISO
   * 10087 number written with its hyphen is reported with medium confidence; one
   * without the hyphen, and a US HIN, are bare runs of letters and digits and
   * reported with low confidence. Results are heuristic and may include false
   * positives.
   */
  static findCandidatesInText(
    text: string,
  ): readonly TextCandidate<WatercraftIdentificationNumber>[] {
    if (!text) return [];

    const upper = toAsciiUpper(text);
    const out: TextCandidate<WatercraftIdentificationNumber>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(upper)) !== null) {
      const value = WatercraftIdentificationNumber.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<WatercraftIdentificationNumber>({
          startIndex: match.index,
          length: match[0].length,
          originalText: text.slice(match.index, match.index + match[0].length),
          typeName: "WatercraftIdentificationNumber",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskWatercraftIdentificationNumber(value),
          confidence: match[0].includes("-") ? TextMatchConfidence.Medium : TextMatchConfidence.Low,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the number without separators, e.g. `NLHXAB7A33G506`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the number as it is marked on the hull, e.g. `NL-HXAB7A33G506`. */
  toString(): string {
    return this.formatted;
  }

  equals(other: WatercraftIdentificationNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: WatercraftIdentificationNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }

  private static tryParseCore(
    input: string | null | undefined,
    issues: ValidationIssue[] | null,
  ): WatercraftIdentificationNumber | null {
    const fail = (reason: ValidationErrorReason, english: string, swedish: string): false => {
      issues?.push(new ValidationIssue(reason, english, swedish));
      return false;
    };

    if (isNullOrWhiteSpace(input)) {
      fail(ValidationErrorReason.InputIsEmpty, "Input is empty or whitespace.", "Värdet är tomt.");
      return null;
    }

    const cleaned = toAsciiUpper(sanitizeInput(input).replace(WHITESPACE_PATTERN, ""));

    if (cleaned.length > MAX_INPUT_LENGTH) {
      fail(
        ValidationErrorReason.InputTooLong,
        "Input contains too many characters.",
        "Värdet innehåller för många tecken.",
      );
      return null;
    }

    if (!ALLOWED_CHARACTERS_PATTERN.test(cleaned)) {
      fail(
        ValidationErrorReason.InvalidCharacters,
        "Only letters A–Z, digits and the hyphen after the country code are allowed.",
        "Endast bokstäverna A–Z, siffror och bindestrecket efter landskoden är tillåtna.",
      );
      return null;
    }

    const hyphenIndex = cleaned.indexOf("-");
    const hasCountrySeparator = hyphenIndex >= 0;
    if (hasCountrySeparator && (hyphenIndex !== 2 || cleaned.indexOf("-", hyphenIndex + 1) >= 0)) {
      fail(
        ValidationErrorReason.InvalidFormat,
        "A hyphen is only allowed directly after the two-letter country code.",
        "Bindestreck får bara stå direkt efter den tvåbokstaviga landskoden.",
      );
      return null;
    }

    const compact = hasCountrySeparator
      ? cleaned.slice(0, hyphenIndex) + cleaned.slice(hyphenIndex + 1)
      : cleaned;
    const scheme =
      compact.length === ISO_LENGTH
        ? WatercraftIdentificationNumberScheme.Iso10087
        : compact.length === UNITED_STATES_LENGTH && !hasCountrySeparator
          ? WatercraftIdentificationNumberScheme.UnitedStatesHullIdentificationNumber
          : WatercraftIdentificationNumberScheme.Unknown;

    if (scheme === WatercraftIdentificationNumberScheme.Unknown) {
      fail(
        ValidationErrorReason.InvalidLength,
        "Must be 14 characters after an ISO 10087 country code and hyphen, or 12 characters for a US HIN.",
        "Måste vara 14 tecken enligt ISO 10087 (landskod, bindestreck och 12 tecken) eller 12 tecken för ett amerikanskt HIN.",
      );
      return null;
    }

    const isIso = scheme === WatercraftIdentificationNumberScheme.Iso10087;
    const body = isIso ? compact.slice(2) : compact;
    let isValid = true;
    let country: Country | null = null;

    if (isIso) {
      country = resolveCountry(compact.slice(0, 2));
      if (country === null) {
        isValid = fail(
          ValidationErrorReason.UnknownCountryCode,
          "The first two characters must be an ISO 3166-1 alpha-2 country code.",
          "De två första tecknen måste vara en landskod enligt ISO 3166-1 alpha-2.",
        );
      }
    }

    if (isIso && !ISO_MANUFACTURER_CODE_PATTERN.test(body.slice(0, 3))) {
      isValid = fail(
        ValidationErrorReason.InvalidManufacturerCode,
        "The manufacturer code must be three letters or digits, except the digits 0 and 1.",
        "Tillverkarkoden måste vara tre bokstäver eller siffror, men inte siffrorna 0 och 1.",
      );
    }

    if (!isIso && !UNITED_STATES_MANUFACTURER_CODE_PATTERN.test(body.slice(0, 3))) {
      isValid = fail(
        ValidationErrorReason.InvalidManufacturerCode,
        "The manufacturer code must be three letters or digits.",
        "Tillverkarkoden måste vara tre bokstäver eller siffror.",
      );
    }

    if (!SERIAL_NUMBER_PATTERN.test(body.slice(3, 8))) {
      isValid = fail(
        ValidationErrorReason.InvalidSerialNumber,
        "The serial number must be five letters or digits, except the letters I, O and Q.",
        "Serienumret måste vara fem bokstäver eller siffror, men inte bokstäverna I, O och Q.",
      );
    }

    const monthCode = body[8]!;
    if (monthCode < "A" || monthCode > "L") {
      isValid = fail(
        ValidationErrorReason.InvalidMonthCode,
        "The production month must be a letter from A (January) to L (December).",
        "Tillverkningsmånaden måste vara en bokstav från A (januari) till L (december).",
      );
    }

    if (!YEAR_DIGITS_PATTERN.test(body.slice(9, 12))) {
      isValid = fail(
        ValidationErrorReason.InvalidYearDigits,
        "The production year and model year must be digits.",
        "Tillverkningsår och årsmodell måste anges med siffror.",
      );
    }

    if (!isValid) return null;

    return new WatercraftIdentificationNumber(compact, scheme, country);
  }
}

/**
 * Returns a watercraft identification number with only the country and manufacturer
 * codes visible, e.g. `NL-HXAB7A33G506` becomes `NL-HXA*********` and
 * `ZZZ00001A020` becomes `ZZZ*********`.
 */
export function maskWatercraftIdentificationNumber(win: WatercraftIdentificationNumber): string {
  const prefix =
    win.countryCode === null ? win.manufacturerCode : `${win.countryCode}-${win.manufacturerCode}`;
  return prefix + "*".repeat(win.formatted.length - prefix.length);
}

function resolveCountry(code: string): Country | null {
  if (!COUNTRY_CODE_PATTERN.test(code)) return null;
  const parsed = Country.tryParse(code);
  return parsed !== null && parsed.alpha2Code === code ? parsed : null;
}

/**
 * Upper-cases a–z only and leaves every other code unit as it is, so the length and
 * match offsets are unchanged. `toUpperCase` maps some non-ASCII letters onto ASCII
 * (`ı` → `I`, `ſ` → `S`), which would let a look-alike pass as A–Z; the .NET port uses
 * the same ASCII-only rule.
 */
function toAsciiUpper(text: string): string {
  return text.replace(LOWERCASE_ASCII_PATTERN, (c) => String.fromCharCode(c.charCodeAt(0) - 32));
}

function fallback(
  input: string | null | undefined,
  options?: WatercraftIdentificationNumberFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || isNullOrWhiteSpace(input)) return null;
  return trimLikeDotnet(input);
}

/**
 * .NET `string.IsNullOrWhiteSpace` and `string.Trim()` use `char.IsWhiteSpace`, which counts
 * U+0085 and not U+FEFF — the reverse of `String.prototype.trim`. These mirror the .NET port so
 * the empty check and the fallback text agree for every input.
 */
function isNullOrWhiteSpace(input: string | null | undefined): input is null | undefined {
  return input == null || DOTNET_WHITESPACE_ONLY_PATTERN.test(input);
}

function trimLikeDotnet(input: string): string {
  return input.replace(DOTNET_TRIM_PATTERN, "");
}
