import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { Country } from "../geography/index.js";

const MAX_INPUT_LENGTH = 20;

const SWEDISH_DIGITS = /^\d{5}$/;
const INTERNATIONAL =
  /^(?:[0-9]{3}|[0-9]{4}|[0-9]{3}\s?[0-9]{2}|[0-9]{6}|[0-9]{7}|[0-9]{4}\s?[A-Z]{2}|[A-Z]{3}\s?[0-9]{4}|980[0-9]{2}|(?:[A-Z][0-9]|[A-Z][0-9][A-Z]|[A-Z]{2}[0-9]|[A-Z]{2}[0-9][A-Z])\s?[0-9][A-Z]{2}|[A-Z0-9]{7}|[A-Z]{2}[0-9]{3}|LT-?[0-9]{5}|LV-?[0-9]{4}|MD-?[0-9]{4}|DK[-\s]?[0-9]{4})$/;

const SCAN = /(?<!\d)\d{3}\s?\d{2}(?!\d)/g;

/**
 * A postal code (`postnummer`). Swedish 5-digit codes (formatted `NNN NN`) and
 * many international formats (Danish `DK-9000`, Dutch `1012 AB`, British `W1A 1AB`)
 * are accepted.
 */
export class AddressZipCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Zip Code",
    localizedName: "Postnummer",
    emoji: "\u{1F4EE}",
    sources: Object.freeze([
      "https://www.postnord.se/",
      "https://sv.wikipedia.org/wiki/Postnummer_i_Sverige",
    ]),
  });

  readonly value: string;
  readonly formatted: string;
  readonly country: Country | null;

  private constructor(value: string, formatted: string, country: Country | null) {
    this.value = value;
    this.formatted = formatted;
    this.country = country;
  }

  get isSwedish(): boolean {
    return this.country?.alpha2Code === "SE";
  }

  static tryParse(
    input: string | null | undefined,
    options?: { country?: Country | null },
  ): AddressZipCode | null {
    if (input == null) return null;
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length === 0 || sanitized.length > MAX_INPUT_LENGTH) return null;

    const country = options?.country ?? null;
    const effectiveCountry = country?.alpha2Code ?? PrimitivesDefaults.countryAlpha2Code;

    if (country?.alpha2Code === "SE") return AddressZipCode.tryParseSwedish(sanitized);

    if (country) {
      const intl = AddressZipCode.tryParseInternational(sanitized, country);
      if (intl) return intl;
      return null;
    }

    if (effectiveCountry === "SE") {
      return (
        AddressZipCode.tryParseSwedish(sanitized) ?? AddressZipCode.tryParseInternational(sanitized)
      );
    }
    return (
      AddressZipCode.tryParseInternational(sanitized) ?? AddressZipCode.tryParseSwedish(sanitized)
    );
  }

  static parse(input: string, options?: { country?: Country | null }): AddressZipCode {
    const r = AddressZipCode.tryParse(input, options);
    if (r === null) throw new Error("Invalid zip code.");
    return r;
  }

  static isValid(
    input: string | null | undefined,
    options?: { country?: Country | null },
  ): boolean {
    return AddressZipCode.tryParse(input, options) !== null;
  }

  /** Parse as a Swedish 5-digit postal code only. */
  static tryParseSwedish(input: string | null | undefined): AddressZipCode | null {
    if (input == null) return null;
    let cleaned = input.toString();
    for (let i = 0; i < cleaned.length; i++) {
      if (/\p{L}/u.test(cleaned[i]!)) {
        cleaned = cleaned.slice(0, i).trimEnd();
        break;
      }
    }
    if (cleaned.length === 0) return null;
    const digits = keepDigits(cleaned);
    if (!SWEDISH_DIGITS.test(digits)) return null;
    const formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return new AddressZipCode(digits, formatted, Country.Sweden);
  }

  /** Parse as a non-Swedish international postal code. */
  static tryParseInternational(
    input: string | null | undefined,
    country: Country | null = null,
  ): AddressZipCode | null {
    if (input == null) return null;
    const trimmed = input.toString();
    if (trimmed.length === 0) return null;
    if (/[\p{Cc}]/u.test(trimmed)) return null;
    if (![...trimmed].every((c) => /[\p{L}\p{N}]/u.test(c) || /\s/.test(c) || c === "-")) {
      return null;
    }
    const normalized = normalizeInternational(trimmed);
    if (!normalized) return null;
    if (!INTERNATIONAL.test(normalized)) return null;
    const resolved = country ?? inferCountryFromPrefix(normalized);
    return new AddressZipCode(normalized, normalized, resolved);
  }

  static format(
    input: string | null | undefined,
    options?: { country?: Country | null; fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = AddressZipCode.tryParse(input, options);
    if (r) return r.formatted;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { country?: Country | null; fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = AddressZipCode.tryParse(input, options);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const trimmed = input.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && AddressZipCode.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<AddressZipCode>[] {
    if (!text) return [];
    const out: TextCandidate<AddressZipCode>[] = [];
    SCAN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN.exec(text)) !== null) {
      const zip = AddressZipCode.tryParseSwedish(m[0]);
      if (!zip) continue;
      out.push(
        new TextCandidate<AddressZipCode>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "AddressZipCode",
          category: TextCandidateCategory.Contact,
          normalizedForm: zip.toNormalizedString(),
          formattedForm: zip.toString(),
          maskedForm: maskZip(zip),
          confidence: TextMatchConfidence.Low,
          value: zip,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.formatted;
  }

  equals(other: AddressZipCode | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: AddressZipCode | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function normalizeInternational(input: string): string {
  let cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  const digits = keepDigits(cleaned);
  if (cleaned.startsWith("DK") && digits.length === 4) return `DK-${digits}`;
  if (cleaned.startsWith("LV") && digits.length === 4) return `LV-${digits}`;
  if (cleaned.startsWith("MD") && digits.length === 4) return `MD-${digits}`;
  if (cleaned.startsWith("AD") && digits.length === 3) return `AD${digits}`;
  cleaned = cleaned.replace(/[^A-Z0-9-]/g, "");
  if (/^\d+-\d+$/.test(cleaned)) return cleaned.replace(/-/g, "");
  return cleaned;
}

function inferCountryFromPrefix(normalized: string): Country | null {
  if (normalized.startsWith("DK-")) return Country.Denmark;
  if (normalized.startsWith("LV-")) return Country.Latvia;
  if (normalized.startsWith("MD-")) return Country.tryParse("MD");
  if (normalized.startsWith("AD") && normalized.length === 5 && /^\d+$/.test(normalized.slice(2))) {
    return Country.tryParse("AD");
  }
  return null;
}

/** Internal masking for zip codes used in scan results. */
export function maskZip(zip: AddressZipCode): string {
  const f = zip.formatted;
  return f.replace(/\d/g, "*");
}
