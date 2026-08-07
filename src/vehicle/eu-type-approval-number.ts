import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link EuTypeApprovalNumber.format} and `normalize`. */
export interface EuTypeApprovalNumberFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MAX_COUNTRY_CODE = 58;

const APPROVAL_PATTERN = /^[eE](\d{1,2})\*([0-9/]+)\*(\d+)\*(\d+)$/u;
const SCAN_PATTERN = /(?<![\p{L}\p{N}_])[eE]\d{1,2}\*[0-9/]+\*\d+\*\d+(?![\p{L}\p{N}_])/gu;

/** UNECE E-mark country codes. Gaps are codes that have never been assigned. */
const E_MARK_COUNTRIES: Readonly<Record<number, string>> = Object.freeze({
  1: "Germany",
  2: "France",
  3: "Italy",
  4: "Netherlands",
  5: "Sweden",
  6: "Belgium",
  7: "Hungary",
  8: "Czech Republic",
  9: "Spain",
  10: "Serbia",
  11: "United Kingdom",
  12: "Austria",
  13: "Luxembourg",
  14: "Switzerland",
  16: "Norway",
  17: "Finland",
  18: "Denmark",
  19: "Romania",
  20: "Poland",
  21: "Portugal",
  22: "Russia",
  23: "Greece",
  24: "Ireland",
  25: "Croatia",
  26: "Slovenia",
  27: "Slovakia",
  28: "Belarus",
  29: "Estonia",
  31: "Bosnia and Herzegovina",
  32: "Latvia",
  34: "Bulgaria",
  36: "Lithuania",
  37: "Turkey",
  39: "Azerbaijan",
  40: "North Macedonia",
  42: "EU",
  43: "Japan",
  45: "Australia",
  46: "Ukraine",
  47: "South Africa",
  48: "New Zealand",
  49: "Cyprus",
  50: "Malta",
  51: "South Korea",
  52: "Malaysia",
  53: "Thailand",
  54: "Indonesia",
  56: "Montenegro",
  57: "San Marino",
  58: "Tunisia",
});

/**
 * An EU whole-vehicle type-approval number (`typgodkännandenummer`) such as
 * `e9*2007/46*6364*09`: the E-mark country code, the directive or regulation, the
 * type number and the extension.
 *
 * Sources:
 * - https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32018R0858
 * - https://unece.org/transport/vehicle-regulations
 * - https://www.transportstyrelsen.se/
 */
export class EuTypeApprovalNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "EU Type Approval Number",
    localizedName: "Typgodkännandenummer",
    emoji: "✅",
    sources: Object.freeze([
      "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32018R0858",
      "https://unece.org/transport/vehicle-regulations",
      "https://www.transportstyrelsen.se/",
    ]),
  });

  /** Canonical form, e.g. `e9*2007/46*6364*09`. */
  readonly value: string;

  /** E-mark country code, e.g. `9` for Spain and `5` for Sweden. */
  readonly approvalCountryCode: number;

  /** Country name for the E-mark code, or `null` when the code is unassigned. */
  readonly approvalCountryName: string | null;

  /** Directive or regulation reference, e.g. `2007/46`. */
  readonly directive: string;

  /** Type approval number, e.g. `6364`. */
  readonly typeNumber: string;

  /** Extension or variant number, e.g. `09`. */
  readonly extension: string;

  private constructor(
    approvalCountryCode: number,
    directive: string,
    typeNumber: string,
    extension: string,
  ) {
    this.approvalCountryCode = approvalCountryCode;
    this.approvalCountryName = E_MARK_COUNTRIES[approvalCountryCode] ?? null;
    this.directive = directive;
    this.typeNumber = typeNumber;
    this.extension = extension;
    this.value = `e${approvalCountryCode}*${directive}*${typeNumber}*${extension}`;
  }

  static tryParse(input: string | null | undefined): EuTypeApprovalNumber | null {
    if (input == null || input.trim().length === 0) return null;

    const match = APPROVAL_PATTERN.exec(input.trim());
    if (match === null) return null;

    const countryCode = Number(match[1]);
    if (countryCode < 1 || countryCode > MAX_COUNTRY_CODE) return null;

    return new EuTypeApprovalNumber(countryCode, match[2]!, match[3]!, match[4]!);
  }

  static parse(input: string): EuTypeApprovalNumber {
    const result = EuTypeApprovalNumber.tryParse(input);
    if (result === null) throw new Error("Invalid EU type-approval number.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EuTypeApprovalNumber.tryParse(input) !== null;
  }

  /** Returns the canonical number, e.g. `e9*2007/46*6364*09`. */
  static format(
    input: string | null | undefined,
    options?: EuTypeApprovalNumberFormatOptions,
  ): string | null {
    const parsed = EuTypeApprovalNumber.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  /** Returns the canonical number, e.g. `e9*2007/46*6364*09`. */
  static normalize(
    input: string | null | undefined,
    options?: EuTypeApprovalNumberFormatOptions,
  ): string | null {
    const parsed = EuTypeApprovalNumber.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EuTypeApprovalNumber.normalize(input) === input;
  }

  /** Finds type-approval numbers in unstructured text, e.g. `e9*2007/46*6364*09`. */
  static findCandidatesInText(text: string): readonly TextCandidate<EuTypeApprovalNumber>[] {
    if (!text) return [];

    const out: TextCandidate<EuTypeApprovalNumber>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = EuTypeApprovalNumber.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<EuTypeApprovalNumber>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "EuTypeApprovalNumber",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskEuTypeApprovalNumber(value),
          confidence: TextMatchConfidence.High,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the canonical number, e.g. `e9*2007/46*6364*09`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the canonical number, e.g. `e9*2007/46*6364*09`. */
  toString(): string {
    return this.value;
  }

  equals(other: EuTypeApprovalNumber | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: EuTypeApprovalNumber | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/** Returns a masked approval number keeping the e-mark, e.g. `e9*****`. */
export function maskEuTypeApprovalNumber(approval: EuTypeApprovalNumber): string {
  const prefix = `e${approval.approvalCountryCode}`;
  return prefix + "*".repeat(approval.value.length - prefix.length);
}

function fallback(
  input: string | null | undefined,
  options?: EuTypeApprovalNumberFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
