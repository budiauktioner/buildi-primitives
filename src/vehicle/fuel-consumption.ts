import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link FuelConsumption.format} and {@link FuelConsumption.normalize}. */
export interface FuelConsumptionFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MPG_US_CONVERSION = Decimal.parse("235.214583")!;
const MPG_IMP_CONVERSION = Decimal.parse("282.481")!;
const HUNDRED = Decimal.parse("100")!;
const TEN = Decimal.parse("10")!;
const CONVERSION_PRECISION = 6;

const PATTERN =
  /^\s*([0-9][0-9 .,]*[0-9]|[0-9])\s*(l\/100\s*km|liter\/100\s*km|km\/l|km\/liter|mpg(?:\s*\(imp\))?|miles\s*per\s*gallon|kWh\/100\s*km|kWh\/km|Wh\/km)\s*$/iu;

const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])\d+[0-9 .,]*\s*(?:l\/100\s*km|liter\/100\s*km|km\/l|km\/liter|mpg|kWh\/100\s*km|kWh\/km|Wh\/km)(?![\p{L}\p{N}_])/giu;

/**
 * Vehicle fuel consumption (`bränsleförbrukning`), held as litres per 100 km. Both
 * combustion units (`l/100km`, `km/l`, `mpg`) and electric ones (`kWh/100km`,
 * `Wh/km`) are accepted; a bare number is read as litres per 100 km.
 *
 * Sources:
 * - https://en.wikipedia.org/wiki/Fuel_economy_in_automobiles
 */
export class FuelConsumption {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Fuel Consumption",
    localizedName: "Bränsleförbrukning",
    emoji: "⛽",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Fuel_economy_in_automobiles"]),
  });

  /** Display form preserving the parsed unit, e.g. `8.3 l/100km`. */
  readonly value: string;

  private readonly exactLitersPer100Km: Decimal;
  private readonly exactKwhPer100Km: Decimal;
  private readonly electric: boolean;

  private constructor(
    litersPer100Km: Decimal,
    kwhPer100Km: Decimal,
    isElectric: boolean,
    value: string,
  ) {
    this.exactLitersPer100Km = litersPer100Km;
    this.exactKwhPer100Km = kwhPer100Km;
    this.electric = isElectric;
    this.value = value;
  }

  /** Consumption in litres per 100 km. Zero for electric vehicles. */
  get litersPer100Km(): number {
    return this.exactLitersPer100Km.toNumber();
  }

  /** Fuel economy in kilometres per litre. Zero for electric vehicles. */
  get kilometersPerLiter(): number {
    return this.reciprocal(HUNDRED);
  }

  /** Fuel economy in US miles per gallon. Zero for electric vehicles. */
  get milesPerGallonUs(): number {
    return this.reciprocal(MPG_US_CONVERSION);
  }

  /** Fuel economy in imperial miles per gallon. Zero for electric vehicles. */
  get milesPerGallonImp(): number {
    return this.reciprocal(MPG_IMP_CONVERSION);
  }

  /** Electric consumption in kWh per 100 km. Zero for combustion vehicles. */
  get kwhPer100Km(): number {
    return this.exactKwhPer100Km.toNumber();
  }

  /** `true` when the value came from a kWh-based unit. */
  get isElectric(): boolean {
    return this.electric;
  }

  static fromLitersPer100Km(value: number | Decimal): FuelConsumption {
    const amount = positive(value);
    return new FuelConsumption(
      amount,
      Decimal.zero,
      false,
      `${formatQuantityDecimal(amount)} l/100km`,
    );
  }

  static fromKilometersPerLiter(value: number | Decimal): FuelConsumption {
    const amount = positive(value);
    return new FuelConsumption(
      convert(HUNDRED, amount),
      Decimal.zero,
      false,
      `${formatQuantityDecimal(amount)} km/l`,
    );
  }

  static fromMpgUs(value: number | Decimal): FuelConsumption {
    const amount = positive(value);
    return new FuelConsumption(
      convert(MPG_US_CONVERSION, amount),
      Decimal.zero,
      false,
      `${formatQuantityDecimal(amount)} mpg`,
    );
  }

  static fromKwhPer100Km(value: number | Decimal): FuelConsumption {
    const amount = positive(value);
    return new FuelConsumption(
      Decimal.zero,
      amount,
      true,
      `${formatQuantityDecimal(amount)} kWh/100km`,
    );
  }

  private static fromUnit(amount: Decimal, unitRaw: string): FuelConsumption | null {
    const unit = unitRaw.toLowerCase().replaceAll(" ", "");

    switch (unit) {
      case "l/100km":
      case "liter/100km":
        return new FuelConsumption(
          amount,
          Decimal.zero,
          false,
          `${formatQuantityDecimal(amount)} l/100km`,
        );
      case "km/l":
      case "km/liter":
        return new FuelConsumption(
          convert(HUNDRED, amount),
          Decimal.zero,
          false,
          `${formatQuantityDecimal(amount)} km/l`,
        );
      case "mpg":
      case "milespergallon":
        return new FuelConsumption(
          convert(MPG_US_CONVERSION, amount),
          Decimal.zero,
          false,
          `${formatQuantityDecimal(amount)} mpg`,
        );
      case "mpg(imp)":
        return new FuelConsumption(
          convert(MPG_IMP_CONVERSION, amount),
          Decimal.zero,
          false,
          `${formatQuantityDecimal(amount)} mpg (imp)`,
        );
      case "kwh/100km":
        return new FuelConsumption(
          Decimal.zero,
          amount,
          true,
          `${formatQuantityDecimal(amount)} kWh/100km`,
        );
      case "kwh/km":
        return new FuelConsumption(
          Decimal.zero,
          round(amount.times(HUNDRED)),
          true,
          `${formatQuantityDecimal(amount)} kWh/km`,
        );
      case "wh/km":
        return new FuelConsumption(
          Decimal.zero,
          convert(amount, TEN),
          true,
          `${formatQuantityDecimal(amount)} Wh/km`,
        );
      default:
        return null;
    }
  }

  static tryParse(input: string | null | undefined): FuelConsumption | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const match = PATTERN.exec(trimmed);
    if (match !== null) {
      const amount = tryParseNumberOnly(match[1]!);
      if (amount === null || amount.compareTo(Decimal.zero) <= 0) return null;
      return FuelConsumption.fromUnit(amount, match[2]!);
    }

    const bare = tryParseNumberOnly(trimmed);
    if (bare === null || bare.compareTo(Decimal.zero) <= 0) return null;
    return new FuelConsumption(bare, Decimal.zero, false, `${formatQuantityDecimal(bare)} l/100km`);
  }

  static parse(input: string): FuelConsumption {
    const result = FuelConsumption.tryParse(input);
    if (result === null) throw new Error("Invalid fuel consumption.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return FuelConsumption.tryParse(input) !== null;
  }

  /** Returns the display form in the parsed unit, e.g. `12 km/l`. */
  static format(
    input: string | null | undefined,
    options?: FuelConsumptionFormatOptions,
  ): string | null {
    const parsed = FuelConsumption.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  /** Returns the value in l/100km, or kWh/100km for electric vehicles. */
  static normalize(
    input: string | null | undefined,
    options?: FuelConsumptionFormatOptions,
  ): string | null {
    const parsed = FuelConsumption.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && FuelConsumption.normalize(input) === input;
  }

  /** Finds fuel consumption values in unstructured text, e.g. `8.3 l/100km`. */
  static findCandidatesInText(text: string): readonly TextCandidate<FuelConsumption>[] {
    if (!text) return [];

    const out: TextCandidate<FuelConsumption>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = FuelConsumption.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<FuelConsumption>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "FuelConsumption",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskFuelConsumption(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the value in l/100km, or kWh/100km for electric vehicles. */
  toNormalizedString(): string {
    return this.electric
      ? `${formatQuantityDecimal(this.exactKwhPer100Km)} kWh/100km`
      : `${formatQuantityDecimal(this.exactLitersPer100Km)} l/100km`;
  }

  toString(): string {
    return this.value;
  }

  equals(other: FuelConsumption | null | undefined): boolean {
    return (
      other != null &&
      this.exactLitersPer100Km.equals(other.exactLitersPer100Km) &&
      this.exactKwhPer100Km.equals(other.exactKwhPer100Km)
    );
  }

  compareTo(other: FuelConsumption | null | undefined): number {
    if (other == null) return 1;
    const byLiters = this.exactLitersPer100Km.compareTo(other.exactLitersPer100Km);
    if (byLiters !== 0) return byLiters;
    return this.exactKwhPer100Km.compareTo(other.exactKwhPer100Km);
  }

  private reciprocal(numerator: Decimal): number {
    if (this.exactLitersPer100Km.compareTo(Decimal.zero) <= 0) return 0;
    return convert(numerator, this.exactLitersPer100Km).toNumber();
  }
}

/** Returns a masked fuel consumption, e.g. `8.3 l/100km` becomes `*** l/100km`. */
export function maskFuelConsumption(consumption: FuelConsumption): string {
  const separator = consumption.value.indexOf(" ");
  if (separator < 0) return "*".repeat(consumption.value.length);
  return `*** ${consumption.value.slice(separator + 1)}`;
}

function convert(numerator: Decimal, denominator: Decimal): Decimal {
  return round(numerator.dividedBy(denominator));
}

function round(value: Decimal): Decimal {
  return value.round(CONVERSION_PRECISION, "half-even");
}

function positive(value: number | Decimal): Decimal {
  const amount = value instanceof Decimal ? value : Decimal.fromNumber(value);
  if (amount === null) throw new Error(`Value cannot be represented as a consumption: ${value}`);
  if (amount.compareTo(Decimal.zero) <= 0) throw new Error("Value must be positive.");
  return amount;
}

function fallback(
  input: string | null | undefined,
  options?: FuelConsumptionFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
