import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link WheelRimDimension.format} and {@link WheelRimDimension.normalize}. */
export interface WheelRimDimensionFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MIN_DIAMETER = Decimal.parse("10")!;
const MAX_DIAMETER = Decimal.parse("26")!;
const MIN_WIDTH = Decimal.parse("3")!;
const MAX_WIDTH = Decimal.parse("16")!;

const NORMAL_PATTERN =
  /^\s*(\d{2}(?:[.,]\d{1,2})?)\s*[x×]\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(JJ|JK|J|B|K|P|D)?\s*$/iu;

const REVERSED_PATTERN =
  /^\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(JJ|JK|J|B|K|P|D)?\s*[x×]\s*(\d{2}(?:[.,]\d{1,2})?)\s*$/iu;

const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])\d{1,2}(?:[.,]\d{1,2})?\s*(?:JJ|JK|J|B|K|P|D)?\s*[x×]\s*\d{1,2}(?:[.,]\d{1,2})?\s*(?:JJ|JK|J|B|K|P|D)?(?![\p{L}\p{N}_])/giu;

/**
 * Wheel rim size notation (`fälgdimension`) such as `18x7J`: rim diameter in inches,
 * width in inches and an optional flange type. The reversed order used on many rims,
 * e.g. `7.5Jx17`, is accepted as well.
 *
 * Sources:
 * - https://en.wikipedia.org/wiki/Wheel_sizing
 * - https://www.etrto.org/
 */
export class WheelRimDimension {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Wheel Rim Dimension",
    localizedName: "Fälgdimension",
    emoji: "⭕",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Wheel_sizing",
      "https://www.etrto.org/",
    ]),
  });

  /** Normalized compact form, e.g. `18x7J`. */
  readonly value: string;

  /** Flange type code, e.g. `J` or `JJ`, or an empty string when unspecified. */
  readonly flangeType: string;

  private readonly exactDiameter: Decimal;
  private readonly exactWidth: Decimal;

  private constructor(diameter: Decimal, width: Decimal, flangeType: string) {
    this.exactDiameter = diameter;
    this.exactWidth = width;
    this.flangeType = flangeType;
    this.value = build(diameter, width, flangeType, false);
  }

  /** Rim diameter in inches, e.g. `18`. */
  get diameterInches(): number {
    return this.exactDiameter.toNumber();
  }

  /** Rim width in inches, e.g. `7`. */
  get widthInches(): number {
    return this.exactWidth.toNumber();
  }

  static tryParse(input: string | null | undefined): WheelRimDimension | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    let diameter: Decimal | null;
    let width: Decimal | null;
    let flange: string;

    const normal = NORMAL_PATTERN.exec(trimmed);
    if (normal !== null) {
      diameter = decimalOf(normal[1]!);
      width = decimalOf(normal[2]!);
      flange = normal[3]?.toUpperCase() ?? "";
    } else {
      const reversed = REVERSED_PATTERN.exec(trimmed);
      if (reversed === null) return null;
      width = decimalOf(reversed[1]!);
      flange = reversed[2]?.toUpperCase() ?? "";
      diameter = decimalOf(reversed[3]!);
    }

    if (diameter === null || width === null) return null;
    if (diameter.compareTo(MIN_DIAMETER) < 0 || diameter.compareTo(MAX_DIAMETER) > 0) return null;
    if (width.compareTo(MIN_WIDTH) < 0 || width.compareTo(MAX_WIDTH) > 0) return null;

    return new WheelRimDimension(diameter, width, flange);
  }

  static parse(input: string): WheelRimDimension {
    const result = WheelRimDimension.tryParse(input);
    if (result === null) throw new Error("Invalid wheel rim dimension.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return WheelRimDimension.tryParse(input) !== null;
  }

  /** Returns the spaced display form, e.g. `18 x 7 J`. */
  static format(
    input: string | null | undefined,
    options?: WheelRimDimensionFormatOptions,
  ): string | null {
    const parsed = WheelRimDimension.tryParse(input);
    if (parsed !== null) return parsed.toString();
    return fallback(input, options);
  }

  /** Returns the compact form, e.g. `18x7J`. */
  static normalize(
    input: string | null | undefined,
    options?: WheelRimDimensionFormatOptions,
  ): string | null {
    const parsed = WheelRimDimension.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && WheelRimDimension.normalize(input) === input;
  }

  /** Finds wheel rim dimensions in unstructured text, e.g. `18x7J` or `7.5Jx17`. */
  static findCandidatesInText(text: string): readonly TextCandidate<WheelRimDimension>[] {
    if (!text) return [];

    const out: TextCandidate<WheelRimDimension>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = WheelRimDimension.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<WheelRimDimension>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "WheelRimDimension",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskWheelRimDimension(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the compact form, e.g. `18x7J`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the spaced display form, e.g. `18 x 7 J`. */
  toString(): string {
    return build(this.exactDiameter, this.exactWidth, this.flangeType, true);
  }

  equals(other: WheelRimDimension | null | undefined): boolean {
    return (
      other != null &&
      this.exactDiameter.equals(other.exactDiameter) &&
      this.exactWidth.equals(other.exactWidth) &&
      this.flangeType === other.flangeType
    );
  }

  compareTo(other: WheelRimDimension | null | undefined): number {
    if (other == null) return 1;
    const byDiameter = this.exactDiameter.compareTo(other.exactDiameter);
    if (byDiameter !== 0) return byDiameter;
    const byWidth = this.exactWidth.compareTo(other.exactWidth);
    if (byWidth !== 0) return byWidth;
    return this.flangeType < other.flangeType ? -1 : this.flangeType > other.flangeType ? 1 : 0;
  }

  /** @internal Exposes the parsed scale, which masking mirrors star for star. */
  get _exactParts(): { diameter: Decimal; width: Decimal } {
    return { diameter: this.exactDiameter, width: this.exactWidth };
  }
}

/** Returns a masked rim dimension keeping the flange type, e.g. `18x7J` becomes `** x * J`. */
export function maskWheelRimDimension(dimension: WheelRimDimension): string {
  const { diameter, width } = dimension._exactParts;
  const d = "*".repeat(diameter.toString().length);
  const w = "*".repeat(width.toString().length);
  return dimension.flangeType.length > 0 ? `${d} x ${w} ${dimension.flangeType}` : `${d} x ${w}`;
}

function build(diameter: Decimal, width: Decimal, flange: string, spaced: boolean): string {
  const d = diameter.toTrimmedString();
  const w = width.toTrimmedString();
  if (spaced) return flange.length > 0 ? `${d} x ${w} ${flange}` : `${d} x ${w}`;
  return flange.length > 0 ? `${d}x${w}${flange}` : `${d}x${w}`;
}

function decimalOf(text: string): Decimal | null {
  return Decimal.parse(text.replace(",", "."));
}

function fallback(
  input: string | null | undefined,
  options?: WheelRimDimensionFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
