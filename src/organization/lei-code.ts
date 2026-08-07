import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { isValidIso7064Mod97 } from "./organization-validation-utils.js";

const MAX_INPUT_LENGTH = 30;

/** Legal Entity Identifier (ISO 17442). */
export class LeiCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "LEI Code",
    localizedName: "LEI-kod",
    emoji: "\u{1F3DB}\uFE0F",
    sources: Object.freeze([
      "https://www.gleif.org/en/about-lei/iso-17442-the-lei-code-structure/",
      "https://en.wikipedia.org/wiki/Legal_Entity_Identifier",
    ]),
  });

  readonly value: string;
  get louPrefix(): string {
    return this.value.slice(0, 4);
  }
  get reserved(): string {
    return this.value.slice(4, 6);
  }
  get entitySpecific(): string {
    return this.value.slice(6, 18);
  }
  get checkDigits(): string {
    return this.value.slice(18, 20);
  }

  private constructor(value: string) {
    this.value = value;
  }

  static tryParse(input: string | null | undefined): LeiCode | null {
    if (input == null || input.trim() === "") return null;
    const source = sanitizeInput(input);
    let cleaned = "";
    for (const c of source) {
      if (/[A-Za-z0-9]/.test(c)) cleaned += c.toUpperCase();
    }
    if (cleaned.length > MAX_INPUT_LENGTH || cleaned.length !== 20) return null;
    if (!isValidIso7064Mod97(cleaned)) return null;
    return new LeiCode(cleaned);
  }

  static parse(input: string): LeiCode {
    const r = LeiCode.tryParse(input);
    if (r === null) throw new Error("Invalid LEI code (length or checksum invalid).");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return LeiCode.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = LeiCode.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return LeiCode.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && LeiCode.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<LeiCode>[] {
    if (!text) return [];
    const out: TextCandidate<LeiCode>[] = [];
    const re = /(?<![A-Z0-9])[A-Z0-9]{18}\d{2}(?![A-Z0-9])/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = LeiCode.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<LeiCode>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "LeiCode",
          category: TextCandidateCategory.OrganizationIdentifier,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskLeiCode(r),
          confidence: TextMatchConfidence.High,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: LeiCode | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: LeiCode | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/** Masks the LEI keeping only the first 4-character LOU prefix visible. */
export function maskLeiCode(l: LeiCode): string {
  const v = l.value;
  return v.slice(0, 4) + "*".repeat(v.length - 4);
}
