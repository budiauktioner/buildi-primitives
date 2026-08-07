import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import { Volume } from "../measurement/volume.js";
import { VolumeUnit } from "../measurement/volume-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link EngineDisplacement.format} and {@link EngineDisplacement.normalize}. */
export interface EngineDisplacementFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: VolumeUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

/**
 * Engine displacement (`motorvolym` / `slagvolym`), e.g. `1998 mL` or `2.0 L`.
 * A bare number is read as cubic centimetres, which are the same as millilitres.
 */
export class EngineDisplacement {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Engine Displacement",
    localizedName: "Motorvolym",
    emoji: "🔩",
    sources: Object.freeze([]),
  });

  /** The underlying volume. */
  readonly displacement: Volume;

  /** Display form preserving the parsed unit, e.g. `1998 mL`. */
  readonly value: string;

  private constructor(displacement: Volume, displayValue?: string) {
    this.displacement = displacement;
    this.value = displayValue ?? displacement.toString();
  }

  /** Displacement in cubic centimetres (cc), which are millilitres. */
  get cubicCentimeters(): number {
    return this.displacement.milliliters;
  }

  /** Displacement in litres. */
  get liters(): number {
    return this.displacement.liters;
  }

  /** Creates a displacement from a value and volume unit. The value must be positive. */
  static create(value: number | Decimal, unit: VolumeUnit): EngineDisplacement {
    const amount = value instanceof Decimal ? value : decimalOf(value);
    if (amount.compareTo(Decimal.zero) <= 0) {
      throw new Error("Engine displacement must be positive.");
    }
    return new EngineDisplacement(Volume.create(amount, unit));
  }

  static fromCubicCentimeters(value: number | Decimal): EngineDisplacement {
    return EngineDisplacement.create(value, VolumeUnit.Milliliter);
  }

  static fromLiters(value: number | Decimal): EngineDisplacement {
    return EngineDisplacement.create(value, VolumeUnit.Liter);
  }

  static tryParse(input: string | null | undefined): EngineDisplacement | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const bare = tryParseNumberOnly(trimmed);
    if (bare !== null) {
      if (bare.compareTo(Decimal.zero) <= 0) return null;
      return new EngineDisplacement(
        Volume.fromMilliliters(bare),
        `${formatQuantityDecimal(bare)} mL`,
      );
    }

    // `cc` is not a volume unit symbol, but it is the conventional spelling here.
    if (trimmed.toLowerCase().endsWith("cc")) {
      const amount = tryParseNumberOnly(trimmed.slice(0, -2).trim());
      if (amount !== null && amount.compareTo(Decimal.zero) > 0) {
        return new EngineDisplacement(
          Volume.fromMilliliters(amount),
          `${formatQuantityDecimal(amount)} mL`,
        );
      }
    }

    const parsed = Volume.tryParse(trimmed);
    if (parsed === null || parsed.liters <= 0) return null;
    return new EngineDisplacement(parsed);
  }

  static parse(input: string): EngineDisplacement {
    const result = EngineDisplacement.tryParse(input);
    if (result === null) throw new Error("Invalid engine displacement.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EngineDisplacement.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `1998 mL`. Returns `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: EngineDisplacementFormatOptions,
  ): string | null {
    const parsed = EngineDisplacement.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.displacement.toStringInUnit(
          options.unit ?? parsed.displacement.originalUnit,
          options.decimals,
        );
      }
      return parsed.value;
    }
    return fallback(input, options);
  }

  /** Returns the value in litres, e.g. `1.998 L`. Returns `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: EngineDisplacementFormatOptions,
  ): string | null {
    const parsed = EngineDisplacement.tryParse(input);
    if (parsed !== null) return parsed.displacement.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EngineDisplacement.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.displacement.toNormalizedString();
  }

  toString(): string {
    return this.value;
  }

  /** Returns the value in the most readable metric unit, e.g. `2 L` rather than `2000 mL`. */
  toNaturalString(decimals?: number): string {
    return this.displacement.toNaturalString(decimals);
  }

  plus(other: EngineDisplacement): EngineDisplacement {
    return new EngineDisplacement(this.displacement.plus(other.displacement));
  }

  minus(other: EngineDisplacement): EngineDisplacement {
    return new EngineDisplacement(this.displacement.minus(other.displacement));
  }

  times(factor: number | Decimal): EngineDisplacement {
    return new EngineDisplacement(
      this.displacement.times(factor instanceof Decimal ? factor : decimalOf(factor)),
    );
  }

  dividedBy(divisor: number | Decimal): EngineDisplacement {
    return new EngineDisplacement(
      this.displacement.dividedBy(divisor instanceof Decimal ? divisor : decimalOf(divisor)),
    );
  }

  negated(): EngineDisplacement {
    return new EngineDisplacement(this.displacement.negated());
  }

  equals(other: EngineDisplacement | null | undefined): boolean {
    return other != null && this.displacement.equals(other.displacement);
  }

  compareTo(other: EngineDisplacement | null | undefined): number {
    if (other == null) return 1;
    return this.displacement.compareTo(other.displacement);
  }
}

function fallback(
  input: string | null | undefined,
  options?: EngineDisplacementFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decimalOf(value: number): Decimal {
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a displacement: ${value}`);
  return parsed;
}
