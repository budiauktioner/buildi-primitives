import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import { Length } from "../measurement/length.js";
import { LengthUnit } from "../measurement/length-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskScreenSize } from "./product-masking.js";

/** Options for {@link ScreenSize.format}. */
export interface ScreenSizeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of displaying inches. */
  unit?: LengthUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const INCH_HYPHEN_PATTERN = /^\s*([+-])?\s*([0-9][0-9 .,]*[0-9]|[0-9])\s*-\s*inch(?:es)?\s*$/iu;
const INCH_SYMBOL_PATTERN = /^\s*([0-9][0-9 .,]*[0-9]|[0-9])\s*(?:"|\u2033|'')\s*$/u;
const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])\d+[0-9.,]*\s*(?:"|\u2033|''|-\s*inch(?:es)?)(?![\p{L}\p{N}_])/giu;

/**
 * Display diagonal (`skärmstorlek`) held as a {@link Length}. A bare number is read as inches, so
 * `15` and `15"` and `15-inch` all mean the same panel.
 */
export class ScreenSize {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Screen Size",
    localizedName: "Skärmstorlek",
    emoji: "🖥️",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Display_size"]),
  });

  /** The underlying length value. */
  readonly diagonal: Length;

  /** Normalized form in inches, e.g. `15 in`. */
  readonly value: string;

  private constructor(diagonal: Length) {
    this.diagonal = diagonal;
    this.value = `${formatQuantityDecimal(diagonal.inDecimal(LengthUnit.Inch))} in`;
  }

  /** Diagonal in inches, e.g. `15` for a 15-inch panel. */
  get inches(): number {
    return this.diagonal.inches;
  }

  /** Diagonal in centimetres. */
  get centimeters(): number {
    return this.diagonal.centimeters;
  }

  /** Builds a screen size from a value and a length unit. The value must be positive. */
  static create(value: number | Decimal, unit: LengthUnit): ScreenSize {
    const diagonal = Length.create(value, unit);
    if (diagonal.inDecimal(LengthUnit.Inch).compareTo(Decimal.zero) <= 0) {
      throw new RangeError("Screen size must be positive.");
    }
    return new ScreenSize(diagonal);
  }

  /** Builds a screen size from inches, e.g. `fromInches(15.6)`. */
  static fromInches(inches: number | Decimal): ScreenSize {
    return ScreenSize.create(inches, LengthUnit.Inch);
  }

  /** Builds a screen size from centimetres, e.g. `fromCentimeters(39.6)`. */
  static fromCentimeters(centimeters: number | Decimal): ScreenSize {
    return ScreenSize.create(centimeters, LengthUnit.Centimeter);
  }

  static tryParse(input: string | null | undefined): ScreenSize | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();

    const bare = tryParseNumberOnly(text);
    if (bare !== null && bare.compareTo(Decimal.zero) > 0) {
      return new ScreenSize(Length.fromInches(bare));
    }

    const symbol = INCH_SYMBOL_PATTERN.exec(text);
    if (symbol !== null) {
      const inches = tryParseNumberOnly(symbol[1]!);
      if (inches === null || inches.compareTo(Decimal.zero) <= 0) return null;
      return new ScreenSize(Length.fromInches(inches));
    }

    const hyphen = INCH_HYPHEN_PATTERN.exec(text);
    if (hyphen !== null) {
      const parsed = tryParseNumberOnly(hyphen[2]!);
      if (parsed === null) return null;
      const inches = hyphen[1] === "-" ? parsed.negated() : parsed;
      if (inches.compareTo(Decimal.zero) <= 0) return null;
      return new ScreenSize(Length.fromInches(inches));
    }

    const length = Length.tryParse(text);
    if (length === null || length.inDecimal(LengthUnit.Inch).compareTo(Decimal.zero) <= 0)
      return null;
    return new ScreenSize(length);
  }

  static parse(input: string): ScreenSize {
    const result = ScreenSize.tryParse(input);
    if (result === null) throw new Error("Invalid screen size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ScreenSize.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `15 in`, or the diagonal converted to `options.unit`. */
  static format(
    input: string | null | undefined,
    options?: ScreenSizeFormatOptions,
  ): string | null {
    const r = ScreenSize.tryParse(input);
    if (r !== null) {
      if (options?.unit !== undefined)
        return r.diagonal.toStringInUnit(options.unit, options.decimals);
      if (options?.decimals !== undefined) {
        const inches = r.diagonal.inDecimal(LengthUnit.Inch);
        return `${formatQuantityDecimal(inches, options.decimals)} in`;
      }
      return r.value;
    }
    return fallback(input, options);
  }

  /** Returns the normalized form in inches, e.g. `15 in`. */
  static normalize(
    input: string | null | undefined,
    options?: ScreenSizeFormatOptions,
  ): string | null {
    const formatted = ScreenSize.format(input);
    if (formatted !== null) return formatted;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ScreenSize.normalize(input) === input;
  }

  /**
   * Scans unstructured text for inch notation such as `55"`, `55″` or `55-inch`. The scan is
   * heuristic and may produce false positives.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<ScreenSize>[] {
    if (!text) return [];
    const out: TextCandidate<ScreenSize>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = ScreenSize.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<ScreenSize>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "ScreenSize",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskScreenSize(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ScreenSize | null | undefined): boolean {
    return other != null && this.exactInches.equals(other.exactInches);
  }

  compareTo(other: ScreenSize | null | undefined): number {
    if (other == null) return 1;
    return this.exactInches.compareTo(other.exactInches);
  }

  private get exactInches(): Decimal {
    return this.diagonal.inDecimal(LengthUnit.Inch);
  }
}

function fallback(
  input: string | null | undefined,
  options?: ScreenSizeFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
