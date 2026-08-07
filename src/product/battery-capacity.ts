import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import { ElectricCharge } from "../measurement/electric-charge.js";
import { Energy } from "../measurement/energy.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link BatteryCapacity.format} and {@link BatteryCapacity.normalize}. */
export interface BatteryCapacityFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * Battery capacity (`batterikapacitet`) expressed either as charge (`5000 mAh`, `5 Ah`) or as
 * energy (`50 Wh`, `75 kWh`). A bare number is read as milliampere-hours. Which of the two a
 * value carries depends on the unit it was parsed from, and the two never mix.
 */
export class BatteryCapacity {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Battery Capacity",
    localizedName: "Batterikapacitet",
    emoji: "🔋",
    sources: Object.freeze([]),
  });

  /** The charge, when parsed from charge units; `null` when parsed from energy units. */
  readonly charge: ElectricCharge | null;

  /** The energy, when parsed from energy units; `null` when parsed from charge units. */
  readonly energy: Energy | null;

  /** Display form preserving the parsed unit, e.g. `5000 mAh` or `50 Wh`. */
  readonly value: string;

  private constructor(charge: ElectricCharge | null, energy: Energy | null, displayValue: string) {
    this.charge = charge;
    this.energy = energy;
    this.value = displayValue;
  }

  private static ofCharge(charge: ElectricCharge, displayValue?: string): BatteryCapacity {
    return new BatteryCapacity(charge, null, displayValue ?? charge.toString());
  }

  private static ofEnergy(energy: Energy, displayValue?: string): BatteryCapacity {
    return new BatteryCapacity(null, energy, displayValue ?? energy.toString());
  }

  /** Creates a capacity from milliampere-hours. The value must be positive. */
  static fromMilliampereHours(value: number | Decimal): BatteryCapacity {
    return BatteryCapacity.ofCharge(ElectricCharge.fromMilliampereHours(positive(value)));
  }

  /** Creates a capacity from ampere-hours. The value must be positive. */
  static fromAmpereHours(value: number | Decimal): BatteryCapacity {
    return BatteryCapacity.ofCharge(ElectricCharge.fromAmpereHours(positive(value)));
  }

  /** Creates a capacity from watt-hours. The value must be positive. */
  static fromWattHours(value: number | Decimal): BatteryCapacity {
    return BatteryCapacity.ofEnergy(Energy.fromWattHours(positive(value)));
  }

  /** Creates a capacity from kilowatt-hours. The value must be positive. */
  static fromKilowattHours(value: number | Decimal): BatteryCapacity {
    return BatteryCapacity.ofEnergy(Energy.fromKilowattHours(positive(value)));
  }

  static tryParse(input: string | null | undefined): BatteryCapacity | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const bare = tryParseNumberOnly(trimmed);
    if (bare !== null) {
      if (bare.compareTo(Decimal.zero) <= 0) return null;
      const display = `${formatQuantityDecimal(bare)} mAh`;
      return BatteryCapacity.ofCharge(ElectricCharge.parse(display), display);
    }

    const charge = ElectricCharge.tryParse(trimmed);
    if (charge !== null) {
      if (charge.ampereHours <= 0) return null;
      return BatteryCapacity.ofCharge(charge);
    }

    const energy = Energy.tryParse(trimmed);
    if (energy !== null) {
      if (energy.joules <= 0) return null;
      return BatteryCapacity.ofEnergy(energy);
    }

    return null;
  }

  static parse(input: string): BatteryCapacity {
    const result = BatteryCapacity.tryParse(input);
    if (result === null) throw new Error("Invalid battery capacity.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return BatteryCapacity.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `5000 mAh` or `50 Wh`. Returns `null` when invalid. */
  static format(
    input: string | null | undefined,
    options?: BatteryCapacityFormatOptions,
  ): string | null {
    const parsed = BatteryCapacity.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  /** Returns the value in base units, e.g. `18000 C` or `180000 J`. Returns `null` when invalid. */
  static normalize(
    input: string | null | undefined,
    options?: BatteryCapacityFormatOptions,
  ): string | null {
    const parsed = BatteryCapacity.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && BatteryCapacity.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.charge !== null ? this.charge.toNormalizedString() : this.energy!.toNormalizedString();
  }

  toString(): string {
    return this.value;
  }

  /** Returns the value in the most readable unit, e.g. `5000 mAh` or `50 Wh`. */
  toNaturalString(decimals?: number): string {
    return this.charge !== null
      ? this.charge.toNaturalString(decimals)
      : this.energy!.toNaturalString(decimals);
  }

  /** Adding a charge-based capacity to an energy-based one throws, as the two do not convert. */
  plus(other: BatteryCapacity): BatteryCapacity {
    if (this.charge !== null && other.charge !== null) {
      return BatteryCapacity.ofCharge(this.charge.plus(other.charge));
    }
    if (this.energy !== null && other.energy !== null) {
      return BatteryCapacity.ofEnergy(this.energy.plus(other.energy));
    }
    throw new Error("Cannot combine charge-based and energy-based battery capacities.");
  }

  minus(other: BatteryCapacity): BatteryCapacity {
    if (this.charge !== null && other.charge !== null) {
      return BatteryCapacity.ofCharge(this.charge.minus(other.charge));
    }
    if (this.energy !== null && other.energy !== null) {
      return BatteryCapacity.ofEnergy(this.energy.minus(other.energy));
    }
    throw new Error("Cannot combine charge-based and energy-based battery capacities.");
  }

  times(factor: number | Decimal): BatteryCapacity {
    const amount = factor instanceof Decimal ? factor : decimalOf(factor);
    return this.charge !== null
      ? BatteryCapacity.ofCharge(this.charge.times(amount))
      : BatteryCapacity.ofEnergy(this.energy!.times(amount));
  }

  dividedBy(divisor: number | Decimal): BatteryCapacity {
    const amount = divisor instanceof Decimal ? divisor : decimalOf(divisor);
    return this.charge !== null
      ? BatteryCapacity.ofCharge(this.charge.dividedBy(amount))
      : BatteryCapacity.ofEnergy(this.energy!.dividedBy(amount));
  }

  negated(): BatteryCapacity {
    return this.charge !== null
      ? BatteryCapacity.ofCharge(this.charge.negated())
      : BatteryCapacity.ofEnergy(this.energy!.negated());
  }

  /** Capacities of different kinds are never equal, even when they describe the same battery. */
  equals(other: BatteryCapacity | null | undefined): boolean {
    if (other == null) return false;
    if (this.charge !== null && other.charge !== null) return this.charge.equals(other.charge);
    if (this.energy !== null && other.energy !== null) return this.energy.equals(other.energy);
    return false;
  }

  /** Orders by normalized string, which keeps charge and energy values apart. */
  compareTo(other: BatteryCapacity | null | undefined): number {
    if (other == null) return 1;
    const a = this.toNormalizedString();
    const b = other.toNormalizedString();
    return a < b ? -1 : a > b ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: BatteryCapacityFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decimalOf(value: number): Decimal {
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a capacity: ${value}`);
  return parsed;
}

function positive(value: number | Decimal): Decimal {
  const amount = value instanceof Decimal ? value : decimalOf(value);
  if (amount.compareTo(Decimal.zero) <= 0) throw new Error("Battery capacity must be positive.");
  return amount;
}
