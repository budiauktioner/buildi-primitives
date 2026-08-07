import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import { DataSize } from "../measurement/data-size.js";
import { DataSizeUnit } from "../measurement/data-size-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link StorageCapacity.format} and {@link StorageCapacity.normalize}. */
export interface StorageCapacityFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: DataSizeUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

/**
 * Storage capacity for hard drives, SSDs and USB drives (`lagringskapacitet`), e.g. `512 GB`
 * or `1 TB`. A bare number is read as gigabytes.
 */
export class StorageCapacity {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Storage Capacity",
    localizedName: "Lagringskapacitet",
    emoji: "💾",
    sources: Object.freeze([]),
  });

  /** The underlying data size. */
  readonly size: DataSize;

  /** Display form preserving the parsed unit, e.g. `512 GB`. */
  readonly value: string;

  private constructor(size: DataSize, displayValue?: string) {
    this.size = size;
    this.value = displayValue ?? size.toString();
  }

  get bytes(): number {
    return this.size.bytes;
  }

  get gigabytes(): number {
    return this.size.gigabytes;
  }

  get terabytes(): number {
    return this.size.terabytes;
  }

  /** Creates a capacity from a value and data size unit. The value must be positive. */
  static create(value: number | Decimal, unit: DataSizeUnit): StorageCapacity {
    const amount = value instanceof Decimal ? value : decimalOf(value);
    if (amount.compareTo(Decimal.zero) <= 0) throw new Error("Storage capacity must be positive.");
    return new StorageCapacity(DataSize.create(amount, unit));
  }

  static fromMegabytes(value: number | Decimal): StorageCapacity {
    return StorageCapacity.create(value, DataSizeUnit.Megabyte);
  }

  static fromGigabytes(value: number | Decimal): StorageCapacity {
    return StorageCapacity.create(value, DataSizeUnit.Gigabyte);
  }

  static fromTerabytes(value: number | Decimal): StorageCapacity {
    return StorageCapacity.create(value, DataSizeUnit.Terabyte);
  }

  static tryParse(input: string | null | undefined): StorageCapacity | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const bare = tryParseNumberOnly(trimmed);
    if (bare !== null) {
      if (bare.compareTo(Decimal.zero) <= 0) return null;
      return new StorageCapacity(DataSize.fromGigabytes(bare), `${formatQuantityDecimal(bare)} GB`);
    }

    const parsed = DataSize.tryParse(trimmed);
    if (parsed === null || parsed.bytes <= 0) return null;
    return new StorageCapacity(parsed);
  }

  static parse(input: string): StorageCapacity {
    const result = StorageCapacity.tryParse(input);
    if (result === null) throw new Error("Invalid storage capacity.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return StorageCapacity.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `512 GB`. Returns `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: StorageCapacityFormatOptions,
  ): string | null {
    const parsed = StorageCapacity.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.size.toStringInUnit(
          options.unit ?? parsed.size.originalUnit,
          options.decimals,
        );
      }
      return parsed.value;
    }
    return fallback(input, options);
  }

  /** Returns the value in bytes, e.g. `512000000000 B`. Returns `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: StorageCapacityFormatOptions,
  ): string | null {
    const parsed = StorageCapacity.tryParse(input);
    if (parsed !== null) return parsed.size.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && StorageCapacity.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.size.toNormalizedString();
  }

  toString(): string {
    return this.value;
  }

  /** Returns the value in the most readable unit, e.g. `512 GB` rather than `512000000000 B`. */
  toNaturalString(decimals?: number): string {
    return this.size.toNaturalString(decimals);
  }

  plus(other: StorageCapacity): StorageCapacity {
    return new StorageCapacity(this.size.plus(other.size));
  }

  minus(other: StorageCapacity): StorageCapacity {
    return new StorageCapacity(this.size.minus(other.size));
  }

  times(factor: number | Decimal): StorageCapacity {
    return new StorageCapacity(
      this.size.times(factor instanceof Decimal ? factor : decimalOf(factor)),
    );
  }

  dividedBy(divisor: number | Decimal): StorageCapacity {
    return new StorageCapacity(
      this.size.dividedBy(divisor instanceof Decimal ? divisor : decimalOf(divisor)),
    );
  }

  negated(): StorageCapacity {
    return new StorageCapacity(this.size.negated());
  }

  equals(other: StorageCapacity | null | undefined): boolean {
    return other != null && this.size.equals(other.size);
  }

  compareTo(other: StorageCapacity | null | undefined): number {
    if (other == null) return 1;
    return this.size.compareTo(other.size);
  }
}

function fallback(
  input: string | null | undefined,
  options?: StorageCapacityFormatOptions,
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
