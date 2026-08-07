import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { luhnIsValid } from "../internal/luhn.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationErrorReason, ValidationResult } from "../validation/index.js";
import { invalidResult, validResult } from "../validation/validation-result.js";
import { cleanSeparators } from "./organization-validation-utils.js";
import { SwedishOrganizationNumber } from "./swedish-organization-number.js";

const MAX_INPUT_LENGTH = 30;

interface CountryInfo {
  countryCode: string;
  countryName: string;
}

const COUNTRY_INFO: Readonly<Record<string, CountryInfo>> = Object.freeze({
  AT: { countryCode: "AT", countryName: "Austria" },
  BE: { countryCode: "BE", countryName: "Belgium" },
  BG: { countryCode: "BG", countryName: "Bulgaria" },
  HR: { countryCode: "HR", countryName: "Croatia" },
  CY: { countryCode: "CY", countryName: "Cyprus" },
  CZ: { countryCode: "CZ", countryName: "Czech Republic" },
  DK: { countryCode: "DK", countryName: "Denmark" },
  EE: { countryCode: "EE", countryName: "Estonia" },
  FI: { countryCode: "FI", countryName: "Finland" },
  FR: { countryCode: "FR", countryName: "France" },
  DE: { countryCode: "DE", countryName: "Germany" },
  EL: { countryCode: "GR", countryName: "Greece" },
  GR: { countryCode: "GR", countryName: "Greece" },
  HU: { countryCode: "HU", countryName: "Hungary" },
  IE: { countryCode: "IE", countryName: "Ireland" },
  IT: { countryCode: "IT", countryName: "Italy" },
  LV: { countryCode: "LV", countryName: "Latvia" },
  LT: { countryCode: "LT", countryName: "Lithuania" },
  LU: { countryCode: "LU", countryName: "Luxembourg" },
  MT: { countryCode: "MT", countryName: "Malta" },
  NL: { countryCode: "NL", countryName: "Netherlands" },
  PL: { countryCode: "PL", countryName: "Poland" },
  PT: { countryCode: "PT", countryName: "Portugal" },
  RO: { countryCode: "RO", countryName: "Romania" },
  SK: { countryCode: "SK", countryName: "Slovakia" },
  SI: { countryCode: "SI", countryName: "Slovenia" },
  ES: { countryCode: "ES", countryName: "Spain" },
  SE: { countryCode: "SE", countryName: "Sweden" },
  GB: { countryCode: "GB", countryName: "United Kingdom" },
  NO: { countryCode: "NO", countryName: "Norway" },
  IS: { countryCode: "IS", countryName: "Iceland" },
  LI: { countryCode: "LI", countryName: "Liechtenstein" },
  CH: { countryCode: "CH", countryName: "Switzerland" },
  AL: { countryCode: "AL", countryName: "Albania" },
  BA: { countryCode: "BA", countryName: "Bosnia and Herzegovina" },
  BY: { countryCode: "BY", countryName: "Belarus" },
  MK: { countryCode: "MK", countryName: "North Macedonia" },
  RS: { countryCode: "RS", countryName: "Serbia" },
  SM: { countryCode: "SM", countryName: "San Marino" },
  TR: { countryCode: "TR", countryName: "Turkey" },
  UA: { countryCode: "UA", countryName: "Ukraine" },
  RU: { countryCode: "RU", countryName: "Russia" },
  UZ: { countryCode: "UZ", countryName: "Uzbekistan" },
  AU: { countryCode: "AU", countryName: "Australia" },
  CN: { countryCode: "CN", countryName: "China" },
  HK: { countryCode: "HK", countryName: "Hong Kong" },
  IN: { countryCode: "IN", countryName: "India" },
  ID: { countryCode: "ID", countryName: "Indonesia" },
  IL: { countryCode: "IL", countryName: "Israel" },
  JP: { countryCode: "JP", countryName: "Japan" },
  KZ: { countryCode: "KZ", countryName: "Kazakhstan" },
  NZ: { countryCode: "NZ", countryName: "New Zealand" },
  PH: { countryCode: "PH", countryName: "Philippines" },
  SA: { countryCode: "SA", countryName: "Saudi Arabia" },
  SG: { countryCode: "SG", countryName: "Singapore" },
  TW: { countryCode: "TW", countryName: "Taiwan" },
  AR: { countryCode: "AR", countryName: "Argentina" },
  BZ: { countryCode: "BZ", countryName: "Belize" },
  BO: { countryCode: "BO", countryName: "Bolivia" },
  BR: { countryCode: "BR", countryName: "Brazil" },
  CA: { countryCode: "CA", countryName: "Canada" },
  CL: { countryCode: "CL", countryName: "Chile" },
  CO: { countryCode: "CO", countryName: "Colombia" },
  CR: { countryCode: "CR", countryName: "Costa Rica" },
  DO: { countryCode: "DO", countryName: "Dominican Republic" },
  EC: { countryCode: "EC", countryName: "Ecuador" },
  SV: { countryCode: "SV", countryName: "El Salvador" },
  GT: { countryCode: "GT", countryName: "Guatemala" },
  HN: { countryCode: "HN", countryName: "Honduras" },
  MX: { countryCode: "MX", countryName: "Mexico" },
  NI: { countryCode: "NI", countryName: "Nicaragua" },
  PA: { countryCode: "PA", countryName: "Panama" },
  PY: { countryCode: "PY", countryName: "Paraguay" },
  PE: { countryCode: "PE", countryName: "Peru" },
  UY: { countryCode: "UY", countryName: "Uruguay" },
  US: { countryCode: "US", countryName: "United States" },
  VE: { countryCode: "VE", countryName: "Venezuela" },
  NG: { countryCode: "NG", countryName: "Nigeria" },
});

/** VAT identification number (`momsnummer` / `momsregistreringsnummer`). */
export class EuVatNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "VAT Number",
    localizedName: "Momsnummer",
    emoji: "\u{1F4B0}",
    sources: Object.freeze([
      "https://ec.europa.eu/taxation_customs/vies/#/vat-validation",
      "https://en.wikipedia.org/wiki/VAT_identification_number",
    ]),
  });

  readonly vatPrefix: string;
  readonly countryCode: string;
  readonly countryName: string;
  readonly body: string;

  private constructor(vatPrefix: string, countryCode: string, countryName: string, body: string) {
    this.vatPrefix = vatPrefix;
    this.countryCode = countryCode;
    this.countryName = countryName;
    this.body = body;
  }

  static tryParse(input: string | null | undefined): EuVatNumber | null {
    if (input == null || input.trim() === "") return null;
    const cleaned = cleanSeparators(sanitizeInput(input));
    if (cleaned.length > MAX_INPUT_LENGTH || cleaned.length < 3) return null;

    const cc = cleaned.slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return null;
    const info = COUNTRY_INFO[cc];
    if (!info) return null;

    const body = cleaned
      .slice(2)
      .split("")
      .map((c) => {
        if (!/[A-Za-z0-9]/.test(c)) return null;
        return c.toUpperCase();
      });
    if (body.some((c) => c === null)) return null;
    const bodyString = body.join("");
    if (bodyString.length === 0) return null;
    if (!validateCountryFormat(info.countryCode, bodyString)) return null;

    return new EuVatNumber(cc, info.countryCode, info.countryName, bodyString);
  }

  static parse(input: string): EuVatNumber {
    const r = EuVatNumber.tryParse(input);
    if (r === null) throw new Error("Invalid VAT number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return EuVatNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = EuVatNumber.tryParse(input);
    if (r) return r.vatPrefix + r.body;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return EuVatNumber.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EuVatNumber.normalize(input) === input;
  }

  static tryParseForCountry(
    input: string | null | undefined,
    countryCode: string | null | undefined,
  ): EuVatNumber | null {
    if (countryCode == null || countryCode.trim() === "") return null;
    const vat = EuVatNumber.tryParse(input);
    if (!vat) return null;
    const normalized = countryCode.toUpperCase();
    if ((normalized === "EL" || normalized === "GR") && vat.countryCode === "GR") return vat;
    return vat.countryCode === normalized ? vat : null;
  }

  static parseForCountry(input: string, countryCode: string): EuVatNumber {
    const r = EuVatNumber.tryParseForCountry(input, countryCode);
    if (!r) throw new Error(`Invalid VAT number for country ${countryCode}.`);
    return r;
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

    const cleaned = cleanSeparators(sanitizeInput(input));
    if (cleaned.length > MAX_INPUT_LENGTH) {
      return invalidResult(
        input,
        ValidationErrorReason.InputTooLong,
        "Input contains too many characters.",
        "Värdet innehåller för många tecken.",
      );
    }
    if (cleaned.length < 3) {
      return invalidResult(
        input,
        ValidationErrorReason.InputTooShort,
        "VAT number is too short.",
        "Momsnumret är för kort.",
      );
    }
    const cc = cleaned.slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidCountryPrefix,
        "VAT number must start with a two-letter country code.",
        "Momsnumret måste börja med en tvåbokstavig landskod.",
      );
    }
    const info = COUNTRY_INFO[cc];
    if (!info) {
      return invalidResult(
        input,
        ValidationErrorReason.UnknownCountryCode,
        "Unknown VAT country code.",
        "Okänd momsnummer-landskod.",
      );
    }
    let body = "";
    for (const c of cleaned.slice(2)) {
      if (!/[A-Za-z0-9]/.test(c)) {
        return invalidResult(
          input,
          ValidationErrorReason.InvalidFormat,
          "VAT number body contains invalid characters.",
          "Momsnumrets innehåll har ogiltiga tecken.",
        );
      }
      body += c.toUpperCase();
    }
    if (body.length === 0 || !validateCountryFormat(info.countryCode, body)) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "VAT number format is invalid for the specified country.",
        "Momsnummerformatet är ogiltigt för det angivna landet.",
      );
    }
    return validResult(input);
  }

  toNormalizedString(): string {
    return this.vatPrefix + this.body;
  }

  toString(): string {
    return this.vatPrefix + this.body;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<EuVatNumber>[] {
    if (!text) return [];
    const results: TextCandidate<EuVatNumber>[] = [];
    const re = /(?<![A-Z0-9])[A-Z]{2}[A-Z0-9]{5,14}(?![A-Z0-9])/gu;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const vat = EuVatNumber.tryParse(match[0]);
      if (!vat) continue;
      results.push(
        new TextCandidate<EuVatNumber>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "EuVatNumber",
          category: TextCandidateCategory.OrganizationIdentifier,
          normalizedForm: vat.toNormalizedString(),
          formattedForm: vat.toString(),
          maskedForm: maskEuVatNumber(vat),
          confidence: TextMatchConfidence.High,
          value: vat,
        }),
      );
    }
    return results;
  }

  equals(other: EuVatNumber | null | undefined): boolean {
    return other != null && this.vatPrefix === other.vatPrefix && this.body === other.body;
  }

  compareTo(other: EuVatNumber | null | undefined): number {
    if (other == null) return 1;
    const a = this.toNormalizedString();
    const b = other.toNormalizedString();
    return a < b ? -1 : a > b ? 1 : 0;
  }
}

function validateCountryFormat(countryCode: string, body: string): boolean {
  switch (countryCode.toUpperCase()) {
    case "AT":
      return body.length === 9 && body[0] === "U" && /^\d{8}$/.test(body.slice(1));
    case "BE":
      return validateBelgianVat(body);
    case "BG":
      return /^\d{9,10}$/.test(body);
    case "HR":
      return /^\d{11}$/.test(body) && validateMod1110(body);
    case "CY":
      return /^\d{8}[A-Z]$/.test(body);
    case "CZ":
      return /^\d{8,10}$/.test(body);
    case "DK":
      return /^\d{8}$/.test(body);
    case "EE":
      return /^\d{9}$/.test(body);
    case "FI":
      return validateFinnishVat(body);
    case "FR":
      return /^[A-Z0-9]{2}\d{9}$/.test(body);
    case "DE":
    case "GR":
      return /^\d{9}$/.test(body);
    case "HU":
      return /^\d{8}$/.test(body);
    case "IE":
      return validateIrishVat(body);
    case "IT":
      return /^\d{11}$/.test(body) && luhnIsValid(body);
    case "LV":
      return /^\d{11}$/.test(body);
    case "LT":
      return /^\d{9}$/.test(body) || /^\d{12}$/.test(body);
    case "LU":
    case "MT":
      return /^\d{8}$/.test(body);
    case "NL":
      return /^\d{9}B\d{2}$/.test(body);
    case "PL":
      return validatePolishVat(body);
    case "PT":
      return /^\d{9}$/.test(body);
    case "RO":
      return /^\d{2,10}$/.test(body);
    case "SK":
      return validateSlovakVat(body);
    case "SI":
      return /^\d{8}$/.test(body);
    case "ES":
      return body.length === 9;
    case "SE":
      return validateSwedishVat(body);
    case "GB":
      return validateUkVat(body);
    case "NO":
      return validateNorwegianVat(body);
    case "CH":
      return keepDigits(body).length === 9;
    default:
      return /\d/.test(body);
  }
}

function validateSwedishVat(body: string): boolean {
  const digits = keepDigits(body);
  if (digits.length !== 12 || !digits.endsWith("01")) return false;
  return SwedishOrganizationNumber.tryParse(digits.slice(0, 10)) !== null;
}

function validateBelgianVat(body: string): boolean {
  const digits = keepDigits(body);
  if (digits.length !== 10) return false;
  const baseNumber = parseInt(digits.slice(0, 8), 10);
  const checkDigits = 97 - (baseNumber % 97);
  return checkDigits === parseInt(digits.slice(8, 10), 10);
}

function validateFinnishVat(body: string): boolean {
  const digits = keepDigits(body);
  if (digits.length !== 8) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2];
  const sum = weights.reduce((acc, weight, i) => acc + (digits.charCodeAt(i) - 0x30) * weight, 0);
  const remainder = sum % 11;
  if (remainder === 1) return false;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;
  return checkDigit === digits.charCodeAt(7) - 0x30;
}

function validateIrishVat(body: string): boolean {
  if (body.length < 8 || body.length > 9) return false;
  if (body.length === 8) return /^\d{7}[A-Z]$/.test(body);
  return /^\d{7}[A-Z]{2}$/.test(body) || /^\d[A-Z]\d{5}[A-Z]$/.test(body);
}

function validatePolishVat(body: string): boolean {
  const digits = keepDigits(body);
  if (digits.length !== 10) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, weight, i) => acc + (digits.charCodeAt(i) - 0x30) * weight, 0);
  const checkDigit = sum % 11;
  if (checkDigit === 10) return false;
  return checkDigit === digits.charCodeAt(9) - 0x30;
}

function validateSlovakVat(body: string): boolean {
  const digits = keepDigits(body);
  if (digits.length !== 10) return false;
  return parseInt(digits, 10) % 11 === 0;
}

function validateUkVat(body: string): boolean {
  const digits = keepDigits(body);
  if (body.startsWith("GD") || body.startsWith("HA")) return body.length >= 5;
  return digits.length === 9 || digits.length === 12;
}

function validateNorwegianVat(body: string): boolean {
  const digits = keepDigits(body);
  if (digits.length !== 9) return false;
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, weight, i) => acc + (digits.charCodeAt(i) - 0x30) * weight, 0);
  const remainder = 11 - (sum % 11);
  if (remainder === 10) return false;
  const checkDigit = remainder === 11 ? 0 : remainder;
  return checkDigit === digits.charCodeAt(8) - 0x30;
}

function validateMod1110(digits: string): boolean {
  let checksum = 10;
  for (let i = 0; i < digits.length - 1; i++) {
    const digit = digits.charCodeAt(i) - 0x30;
    checksum = (checksum + digit) % 10;
    if (checksum === 0) checksum = 10;
    checksum = (checksum * 2) % 11;
  }
  const expectedCheck = (11 - checksum) % 10;
  const actualCheck = digits.charCodeAt(digits.length - 1) - 0x30;
  return expectedCheck === actualCheck;
}

/** Masks person-based Swedish VAT automatically; pass `alwaysMask` to mask all VAT bodies. */
export function maskEuVatNumber(vat: EuVatNumber, alwaysMask = false): string {
  if (vat.countryCode === "SE") {
    const body = vat.body;
    if (body.length >= 10) {
      const orgPart = body.slice(0, 10);
      const org = SwedishOrganizationNumber.tryParse(orgPart);
      if (org && (org.isPerson || alwaysMask)) {
        const suffix = body.length > 10 ? body.slice(10) : "";
        return `${vat.vatPrefix}${orgPart.slice(0, 6)}****${suffix}`;
      }
    }
  } else if (alwaysMask) {
    const visible = Math.min(4, vat.body.length);
    return `${vat.vatPrefix}${vat.body.slice(0, visible)}${"*".repeat(vat.body.length - visible)}`;
  }

  return vat.toString();
}
