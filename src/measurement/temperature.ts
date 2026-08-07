import { Decimal } from "../internal/decimal.js";
import { trySplitMeasurement } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { TemperatureDelta } from "./temperature-delta.js";
import { TemperatureUnit } from "./temperature-unit.js";

/** Options for {@link Temperature.format} and {@link Temperature.normalize}. */
export interface TemperatureFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this scale instead of preserving the parsed one. */
  unit?: TemperatureUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const CELSIUS_OFFSET = Decimal.parse("273.15")!;
const NINE = Decimal.parse("9")!;
const FIVE = Decimal.parse("5")!;
const THIRTY_TWO = Decimal.parse("32")!;

const SCAN_PATTERN = /(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:°[CF]|[CFK])\b/giu;

/**
 * An absolute temperature stored internally in kelvin, parsed from Celsius,
 * Fahrenheit or kelvin.
 *
 * This is the one dimension that cannot share the machinery the other
 * measurement types use: its scales differ by an offset as well as a factor, so
 * conversion is affine rather than a single multiplication.
 *
 * Sources:
 * - https://www.bipm.org/en/measurement-units/si-base-units — kelvin definition
 * - https://en.wikipedia.org/wiki/Conversion_of_units
 */
export class Temperature {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Temperature",
    localizedName: "Temperatur",
    emoji: "🌡️",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-base-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  private constructor(
    private readonly kelvinValue: Decimal,
    /** The scale the value was originally parsed or created from. */
    readonly originalUnit: TemperatureUnit,
  ) {}

  /** The value in degrees Celsius, so `0` at the ice point. */
  get celsius(): number {
    return this.inDecimal(TemperatureUnit.Celsius).toNumber();
  }

  /** The value in degrees Fahrenheit, so `32` at 0 °C. */
  get fahrenheit(): number {
    return this.inDecimal(TemperatureUnit.Fahrenheit).toNumber();
  }

  /** The value in kelvin. */
  get kelvin(): number {
    return this.kelvinValue.toNumber();
  }

  /** The exact value converted to `unit`. */
  inDecimal(unit: TemperatureUnit): Decimal {
    TemperatureUnit.assertOwns(unit);
    if (unit === TemperatureUnit.Kelvin) return this.kelvinValue;

    const celsius = this.kelvinValue.minus(CELSIUS_OFFSET);
    if (unit === TemperatureUnit.Celsius) return celsius;
    if (unit === TemperatureUnit.Fahrenheit) {
      return celsius.times(NINE).dividedBy(FIVE).plus(THIRTY_TWO);
    }

    /* c8 ignore next */
    throw new RangeError("Unit belongs to another dimension.");
  }

  /** The value converted to `unit`, as a `number` for ergonomic access. */
  in(unit: TemperatureUnit): number {
    return this.inDecimal(unit).toNumber();
  }

  static fromCelsius(value: number | Decimal): Temperature {
    return new Temperature(toDecimal(value).plus(CELSIUS_OFFSET), TemperatureUnit.Celsius);
  }

  static fromFahrenheit(value: number | Decimal): Temperature {
    const celsius = toDecimal(value).minus(THIRTY_TWO).times(FIVE).dividedBy(NINE);
    return new Temperature(celsius.plus(CELSIUS_OFFSET), TemperatureUnit.Fahrenheit);
  }

  static fromKelvin(value: number | Decimal): Temperature {
    return new Temperature(toDecimal(value), TemperatureUnit.Kelvin);
  }

  /** Creates a temperature from a value on the given scale. */
  static create(value: number | Decimal, unit: TemperatureUnit): Temperature {
    TemperatureUnit.assertOwns(unit);
    if (unit === TemperatureUnit.Celsius) return Temperature.fromCelsius(value);
    if (unit === TemperatureUnit.Fahrenheit) return Temperature.fromFahrenheit(value);
    if (unit === TemperatureUnit.Kelvin) return Temperature.fromKelvin(value);
    /* c8 ignore next */
    throw new RangeError("Unit belongs to another dimension.");
  }

  static tryParse(input: string | null | undefined): Temperature | null {
    const split = trySplitMeasurement(input);
    if (split === null) return null;

    const unit = TemperatureUnit.tryParse(split.unitSuffix);
    if (unit === null) return null;

    try {
      return Temperature.create(split.value, unit);
    } catch {
      return null;
    }
  }

  static parse(input: string): Temperature {
    const result = Temperature.tryParse(input);
    if (result === null) throw new Error("Invalid temperature.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Temperature.tryParse(input) !== null;
  }

  /** Display form on the parsed scale, or `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: TemperatureFormatOptions,
  ): string | null {
    const parsed = Temperature.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Temperature.fallback(input, options);
  }

  /** The value in kelvin, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: TemperatureFormatOptions,
  ): string | null {
    const parsed = Temperature.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Temperature.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Temperature.normalize(input) === input;
  }

  /** The value in kelvin, e.g. `293.15 K`. */
  toNormalizedString(): string {
    return `${formatQuantityDecimal(this.kelvinValue)} ${TemperatureUnit.Kelvin.symbol}`;
  }

  /** The value on the scale it was parsed from, e.g. `20 °C`. */
  toString(): string {
    return this.toStringInUnit(this.originalUnit);
  }

  /** The value converted to `unit`, e.g. `68 °F`. */
  toStringInUnit(unit: TemperatureUnit, decimals?: number): string {
    return `${formatQuantityDecimal(this.inDecimal(unit), decimals)} ${unit.symbol}`;
  }

  /** Adds a temperature difference, keeping the original scale. */
  plus(delta: TemperatureDelta): Temperature {
    return new Temperature(this.kelvinValue.plus(delta.exactKelvin), this.originalUnit);
  }

  /** Subtracts a temperature difference, keeping the original scale. */
  minus(delta: TemperatureDelta): Temperature {
    return new Temperature(this.kelvinValue.minus(delta.exactKelvin), this.originalUnit);
  }

  /** The difference between two temperatures. */
  difference(other: Temperature): TemperatureDelta {
    return TemperatureDelta.fromKelvin(this.kelvinValue.minus(other.kelvinValue));
  }

  compareTo(other: Temperature | null | undefined): number {
    if (other == null) return 1;
    return this.kelvinValue.compareTo(other.kelvinValue);
  }

  equals(other: Temperature | null | undefined): boolean {
    return other != null && this.kelvinValue.equals(other.kelvinValue);
  }

  isLessThan(other: Temperature): boolean {
    return this.compareTo(other) < 0;
  }

  isGreaterThan(other: Temperature): boolean {
    return this.compareTo(other) > 0;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Temperature>[] {
    if (!text) return [];

    const out: TextCandidate<Temperature>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Temperature.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Temperature>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Temperature",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskTemperature(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: TemperatureFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}

function toDecimal(value: number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a temperature: ${value}`);
  return parsed;
}

/** Returns a masked temperature, e.g. `20 °C` becomes `*** °C`. */
export function maskTemperature(value: Temperature): string {
  return `*** ${value.originalUnit.symbol}`;
}
