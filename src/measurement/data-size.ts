import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { DataSizeUnit } from "./data-size-unit.js";

/** Options for {@link DataSize.format} and {@link DataSize.normalize}. */
export interface DataSizeFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: DataSizeUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:exbibytes|exbibyte|exabytes|exabyte|pebibytes|pebibyte|petabytes|petabyte|tebibytes|tebibyte|terabytes|terabyte|gibibytes|gibibyte|gigabytes|gigabyte|mebibytes|mebibyte|megabytes|megabyte|kibibytes|kibibyte|kilobytes|kilobyte|EiB|PiB|TiB|GiB|MiB|KiB|EB|PB|TB|GB|MB|KB|bytes|byte|B)\b`,
  "giu",
);

/**
 * A data size stored internally in bytes,
 * parsed from any supported unit and convertible between all of them.
 */
export class DataSize extends Quantity<DataSizeUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Data Size",
    localizedName: "Datastorlek",
    emoji: "💾",
    sources: Object.freeze([
      "https://www.bipm.org/en/publications/si-brochure",
      "https://www.iec.ch/standardsonline/iec-standard/iec-60027-2",
    ]),
  });

  protected get units(): MeasurementUnitIndex<DataSizeUnit> {
    return DataSizeUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: DataSizeUnit): this {
    return new DataSize(baseValue, unit) as this;
  }

  get bytes(): number {
    return this.in(DataSizeUnit.Byte);
  }
  get kilobytes(): number {
    return this.in(DataSizeUnit.Kilobyte);
  }
  get megabytes(): number {
    return this.in(DataSizeUnit.Megabyte);
  }
  get gigabytes(): number {
    return this.in(DataSizeUnit.Gigabyte);
  }
  get terabytes(): number {
    return this.in(DataSizeUnit.Terabyte);
  }
  get petabytes(): number {
    return this.in(DataSizeUnit.Petabyte);
  }
  get exabytes(): number {
    return this.in(DataSizeUnit.Exabyte);
  }
  get kibibytes(): number {
    return this.in(DataSizeUnit.Kibibyte);
  }
  get mebibytes(): number {
    return this.in(DataSizeUnit.Mebibyte);
  }
  get gibibytes(): number {
    return this.in(DataSizeUnit.Gibibyte);
  }
  get tebibytes(): number {
    return this.in(DataSizeUnit.Tebibyte);
  }
  get pebibytes(): number {
    return this.in(DataSizeUnit.Pebibyte);
  }
  get exbibytes(): number {
    return this.in(DataSizeUnit.Exbibyte);
  }

  /** Creates a data size from a value and unit. */
  static create(value: number | Decimal, unit: DataSizeUnit): DataSize {
    DataSizeUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : DataSize.decimalOf(value);
    return new DataSize(unit.toBase(amount), unit);
  }

  static fromBytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Byte);
  }
  static fromKilobytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Kilobyte);
  }
  static fromMegabytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Megabyte);
  }
  static fromGigabytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Gigabyte);
  }
  static fromTerabytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Terabyte);
  }
  static fromPetabytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Petabyte);
  }
  static fromExabytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Exabyte);
  }
  static fromKibibytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Kibibyte);
  }
  static fromMebibytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Mebibyte);
  }
  static fromGibibytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Gibibyte);
  }
  static fromTebibytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Tebibyte);
  }
  static fromPebibytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Pebibyte);
  }
  static fromExbibytes(value: number | Decimal): DataSize {
    return DataSize.create(value, DataSizeUnit.Exbibyte);
  }

  static tryParse(input: string | null | undefined): DataSize | null {
    const parsed = tryParseQuantity(input, DataSizeUnit.index);
    return parsed === null ? null : new DataSize(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): DataSize {
    const result = DataSize.tryParse(input);
    if (result === null) throw new Error("Invalid data size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return DataSize.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: DataSizeFormatOptions): string | null {
    const parsed = DataSize.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return DataSize.fallback(input, options);
  }

  /** The value in bytes, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: DataSizeFormatOptions,
  ): string | null {
    const parsed = DataSize.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return DataSize.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && DataSize.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<DataSize>[] {
    if (!text) return [];

    const out: TextCandidate<DataSize>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = DataSize.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<DataSize>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "DataSize",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskDataSize(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: DataSizeFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a data size: ${value}`);
    return parsed;
  }
}

/** Returns a masked data size, e.g. `10 B` becomes `*** B`. */
export function maskDataSize(value: DataSize): string {
  return `*** ${value.originalUnit.symbol}`;
}
