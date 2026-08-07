/**
 * Shared behaviour for the `Measurement` quantity types (`Length`, `Power`,
 * `Weight`, and the rest).
 *
 * Each of those is ~230 near-identical lines in .NET. Here the common half —
 * parsing, conversion, formatting, comparison and arithmetic — lives once, and
 * a public type supplies its unit table plus the named accessors that make its
 * API readable.
 *
 * The value is held in the base unit as an exact {@link Decimal}. Converting
 * only at the formatting boundary is what keeps `normalize()` byte-identical to
 * .NET; see the note at the top of `decimal.ts`.
 *
 * Internal; not re-exported publicly.
 */

import { Decimal } from "./decimal.js";
import { trySplitMeasurement } from "./measurement-unit-parser.js";
import type { MeasurementUnit, MeasurementUnitIndex } from "./measurement-unit.js";

/** Options shared by the `format` static on every quantity type. */
export interface QuantityFormatOptions<TUnit extends MeasurementUnit> {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: TUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

/**
 * Renders a value the way .NET's private `FormatDecimal` does: optionally
 * rounded away from zero, then stripped of trailing fractional zeros.
 */
export function formatQuantityDecimal(value: Decimal, decimals?: number): string {
  const rounded = decimals === undefined ? value : value.round(decimals, "away-from-zero");
  return rounded.toTrimmedString();
}

export abstract class Quantity<TUnit extends MeasurementUnit> {
  protected constructor(
    /** The value expressed in the dimension's base unit. */
    protected readonly baseValue: Decimal,
    /** The unit the value was originally parsed from. */
    readonly originalUnit: TUnit,
  ) {}

  /** The unit index for this dimension, supplied by the concrete type. */
  protected abstract get units(): MeasurementUnitIndex<TUnit>;

  /** Builds another instance of the concrete type, used by the arithmetic. */
  protected abstract withBaseValue(baseValue: Decimal, unit: TUnit): this;

  /** The exact value converted to `unit`. */
  inDecimal(unit: TUnit): Decimal {
    return this.baseValue.dividedBy(unit.toBaseUnitFactor);
  }

  /** The value converted to `unit`, as a `number` for ergonomic access. */
  in(unit: TUnit): number {
    return this.inDecimal(unit).toNumber();
  }

  /** The most human-readable unit on this dimension's natural scale. */
  get naturalUnit(): TUnit {
    return this.units.getNatural(this.baseValue);
  }

  /** The value in the base unit, e.g. `10000 m`. */
  toNormalizedString(): string {
    return `${formatQuantityDecimal(this.baseValue)} ${this.units.baseUnit.symbol}`;
  }

  /** The value in the unit it was parsed from, e.g. `10 km`. */
  toString(): string {
    return `${formatQuantityDecimal(this.inDecimal(this.originalUnit))} ${this.originalUnit.symbol}`;
  }

  /** The value converted to `unit`, e.g. `0.01 km`. */
  toStringInUnit(unit: TUnit, decimals?: number): string {
    return `${formatQuantityDecimal(this.inDecimal(unit), decimals)} ${unit.symbol}`;
  }

  /** The value in the most readable unit, e.g. `1.5 km` rather than `1500 m`. */
  toNaturalString(decimals?: number): string {
    return this.toStringInUnit(this.naturalUnit, decimals);
  }

  // TypeScript has no operator overloading, so the C# `+ - * /` become methods.

  plus(other: Quantity<TUnit>): this {
    return this.withBaseValue(this.baseValue.plus(other.baseValue), this.originalUnit);
  }

  minus(other: Quantity<TUnit>): this {
    return this.withBaseValue(this.baseValue.minus(other.baseValue), this.originalUnit);
  }

  times(factor: Decimal): this {
    return this.withBaseValue(this.baseValue.times(factor), this.originalUnit);
  }

  dividedBy(divisor: Decimal): this {
    return this.withBaseValue(this.baseValue.dividedBy(divisor), this.originalUnit);
  }

  negated(): this {
    return this.withBaseValue(this.baseValue.negated(), this.originalUnit);
  }

  compareTo(other: Quantity<TUnit> | null | undefined): number {
    if (other == null) return 1;
    return this.baseValue.compareTo(other.baseValue);
  }

  equals(other: Quantity<TUnit> | null | undefined): boolean {
    return other != null && this.baseValue.equals(other.baseValue);
  }

  isLessThan(other: Quantity<TUnit>): boolean {
    return this.compareTo(other) < 0;
  }

  isGreaterThan(other: Quantity<TUnit>): boolean {
    return this.compareTo(other) > 0;
  }
}

/**
 * The shared body of every quantity's `tryParse`: split off the unit suffix,
 * resolve it against the dimension's index, and scale into the base unit.
 *
 * Returns the exact base value and the unit it came from, or `null` when the
 * input is not a measurement in this dimension. Overflow is reported as `null`
 * rather than thrown, matching the .NET types which swallow `OverflowException`
 * inside `TryParse`.
 */
export function tryParseQuantity<TUnit extends MeasurementUnit>(
  input: string | null | undefined,
  units: MeasurementUnitIndex<TUnit>,
  resolveUnit?: (suffix: string) => TUnit | null,
): { baseValue: Decimal; unit: TUnit } | null {
  const split = trySplitMeasurement(input);
  if (split === null) return null;

  const unit = resolveUnit ? resolveUnit(split.unitSuffix) : units.tryParse(split.unitSuffix);
  if (unit === null) return null;

  try {
    return { baseValue: split.value.times(unit.toBaseUnitFactor), unit };
  } catch {
    return null;
  }
}
