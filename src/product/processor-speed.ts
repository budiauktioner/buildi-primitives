import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import { Frequency } from "../measurement/frequency.js";
import { FrequencyUnit } from "../measurement/frequency-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link ProcessorSpeed.format} and {@link ProcessorSpeed.normalize}. */
export interface ProcessorSpeedFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: FrequencyUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

/**
 * Processor clock speed (`processorhastighet`), e.g. `3.5 GHz` or `800 MHz`. A bare number is
 * read as gigahertz.
 */
export class ProcessorSpeed {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Processor Speed",
    localizedName: "Processorhastighet",
    emoji: "💻",
    sources: Object.freeze([]),
  });

  /** The underlying frequency. */
  readonly speed: Frequency;

  /** Display form preserving the parsed unit, e.g. `3.5 GHz`. */
  readonly value: string;

  private constructor(speed: Frequency, displayValue?: string) {
    this.speed = speed;
    this.value = displayValue ?? speed.toString();
  }

  get hertz(): number {
    return this.speed.hertz;
  }

  get megahertz(): number {
    return this.speed.megahertz;
  }

  get gigahertz(): number {
    return this.speed.gigahertz;
  }

  /** Creates a speed from a value and frequency unit. The value must be positive. */
  static create(value: number | Decimal, unit: FrequencyUnit): ProcessorSpeed {
    const amount = value instanceof Decimal ? value : decimalOf(value);
    if (amount.compareTo(Decimal.zero) <= 0) throw new Error("Processor speed must be positive.");
    return new ProcessorSpeed(Frequency.create(amount, unit));
  }

  static fromMegahertz(value: number | Decimal): ProcessorSpeed {
    return ProcessorSpeed.create(value, FrequencyUnit.Megahertz);
  }

  static fromGigahertz(value: number | Decimal): ProcessorSpeed {
    return ProcessorSpeed.create(value, FrequencyUnit.Gigahertz);
  }

  static tryParse(input: string | null | undefined): ProcessorSpeed | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const bare = tryParseNumberOnly(trimmed);
    if (bare !== null) {
      if (bare.compareTo(Decimal.zero) <= 0) return null;
      return new ProcessorSpeed(
        Frequency.fromGigahertz(bare),
        `${formatQuantityDecimal(bare)} GHz`,
      );
    }

    const parsed = Frequency.tryParse(trimmed);
    if (parsed === null || parsed.hertz <= 0) return null;
    return new ProcessorSpeed(parsed);
  }

  static parse(input: string): ProcessorSpeed {
    const result = ProcessorSpeed.tryParse(input);
    if (result === null) throw new Error("Invalid processor speed.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ProcessorSpeed.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `3.5 GHz`. Returns `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: ProcessorSpeedFormatOptions,
  ): string | null {
    const parsed = ProcessorSpeed.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.speed.toStringInUnit(
          options.unit ?? parsed.speed.originalUnit,
          options.decimals,
        );
      }
      return parsed.value;
    }
    return fallback(input, options);
  }

  /** Returns the value in hertz, e.g. `3500000000 Hz`. Returns `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: ProcessorSpeedFormatOptions,
  ): string | null {
    const parsed = ProcessorSpeed.tryParse(input);
    if (parsed !== null) return parsed.speed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ProcessorSpeed.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.speed.toNormalizedString();
  }

  toString(): string {
    return this.value;
  }

  /** Returns the value in the most readable unit, e.g. `3.5 GHz` rather than `3500000000 Hz`. */
  toNaturalString(decimals?: number): string {
    return this.speed.toNaturalString(decimals);
  }

  plus(other: ProcessorSpeed): ProcessorSpeed {
    return new ProcessorSpeed(this.speed.plus(other.speed));
  }

  minus(other: ProcessorSpeed): ProcessorSpeed {
    return new ProcessorSpeed(this.speed.minus(other.speed));
  }

  times(factor: number | Decimal): ProcessorSpeed {
    return new ProcessorSpeed(this.speed.times(factor instanceof Decimal ? factor : decimalOf(factor)));
  }

  dividedBy(divisor: number | Decimal): ProcessorSpeed {
    return new ProcessorSpeed(
      this.speed.dividedBy(divisor instanceof Decimal ? divisor : decimalOf(divisor)),
    );
  }

  negated(): ProcessorSpeed {
    return new ProcessorSpeed(this.speed.negated());
  }

  equals(other: ProcessorSpeed | null | undefined): boolean {
    return other != null && this.speed.equals(other.speed);
  }

  compareTo(other: ProcessorSpeed | null | undefined): number {
    if (other == null) return 1;
    return this.speed.compareTo(other.speed);
  }
}

function fallback(
  input: string | null | undefined,
  options?: ProcessorSpeedFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decimalOf(value: number): Decimal {
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a speed: ${value}`);
  return parsed;
}
