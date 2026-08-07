import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { HsCodeLevel } from "./hs-code-level.js";

/** Options shared by the string-in, string-out helpers. */
export interface HsCodeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MAX_INPUT_LENGTH = 30;

const LEVEL_BY_LENGTH: ReadonlyMap<number, HsCodeLevel> = new Map([
  [2, HsCodeLevel.Chapter],
  [4, HsCodeLevel.Heading],
  [6, HsCodeLevel.Subheading],
  [8, HsCodeLevel.CnSubheading],
  [10, HsCodeLevel.TaricCode],
]);

/**
 * A Harmonized System code for classifying goods in international trade, accepted at all five
 * levels: the two-digit chapter, four-digit heading, six-digit subheading maintained by the WCO,
 * the EU's eight-digit Combined Nomenclature code (`KN-nummer`) and its ten-digit TARIC code.
 *
 * Separators in the input are ignored, so `8471.30` and `8471 30` both give the same code.
 */
export class HsCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "HS Code",
    localizedName: "HS-kod",
    emoji: "📋",
    sources: Object.freeze([
      "https://www.wcoomd.org/en/topics/nomenclature/overview/what-is-the-harmonized-system.aspx",
      "https://taxation-customs.ec.europa.eu/customs/common-customs-tariff-cct/tariff-classification-goods/combined-nomenclature_en",
      "https://www.tullverket.se",
      "https://en.wikipedia.org/wiki/Harmonized_System",
      "https://en.wikipedia.org/wiki/Combined_Nomenclature",
    ]),
  });

  /** The code as digits only, e.g. `847130`. */
  readonly digits: string;

  /** The display form with dots, e.g. `8471.30`. */
  readonly formatted: string;

  /** The chapter, the first two digits, e.g. `84`. */
  readonly chapter: string;

  /** The hierarchy level this code sits at. */
  readonly level: HsCodeLevel;

  private constructor(digits: string) {
    this.digits = digits;
    this.formatted = formatDigits(digits);
    this.chapter = digits.slice(0, 2);
    this.level = LEVEL_BY_LENGTH.get(digits.length) ?? HsCodeLevel.Unknown;
  }

  static tryParse(input: string | null | undefined): HsCode | null {
    if (input == null || input.trim().length === 0) return null;

    const digits = keepDigits(sanitizeInput(input));
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (!LEVEL_BY_LENGTH.has(digits.length)) return null;

    const chapter = Number(digits.slice(0, 2));
    if (chapter < 1 || chapter > 97) return null;

    return new HsCode(digits);
  }

  static parse(input: string): HsCode {
    const result = HsCode.tryParse(input);
    if (result === null) throw new Error("Invalid HS code.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return HsCode.tryParse(input) !== null;
  }

  /** Returns the dot-separated display form, e.g. `8471.30` or `8471.30.00`. */
  static format(input: string | null | undefined, options?: HsCodeFormatOptions): string | null {
    const r = HsCode.tryParse(input);
    if (r !== null) return r.formatted;
    return fallback(input, options);
  }

  /** Returns the dot-separated canonical form, e.g. `8471.30`. */
  static normalize(input: string | null | undefined, options?: HsCodeFormatOptions): string | null {
    const r = HsCode.tryParse(input);
    if (r !== null) return r.formatted;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && HsCode.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.formatted;
  }

  toString(): string {
    return this.formatted;
  }

  equals(other: HsCode | null | undefined): boolean {
    return other != null && this.formatted === other.formatted;
  }

  compareTo(other: HsCode | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

/** Groups the digits the way customs tariffs print them, e.g. `8471.30.00.00`. */
function formatDigits(digits: string): string {
  switch (digits.length) {
    case 4:
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    case 6:
      return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    case 8:
      return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
    case 10:
      return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}.${digits.slice(8)}`;
    default:
      return digits;
  }
}

function fallback(input: string | null | undefined, options?: HsCodeFormatOptions): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
