import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link EnergyConsumption.format} and {@link EnergyConsumption.normalize}. */
export interface EnergyConsumptionFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const KILOMETRES_PER_MILE = Decimal.parse("1.609344")!;
const HUNDRED = Decimal.parse("100")!;
const TEN = Decimal.parse("10")!;
const CONVERSION_PRECISION = 6;

const PATTERN =
  /^\s*([0-9][0-9 .,]*[0-9]|[0-9])\s*(kWh\/100\s*km|kWh\/km|Wh\/km|mi\/kWh|miles\/kWh|kWh\/mi|kWh\/mile)\s*$/iu;

const SCAN_PATTERN =
  /(?<!\w)\d+[0-9 .,]*\s*(?:kWh\/100\s*km|kWh\/km|Wh\/km|mi\/kWh|miles\/kWh|kWh\/mi|kWh\/mile)\b/giu;

/**
 * Electric vehicle energy consumption (`elförbrukning`), held as kWh per 100 km.
 * Accepts `kWh/100km`, `kWh/km`, `Wh/km` and the US `mi/kWh` and `kWh/mi`; a bare
 * number is read as kWh per 100 km.
 *
 * Sources:
 * - https://en.wikipedia.org/wiki/Fuel_economy_in_electric_vehicles
 * - https://www.energimyndigheten.se/
 */
export class EnergyConsumption {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Energy Consumption",
    localizedName: "Elförbrukning",
    emoji: "🔌",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Fuel_economy_in_electric_vehicles",
      "https://www.energimyndigheten.se/",
    ]),
  });

  /** Display form preserving the parsed unit, e.g. `150 Wh/km`. */
  readonly value: string;

  /** The unit the value was parsed from, e.g. `kWh/100km` or `mi/kWh`. */
  readonly originalUnit: string;

  private readonly exactKwhPer100Km: Decimal;

  private constructor(kwhPer100Km: Decimal, displayUnit: string, value: string) {
    this.exactKwhPer100Km = kwhPer100Km;
    this.originalUnit = displayUnit;
    this.value = value;
  }

  /** Consumption in kilowatt-hours per 100 km, e.g. `15` for a typical EV. */
  get kwhPer100Km(): number {
    return this.exactKwhPer100Km.toNumber();
  }

  /** Consumption in kilowatt-hours per km, e.g. `0.15` for 15 kWh/100km. */
  get kwhPerKm(): number {
    return round(this.exactKwhPer100Km.dividedBy(HUNDRED)).toNumber();
  }

  /** Consumption in watt-hours per km, e.g. `150` for 15 kWh/100km. */
  get whPerKm(): number {
    return round(this.exactKwhPer100Km.times(TEN)).toNumber();
  }

  /** Energy economy in US miles per kilowatt-hour, e.g. `4.13` for 15 kWh/100km. */
  get milesPerKwh(): number {
    if (this.exactKwhPer100Km.compareTo(Decimal.zero) <= 0) return 0;
    return round(HUNDRED.dividedBy(this.exactKwhPer100Km.times(KILOMETRES_PER_MILE))).toNumber();
  }

  /** Consumption in kilowatt-hours per mile, e.g. `0.241` for 15 kWh/100km. */
  get kwhPerMile(): number {
    return round(this.exactKwhPer100Km.times(KILOMETRES_PER_MILE).dividedBy(HUNDRED)).toNumber();
  }

  static fromKwhPer100Km(value: number | Decimal): EnergyConsumption {
    const amount = positive(value);
    return new EnergyConsumption(amount, "kWh/100km", `${formatQuantityDecimal(amount)} kWh/100km`);
  }

  static fromWhPerKm(value: number | Decimal): EnergyConsumption {
    const amount = positive(value);
    return new EnergyConsumption(
      round(amount.dividedBy(TEN)),
      "Wh/km",
      `${formatQuantityDecimal(amount)} Wh/km`,
    );
  }

  static fromKwhPerKm(value: number | Decimal): EnergyConsumption {
    const amount = positive(value);
    return new EnergyConsumption(
      round(amount.times(HUNDRED)),
      "kWh/km",
      `${formatQuantityDecimal(amount)} kWh/km`,
    );
  }

  static fromMilesPerKwh(value: number | Decimal): EnergyConsumption {
    const amount = positive(value);
    return new EnergyConsumption(
      round(HUNDRED.dividedBy(amount.times(KILOMETRES_PER_MILE))),
      "mi/kWh",
      `${formatQuantityDecimal(amount)} mi/kWh`,
    );
  }

  static fromKwhPerMile(value: number | Decimal): EnergyConsumption {
    const amount = positive(value);
    return new EnergyConsumption(
      round(amount.times(HUNDRED).dividedBy(KILOMETRES_PER_MILE)),
      "kWh/mi",
      `${formatQuantityDecimal(amount)} kWh/mi`,
    );
  }

  private static fromUnit(amount: Decimal, unitRaw: string): EnergyConsumption | null {
    const unit = unitRaw.toLowerCase().replaceAll(" ", "");

    switch (unit) {
      case "kwh/100km":
        return new EnergyConsumption(
          amount,
          "kWh/100km",
          `${formatQuantityDecimal(amount)} kWh/100km`,
        );
      case "kwh/km":
        return new EnergyConsumption(
          round(amount.times(HUNDRED)),
          "kWh/km",
          `${formatQuantityDecimal(amount)} kWh/km`,
        );
      case "wh/km":
        return new EnergyConsumption(
          round(amount.dividedBy(TEN)),
          "Wh/km",
          `${formatQuantityDecimal(amount)} Wh/km`,
        );
      case "mi/kwh":
      case "miles/kwh":
        return new EnergyConsumption(
          round(HUNDRED.dividedBy(amount.times(KILOMETRES_PER_MILE))),
          "mi/kWh",
          `${formatQuantityDecimal(amount)} mi/kWh`,
        );
      case "kwh/mi":
      case "kwh/mile":
        return new EnergyConsumption(
          round(amount.times(HUNDRED).dividedBy(KILOMETRES_PER_MILE)),
          "kWh/mi",
          `${formatQuantityDecimal(amount)} kWh/mi`,
        );
      default:
        return null;
    }
  }

  static tryParse(input: string | null | undefined): EnergyConsumption | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const match = PATTERN.exec(trimmed);
    if (match !== null) {
      const amount = tryParseNumberOnly(match[1]!);
      if (amount === null || amount.compareTo(Decimal.zero) <= 0) return null;
      return EnergyConsumption.fromUnit(amount, match[2]!);
    }

    const bare = tryParseNumberOnly(trimmed);
    if (bare === null || bare.compareTo(Decimal.zero) <= 0) return null;
    return new EnergyConsumption(bare, "kWh/100km", `${formatQuantityDecimal(bare)} kWh/100km`);
  }

  static parse(input: string): EnergyConsumption {
    const result = EnergyConsumption.tryParse(input);
    if (result === null) throw new Error("Invalid energy consumption.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EnergyConsumption.tryParse(input) !== null;
  }

  /** Returns the display form in the parsed unit, e.g. `4 mi/kWh`. */
  static format(
    input: string | null | undefined,
    options?: EnergyConsumptionFormatOptions,
  ): string | null {
    const parsed = EnergyConsumption.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  /** Returns the value in kWh/100km, e.g. `15 kWh/100km`. */
  static normalize(
    input: string | null | undefined,
    options?: EnergyConsumptionFormatOptions,
  ): string | null {
    const parsed = EnergyConsumption.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EnergyConsumption.normalize(input) === input;
  }

  /** Finds energy consumption values in unstructured text, e.g. `150 Wh/km`. */
  static findCandidatesInText(text: string): readonly TextCandidate<EnergyConsumption>[] {
    if (!text) return [];

    const out: TextCandidate<EnergyConsumption>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = EnergyConsumption.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<EnergyConsumption>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "EnergyConsumption",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskEnergyConsumption(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the value in kWh/100km, e.g. `15 kWh/100km`. */
  toNormalizedString(): string {
    return `${formatQuantityDecimal(this.exactKwhPer100Km)} kWh/100km`;
  }

  toString(): string {
    return this.value;
  }

  equals(other: EnergyConsumption | null | undefined): boolean {
    return other != null && this.exactKwhPer100Km.equals(other.exactKwhPer100Km);
  }

  compareTo(other: EnergyConsumption | null | undefined): number {
    if (other == null) return 1;
    return this.exactKwhPer100Km.compareTo(other.exactKwhPer100Km);
  }
}

/** Returns a masked energy consumption, e.g. `15 kWh/100km` becomes `*** kWh/100km`. */
export function maskEnergyConsumption(consumption: EnergyConsumption): string {
  const separator = consumption.value.indexOf(" ");
  if (separator < 0) return "*".repeat(consumption.value.length);
  return `*** ${consumption.value.slice(separator + 1)}`;
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
  options?: EnergyConsumptionFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
