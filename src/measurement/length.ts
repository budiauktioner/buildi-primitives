import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { LengthUnit } from "./length-unit.js";

/** Options for {@link Length.format} and {@link Length.normalize}. */
export interface LengthFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: LengthUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:µm|nm|mm|cm|dm|km|mi|ft|yd|nmi|mil|in|m)(?![\p{L}\p{N}_])/giu;

/**
 * A length stored internally in meters, parsed from any supported unit format
 * such as `10 km`, `5.5 cm` or `3 ft`, and convertible between metric and
 * imperial units.
 *
 * Sources:
 * - https://www.bipm.org/en/measurement-units/si-base-units — meter definition
 * - https://en.wikipedia.org/wiki/Conversion_of_units
 */
export class Length extends Quantity<LengthUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Length",
    localizedName: "Längd",
    emoji: "📏",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-base-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<LengthUnit> {
    return LengthUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: LengthUnit): this {
    return new Length(baseValue, unit) as this;
  }

  get nanometers(): number {
    return this.in(LengthUnit.Nanometer);
  }
  get micrometers(): number {
    return this.in(LengthUnit.Micrometer);
  }
  get millimeters(): number {
    return this.in(LengthUnit.Millimeter);
  }
  get centimeters(): number {
    return this.in(LengthUnit.Centimeter);
  }
  get decimeters(): number {
    return this.in(LengthUnit.Decimeter);
  }
  get meters(): number {
    return this.in(LengthUnit.Meter);
  }
  get kilometers(): number {
    return this.in(LengthUnit.Kilometer);
  }
  get inches(): number {
    return this.in(LengthUnit.Inch);
  }
  get feet(): number {
    return this.in(LengthUnit.Foot);
  }
  get yards(): number {
    return this.in(LengthUnit.Yard);
  }
  get miles(): number {
    return this.in(LengthUnit.Mile);
  }
  get nauticalMiles(): number {
    return this.in(LengthUnit.NauticalMile);
  }
  /** The value in Swedish miles, where 1 mil is 10 km. */
  get swedishMiles(): number {
    return this.in(LengthUnit.SwedishMile);
  }

  /** Creates a length from a value and unit. */
  static create(value: number | Decimal, unit: LengthUnit): Length {
    LengthUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Length.decimalOf(value);
    return new Length(unit.toBase(amount), unit);
  }

  static fromNanometers(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Nanometer);
  }
  static fromMicrometers(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Micrometer);
  }
  static fromMillimeters(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Millimeter);
  }
  static fromCentimeters(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Centimeter);
  }
  static fromDecimeters(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Decimeter);
  }
  static fromMeters(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Meter);
  }
  static fromKilometers(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Kilometer);
  }
  static fromInches(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Inch);
  }
  static fromFeet(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Foot);
  }
  static fromYards(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Yard);
  }
  static fromMiles(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.Mile);
  }
  static fromNauticalMiles(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.NauticalMile);
  }
  static fromSwedishMiles(value: number | Decimal): Length {
    return Length.create(value, LengthUnit.SwedishMile);
  }

  static tryParse(input: string | null | undefined): Length | null {
    const parsed = tryParseQuantity(input, LengthUnit.index, LengthUnit.tryParse);
    return parsed === null ? null : new Length(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Length {
    const result = Length.tryParse(input);
    if (result === null) throw new Error("Invalid length.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Length.tryParse(input) !== null;
  }

  /**
   * Returns a display-friendly string such as `10 km`, preserving the parsed
   * unit unless `unit` is given. Returns `null` when the input is invalid.
   */
  static format(input: string | null | undefined, options?: LengthFormatOptions): string | null {
    const parsed = Length.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Length.fallback(input, options);
  }

  /** Returns the value in meters, e.g. `10000 m`. Returns `null` when invalid. */
  static normalize(input: string | null | undefined, options?: LengthFormatOptions): string | null {
    const parsed = Length.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Length.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Length.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Length>[] {
    if (!text) return [];

    const out: TextCandidate<Length>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Length.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Length>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Length",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskLength(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: LengthFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a length: ${value}`);
    return parsed;
  }
}

/** Returns a masked length, e.g. `10 km` becomes `*** km`. */
export function maskLength(length: Length): string {
  return `*** ${length.originalUnit.symbol}`;
}
