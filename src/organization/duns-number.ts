import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

const MAX_INPUT_LENGTH = 20;

/** A 9-digit D-U-N-S number. */
export class DunsNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "D-U-N-S Number",
    localizedName: "D-U-N-S-nummer",
    emoji: "\u{1F522}",
    sources: Object.freeze([
      "https://www.dnb.com/duns.html",
      "https://en.wikipedia.org/wiki/Data_Universal_Numbering_System",
    ]),
  });

  readonly digits: string;
  private constructor(digits: string) {
    this.digits = digits;
  }

  static tryParse(input: string | null | undefined): DunsNumber | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(sanitizeInput(input));
    if (digits.length > MAX_INPUT_LENGTH || digits.length !== 9) return null;
    return new DunsNumber(digits);
  }

  static parse(input: string): DunsNumber {
    const r = DunsNumber.tryParse(input);
    if (r === null) throw new Error("Invalid D-U-N-S number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return DunsNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = DunsNumber.tryParse(input);
    if (r) return r.digits;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return DunsNumber.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && DunsNumber.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.digits;
  }
  toString(): string {
    return this.digits;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<DunsNumber>[] {
    if (!text) return [];
    const out: TextCandidate<DunsNumber>[] = [];
    const re = /(?<!\d)\d{9}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = DunsNumber.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<DunsNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "DunsNumber",
          category: TextCandidateCategory.OrganizationIdentifier,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskDunsNumber(r),
          confidence: TextMatchConfidence.Low,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: DunsNumber | null | undefined): boolean {
    return other != null && this.digits === other.digits;
  }
  compareTo(other: DunsNumber | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

/** Masks all digits of a D-U-N-S number. */
export function maskDunsNumber(d: DunsNumber): string {
  return "*".repeat(d.digits.length);
}
