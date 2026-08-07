import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { AreaUnit } from "./area-unit.js";

/** Options for {@link Area.format} and {@link Area.normalize}. */
export interface AreaFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: AreaUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:(?:mm|cm|km|m)(?:²|2)|ha\b|hectare\b|hectares\b|hektar\b|acre\b|acres\b|sq\s*ft\b|sq\s*in\b|sq\s*yd\b|kvadrat(?:millimeter|centimeter|meter|kilometer|fot|tum|yard)\b)`,
  "giu",
);

/**
 * A area stored internally in square meters,
 * parsed from any supported unit and convertible between all of them.
 */
export class Area extends Quantity<AreaUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Area",
    localizedName: "Yta",
    emoji: "📐",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-base-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<AreaUnit> {
    return AreaUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: AreaUnit): this {
    return new Area(baseValue, unit) as this;
  }

  get squareMillimeters(): number {
    return this.in(AreaUnit.SquareMillimeter);
  }
  get squareCentimeters(): number {
    return this.in(AreaUnit.SquareCentimeter);
  }
  get squareMeters(): number {
    return this.in(AreaUnit.SquareMeter);
  }
  get squareKilometers(): number {
    return this.in(AreaUnit.SquareKilometer);
  }
  get hectares(): number {
    return this.in(AreaUnit.Hectare);
  }
  get acres(): number {
    return this.in(AreaUnit.Acre);
  }
  get squareFeet(): number {
    return this.in(AreaUnit.SquareFoot);
  }
  get squareInches(): number {
    return this.in(AreaUnit.SquareInch);
  }
  get squareYards(): number {
    return this.in(AreaUnit.SquareYard);
  }

  /** Creates a area from a value and unit. */
  static create(value: number | Decimal, unit: AreaUnit): Area {
    AreaUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Area.decimalOf(value);
    return new Area(unit.toBase(amount), unit);
  }

  static fromSquareMillimeters(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.SquareMillimeter);
  }
  static fromSquareCentimeters(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.SquareCentimeter);
  }
  static fromSquareMeters(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.SquareMeter);
  }
  static fromSquareKilometers(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.SquareKilometer);
  }
  static fromHectares(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.Hectare);
  }
  static fromAcres(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.Acre);
  }
  static fromSquareFeet(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.SquareFoot);
  }
  static fromSquareInches(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.SquareInch);
  }
  static fromSquareYards(value: number | Decimal): Area {
    return Area.create(value, AreaUnit.SquareYard);
  }

  static tryParse(input: string | null | undefined): Area | null {
    const parsed = tryParseQuantity(input, AreaUnit.index);
    return parsed === null ? null : new Area(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Area {
    const result = Area.tryParse(input);
    if (result === null) throw new Error("Invalid area.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Area.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: AreaFormatOptions): string | null {
    const parsed = Area.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Area.fallback(input, options);
  }

  /** The value in square meters, or `null` when the input is invalid. */
  static normalize(input: string | null | undefined, options?: AreaFormatOptions): string | null {
    const parsed = Area.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Area.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Area.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Area>[] {
    if (!text) return [];

    const out: TextCandidate<Area>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Area.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Area>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Area",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskArea(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: AreaFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a area: ${value}`);
    return parsed;
  }
}

/** Returns a masked area, e.g. `10 m²` becomes `*** m²`. */
export function maskArea(value: Area): string {
  return `*** ${value.originalUnit.symbol}`;
}
