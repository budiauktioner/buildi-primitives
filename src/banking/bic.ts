import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { Country } from "../geography/country.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationResult, validResult, invalidResult } from "../validation/validation-result.js";
import { ValidationErrorReason } from "../validation/validation-error-reason.js";

const MAX_INPUT_LENGTH = 20;

const PATTERN =
  /^(?<institution>[A-Z]{4})(?<country>[A-Z]{2})(?<location>[A-Z0-9]{2})(?<branch>[A-Z0-9]{3})?$/;

/**
 * A BIC (Business Identifier Code / SWIFT code) per ISO 9362.
 * 8 or 11 uppercase characters, e.g. `NDEASESS` or `NDEASESSXXX`.
 */
export class Bic {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "BIC",
    localizedName: "BIC",
    emoji: "\u{1F504}",
    sources: Object.freeze([
      "https://www.iso.org/cms/render/live/en/sites/isoorg/contents/data/standard/08/41/84108.html",
      "https://www.swift.com/standards/data-standards/bic-business-identifier-code",
    ]),
  });

  /** Normalized 8 or 11 uppercase characters, e.g. `NDEASESS`. */
  readonly code: string;
  readonly institutionCode: string;
  readonly countryCode: string;
  readonly locationCode: string;
  readonly branchCode: string | null;
  /** True when the BIC has no branch code (or the branch code is the head office). */
  get isPrimaryOffice(): boolean {
    return this.branchCode === null;
  }

  private constructor(
    code: string,
    institutionCode: string,
    countryCode: string,
    locationCode: string,
    branchCode: string | null,
  ) {
    this.code = code;
    this.institutionCode = institutionCode;
    this.countryCode = countryCode;
    this.locationCode = locationCode;
    this.branchCode = branchCode;
  }

  static tryParse(input: string | null | undefined): Bic | null {
    if (input == null || input.trim() === "") return null;
    const normalized = normalizeInternal(sanitizeInput(input));
    if (normalized.length > MAX_INPUT_LENGTH) return null;
    const match = PATTERN.exec(normalized);
    if (!match || !match.groups) return null;
    if (Country.tryParse(match.groups.country!) === null) return null;
    return new Bic(
      normalized,
      match.groups.institution!,
      match.groups.country!,
      match.groups.location!,
      match.groups.branch ?? null,
    );
  }

  static parse(input: string): Bic {
    const r = Bic.tryParse(input);
    if (r === null) throw new Error("Invalid BIC.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Bic.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Bic.tryParse(input);
    if (r) return r.code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return Bic.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Bic.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.code;
  }
  toString(): string {
    return this.code;
  }

  static validate(input: string | null | undefined): ValidationResult {
    if (input == null || input.trim() === "")
      return invalidResult(
        input,
        ValidationErrorReason.InputIsEmpty,
        "Input is empty or whitespace.",
        "Värdet är tomt.",
      );

    const normalized = normalizeInternal(sanitizeInput(input));

    if (normalized.length > MAX_INPUT_LENGTH)
      return invalidResult(
        input,
        ValidationErrorReason.InputTooLong,
        "Input contains too many characters.",
        "Värdet innehåller för många tecken.",
      );

    const match = PATTERN.exec(normalized);
    if (!match || !match.groups)
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "BIC has an invalid format (must be 8 or 11 alphanumeric characters).",
        "BIC har ett ogiltigt format (måste vara 8 eller 11 alfanumeriska tecken).",
      );

    if (Country.tryParse(match.groups.country!) === null)
      return invalidResult(
        input,
        ValidationErrorReason.UnknownCountryCode,
        "Unknown BIC country code.",
        "Okänd BIC-landskod.",
      );

    return validResult(input);
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Bic>[] {
    if (!text) return [];
    const out: TextCandidate<Bic>[] = [];
    const re = /\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const original = m[0];
      if (/[a-z]/.test(original)) continue;
      const r = Bic.tryParse(original);
      if (!r) continue;
      out.push(
        new TextCandidate<Bic>({
          startIndex: m.index,
          length: m[0].length,
          originalText: original,
          typeName: "Bic",
          category: TextCandidateCategory.Financial,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskBic(r),
          confidence: TextMatchConfidence.Medium,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: Bic | null | undefined): boolean {
    return other != null && this.code === other.code;
  }
  compareTo(other: Bic | null | undefined): number {
    if (other == null) return 1;
    return this.code < other.code ? -1 : this.code > other.code ? 1 : 0;
  }
}

function normalizeInternal(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "-") continue;
    out += c.toUpperCase();
  }
  return out;
}

/**
 * Returns a masked BIC showing the country code, e.g. `NDEASESS` → `****SE**`.
 */
export function maskBic(bic: Bic): string {
  const code = bic.code;
  let out = "";
  for (let i = 0; i < code.length; i++) {
    out += i >= 4 && i <= 5 ? code[i] : "*";
  }
  return out;
}
