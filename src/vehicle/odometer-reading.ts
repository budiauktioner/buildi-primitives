import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import { Length } from "../measurement/length.js";
import { LengthUnit } from "../measurement/length-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link OdometerReading.format} and {@link OdometerReading.normalize}. */
export interface OdometerReadingFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: LengthUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

/**
 * A vehicle odometer reading (`mätarställning`), e.g. `15000 km`. A bare number is
 * read as kilometres. Swedish miles (`mil`, where 1 mil is 10 km) and English
 * miles (`mi`) are both accepted.
 */
export class OdometerReading {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Odometer Reading",
    localizedName: "Mätarställning",
    emoji: "🔢",
    sources: Object.freeze([]),
  });

  /** The underlying distance. */
  readonly distance: Length;

  /** Display form preserving the parsed unit, e.g. `15000 km`. */
  readonly value: string;

  private constructor(distance: Length, displayValue?: string) {
    this.distance = distance;
    this.value = displayValue ?? distance.toString();
  }

  get kilometers(): number {
    return this.distance.kilometers;
  }

  get miles(): number {
    return this.distance.miles;
  }

  /** The reading in Swedish miles, where 1 mil is 10 km. */
  get swedishMiles(): number {
    return this.distance.swedishMiles;
  }

  /** Creates a reading from a value and length unit. The value must not be negative. */
  static create(value: number | Decimal, unit: LengthUnit): OdometerReading {
    const amount = value instanceof Decimal ? value : decimalOf(value);
    if (amount.isNegative) throw new Error("Odometer reading cannot be negative.");
    return new OdometerReading(Length.create(amount, unit));
  }

  static fromKilometers(value: number | Decimal): OdometerReading {
    return OdometerReading.create(value, LengthUnit.Kilometer);
  }

  /** Creates a reading from Swedish miles, where 1 mil is 10 km. */
  static fromSwedishMiles(value: number | Decimal): OdometerReading {
    return OdometerReading.create(value, LengthUnit.SwedishMile);
  }

  static fromMiles(value: number | Decimal): OdometerReading {
    return OdometerReading.create(value, LengthUnit.Mile);
  }

  static fromMeters(value: number | Decimal): OdometerReading {
    return OdometerReading.create(value, LengthUnit.Meter);
  }

  static tryParse(input: string | null | undefined): OdometerReading | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const bare = tryParseNumberOnly(trimmed);
    if (bare !== null) {
      if (bare.isNegative) return null;
      return new OdometerReading(Length.fromKilometers(bare), `${formatQuantityDecimal(bare)} km`);
    }

    const parsed = Length.tryParse(trimmed);
    if (parsed === null || parsed.meters < 0) return null;
    return new OdometerReading(parsed);
  }

  static parse(input: string): OdometerReading {
    const result = OdometerReading.tryParse(input);
    if (result === null) throw new Error("Invalid odometer reading.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return OdometerReading.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `15000 km`. Returns `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: OdometerReadingFormatOptions,
  ): string | null {
    const parsed = OdometerReading.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.distance.toStringInUnit(
          options.unit ?? parsed.distance.originalUnit,
          options.decimals,
        );
      }
      return parsed.value;
    }
    return fallback(input, options);
  }

  /** Returns the value in kilometres, e.g. `15000 km`. Returns `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: OdometerReadingFormatOptions,
  ): string | null {
    const parsed = OdometerReading.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && OdometerReading.normalize(input) === input;
  }

  /** Returns the reading in kilometres, e.g. `15000 km`. */
  toNormalizedString(): string {
    return `${formatQuantityDecimal(this.distance.inDecimal(LengthUnit.Kilometer))} km`;
  }

  toString(): string {
    return this.value;
  }

  /** Returns the value in the most readable unit, e.g. `1.5 km` rather than `1500 m`. */
  toNaturalString(decimals?: number): string {
    return this.distance.toNaturalString(decimals);
  }

  plus(other: OdometerReading): OdometerReading {
    return new OdometerReading(this.distance.plus(other.distance));
  }

  minus(other: OdometerReading): OdometerReading {
    return new OdometerReading(this.distance.minus(other.distance));
  }

  times(factor: number | Decimal): OdometerReading {
    return new OdometerReading(
      this.distance.times(factor instanceof Decimal ? factor : decimalOf(factor)),
    );
  }

  dividedBy(divisor: number | Decimal): OdometerReading {
    return new OdometerReading(
      this.distance.dividedBy(divisor instanceof Decimal ? divisor : decimalOf(divisor)),
    );
  }

  negated(): OdometerReading {
    return new OdometerReading(this.distance.negated());
  }

  equals(other: OdometerReading | null | undefined): boolean {
    return other != null && this.distance.equals(other.distance);
  }

  compareTo(other: OdometerReading | null | undefined): number {
    if (other == null) return 1;
    return this.distance.compareTo(other.distance);
  }
}

function fallback(
  input: string | null | undefined,
  options?: OdometerReadingFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decimalOf(value: number): Decimal {
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a reading: ${value}`);
  return parsed;
}
