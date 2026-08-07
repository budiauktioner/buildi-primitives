import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { SpeedUnit } from "./speed-unit.js";

/** Options for {@link Speed.format} and {@link Speed.normalize}. */
export interface SpeedFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: SpeedUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:miles\s+per\s+hour|km/h|ft/s|m/s|kph|kmh|km/t|mph|knots?|knop|kt|kn)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A speed stored internally in meters per second,
 * parsed from any supported unit and convertible between all of them.
 */
export class Speed extends Quantity<SpeedUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Speed",
    localizedName: "Hastighet",
    emoji: "🏎️",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-base-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<SpeedUnit> {
    return SpeedUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: SpeedUnit): this {
    return new Speed(baseValue, unit) as this;
  }

  get metersPerSecond(): number {
    return this.in(SpeedUnit.MetersPerSecond);
  }
  get kilometersPerHour(): number {
    return this.in(SpeedUnit.KilometersPerHour);
  }
  get milesPerHour(): number {
    return this.in(SpeedUnit.MilesPerHour);
  }
  get feetPerSecond(): number {
    return this.in(SpeedUnit.FeetPerSecond);
  }
  get knots(): number {
    return this.in(SpeedUnit.Knot);
  }

  /** Creates a speed from a value and unit. */
  static create(value: number | Decimal, unit: SpeedUnit): Speed {
    SpeedUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Speed.decimalOf(value);
    return new Speed(unit.toBase(amount), unit);
  }

  static fromMetersPerSecond(value: number | Decimal): Speed {
    return Speed.create(value, SpeedUnit.MetersPerSecond);
  }
  static fromKilometersPerHour(value: number | Decimal): Speed {
    return Speed.create(value, SpeedUnit.KilometersPerHour);
  }
  static fromMilesPerHour(value: number | Decimal): Speed {
    return Speed.create(value, SpeedUnit.MilesPerHour);
  }
  static fromFeetPerSecond(value: number | Decimal): Speed {
    return Speed.create(value, SpeedUnit.FeetPerSecond);
  }
  static fromKnots(value: number | Decimal): Speed {
    return Speed.create(value, SpeedUnit.Knot);
  }

  static tryParse(input: string | null | undefined): Speed | null {
    const parsed = tryParseQuantity(input, SpeedUnit.index);
    return parsed === null ? null : new Speed(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Speed {
    const result = Speed.tryParse(input);
    if (result === null) throw new Error("Invalid speed.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Speed.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: SpeedFormatOptions): string | null {
    const parsed = Speed.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Speed.fallback(input, options);
  }

  /** The value in meters per second, or `null` when the input is invalid. */
  static normalize(input: string | null | undefined, options?: SpeedFormatOptions): string | null {
    const parsed = Speed.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Speed.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Speed.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Speed>[] {
    if (!text) return [];

    const out: TextCandidate<Speed>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Speed.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Speed>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Speed",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskSpeed(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: SpeedFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a speed: ${value}`);
    return parsed;
  }
}

/** Returns a masked speed, e.g. `10 m/s` becomes `*** m/s`. */
export function maskSpeed(value: Speed): string {
  return `*** ${value.originalUnit.symbol}`;
}
