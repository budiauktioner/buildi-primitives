import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { luhnIsValid } from "../internal/luhn.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ValidationErrorReason, ValidationResult } from "../validation/index.js";
import { invalidResult, validResult } from "../validation/validation-result.js";
import { SwedishPersonalIdentityNumber } from "../person/swedish-personal-identity-number.js";
import { SwedishCoordinationNumber } from "../person/swedish-coordination-number.js";
import { SwedishOrganizationName } from "./swedish-organization-name.js";
import { SwedishOrganizationType } from "./swedish-organization-type.js";

const MAX_INPUT_LENGTH = 30;
const LEGAL_ENTITY_PREFIX = "16";

export interface SwedishOrganizationTypeHintResult {
  readonly certain: SwedishOrganizationType;
  readonly bestGuess: SwedishOrganizationType;
}

/** A Swedish organization number (`organisationsnummer`). */
export class SwedishOrganizationNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Organization Number",
    localizedName: "Organisationsnummer",
    emoji: "\u{1F3E2}",
    sources: Object.freeze([
      "https://bolagsverket.se",
      "https://skatteverket.se/foretag/drivaforetag/startaforetag/organisationsnummer.html",
      "https://sv.wikipedia.org/wiki/Organisationsnummer",
    ]),
  });

  readonly _tenWithDash: string;
  readonly _twelveDigits: string;
  readonly _isPerson: boolean;

  get isPerson(): boolean {
    return this._isPerson;
  }

  private constructor(tenWithDash: string, twelveDigits: string, isPerson: boolean) {
    this._tenWithDash = tenWithDash;
    this._twelveDigits = twelveDigits;
    this._isPerson = isPerson;
  }

  static tryParse(input: string | null | undefined): SwedishOrganizationNumber | null {
    if (input == null || input.trim() === "") return null;
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length > MAX_INPUT_LENGTH) return null;

    const pin = SwedishPersonalIdentityNumber.tryParse(sanitized);
    if (pin) {
      return new SwedishOrganizationNumber(pin.formatted, pin.value, true);
    }
    const cn = SwedishCoordinationNumber.tryParse(sanitized);
    if (cn) {
      return new SwedishOrganizationNumber(cn.formatted, cn.value, true);
    }

    const digits = keepDigits(sanitized);
    if (digits.length === 0) return null;

    let tenDigits: string;
    if (digits.length === 10) tenDigits = digits;
    else if (digits.length === 12 && digits.startsWith(LEGAL_ENTITY_PREFIX))
      tenDigits = digits.slice(2);
    else return null;

    if (!isLegalEntityPattern(tenDigits)) return null;
    if (!luhnIsValid(tenDigits)) return null;

    const tenWithDash = `${tenDigits.slice(0, 6)}-${tenDigits.slice(6)}`;
    const twelve = LEGAL_ENTITY_PREFIX + tenDigits;
    return new SwedishOrganizationNumber(tenWithDash, twelve, false);
  }

  static parse(input: string): SwedishOrganizationNumber {
    const r = SwedishOrganizationNumber.tryParse(input);
    if (r === null) throw new Error("Invalid Swedish organization number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishOrganizationNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishOrganizationNumber.tryParse(input);
    if (r) return r.to10DigitString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishOrganizationNumber.tryParse(input);
    if (r) return r.to12DigitString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishOrganizationNumber.normalize(input) === input;
  }

  to10DigitsOnly(): string {
    return this._tenWithDash.replace(/[-+]/g, "");
  }
  to10DigitString(): string {
    return this._tenWithDash;
  }
  to12DigitString(): string {
    return this._twelveDigits;
  }
  toNormalizedString(): string {
    return this.to12DigitString();
  }
  toString(): string {
    return this.to10DigitString();
  }

  getSwedishOrganizationTypeHint(
    name?: string | null,
    isPrivatePerson?: boolean | null,
  ): SwedishOrganizationTypeHintResult {
    let certain: SwedishOrganizationType;
    let bestGuess: SwedishOrganizationType;

    if (this._isPerson) {
      certain = SwedishOrganizationType.EnskildFirmaEllerPrivatperson;
      if (isPrivatePerson === true) bestGuess = SwedishOrganizationType.Privatperson;
      else if (isPrivatePerson === false) bestGuess = SwedishOrganizationType.EnskildFirma;
      else {
        const nameType = SwedishOrganizationName.inferSwedishOrganizationType(name ?? null);
        bestGuess =
          nameType === SwedishOrganizationType.EnskildFirma ||
          nameType === SwedishOrganizationType.Privatperson
            ? nameType
            : certain;
      }
      return { certain, bestGuess };
    }

    const first = this.to10DigitsOnly()[0]!;
    const nameType = SwedishOrganizationName.inferSwedishOrganizationType(name ?? null);

    switch (first) {
      case "1":
        certain = SwedishOrganizationType.Dodsbo;
        bestGuess = certain;
        break;
      case "2":
        certain = SwedishOrganizationType.OffentligSektor;
        bestGuess =
          nameType === SwedishOrganizationType.Kommun ||
          nameType === SwedishOrganizationType.Region ||
          nameType === SwedishOrganizationType.Forsamling
            ? nameType
            : certain;
        break;
      case "5":
        certain = SwedishOrganizationType.Aktiebolag;
        bestGuess = nameType === SwedishOrganizationType.Kommanditbolag ? nameType : certain;
        break;
      case "6":
        certain = SwedishOrganizationType.HandelsbolagEllerKommanditbolag;
        bestGuess =
          nameType === SwedishOrganizationType.Kommanditbolag ||
          nameType === SwedishOrganizationType.Handelsbolag
            ? nameType
            : certain;
        break;
      case "7":
        certain = SwedishOrganizationType.EkonomiskForening;
        bestGuess =
          nameType === SwedishOrganizationType.Bostadsrattsforening ||
          nameType === SwedishOrganizationType.Samfallighetsforening
            ? nameType
            : certain;
        break;
      case "8":
        certain = SwedishOrganizationType.IdeellForening;
        bestGuess = nameType === SwedishOrganizationType.Stiftelse ? nameType : certain;
        break;
      case "9":
        certain = SwedishOrganizationType.HandelsbolagEllerKommanditbolag;
        bestGuess =
          nameType === SwedishOrganizationType.Kommanditbolag ||
          nameType === SwedishOrganizationType.Handelsbolag
            ? nameType
            : certain;
        break;
      default:
        certain = SwedishOrganizationType.Other;
        bestGuess =
          nameType === SwedishOrganizationType.EuropeiskEkonomiskIntressegruppering ||
          nameType === SwedishOrganizationType.Europabolag ||
          nameType === SwedishOrganizationType.SCEForening ||
          nameType === SwedishOrganizationType.Filial
            ? nameType
            : certain;
        break;
    }
    return { certain, bestGuess };
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
    if (SwedishPersonalIdentityNumber.tryParse(sanitized)) return validResult(input);
    if (SwedishCoordinationNumber.tryParse(sanitized)) return validResult(input);

    const digits = keepDigits(sanitized);
    if (digits.length === 0) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "Input contains no digits.",
        "Värdet innehåller inga siffror.",
      );
    }
    if (
      !(digits.length === 10 || (digits.length === 12 && digits.startsWith(LEGAL_ENTITY_PREFIX)))
    ) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidLength,
        "Organization number must be 10 or 12 digits (12-digit form must start with 16).",
        "Organisationsnummer måste vara 10 eller 12 siffror (12-siffrig form måste börja med 16).",
      );
    }
    const tenDigits = digits.length === 12 ? digits.slice(2) : digits;
    if (!isLegalEntityPattern(tenDigits)) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidEntityPattern,
        "Number does not match a valid organization type pattern.",
        "Numret matchar inte ett giltigt organisationstypsmönster.",
      );
    }
    if (!luhnIsValid(tenDigits)) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidCheckDigit,
        "Invalid check digit.",
        "Ogiltig kontrollsiffra.",
      );
    }
    return validResult(input);
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishOrganizationNumber>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishOrganizationNumber>[] = [];
    const re = /(?<!\d)(\d{6})-?(\d{4})(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = SwedishOrganizationNumber.tryParse(m[0]);
      if (!r || r.isPerson) continue;
      out.push(
        new TextCandidate<SwedishOrganizationNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishOrganizationNumber",
          category: TextCandidateCategory.OrganizationIdentifier,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskSwedishOrganizationNumber(r),
          confidence: TextMatchConfidence.High,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishOrganizationNumber | null | undefined): boolean {
    return other != null && this._twelveDigits === other._twelveDigits;
  }
  compareTo(other: SwedishOrganizationNumber | null | undefined): number {
    if (other == null) return 1;
    return this._twelveDigits < other._twelveDigits
      ? -1
      : this._twelveDigits > other._twelveDigits
        ? 1
        : 0;
  }
}

function isLegalEntityPattern(tenDigits: string): boolean {
  if (tenDigits.length !== 10) return false;
  if (tenDigits[0] === "1") return true;
  const first = tenDigits[0]!;
  if (
    first !== "2" &&
    first !== "3" &&
    first !== "5" &&
    first !== "6" &&
    first !== "7" &&
    first !== "8" &&
    first !== "9"
  )
    return false;
  const m1 = tenDigits.charCodeAt(2) - 0x30;
  const m2 = tenDigits.charCodeAt(3) - 0x30;
  const mm = m1 * 10 + m2;
  return mm >= 20;
}

/**
 * Masks person-based Swedish organization identifiers by default.
 * Public legal-entity organization numbers are returned unmasked unless
 * `maskOrganizationNumbers` is set.
 */
export function maskSwedishOrganizationNumber(
  o: SwedishOrganizationNumber,
  options?: { maskOrganizationNumbers?: boolean; maskBirthDate?: boolean },
): string {
  const s = o.to10DigitString();
  if (o.isPerson) {
    const sep = s[6]!;
    if (options?.maskBirthDate) return "******" + sep + "****";
    return s.slice(0, 6) + sep + "****";
  }
  if (options?.maskOrganizationNumbers) return s.slice(0, 7) + "****";
  return s;
}
