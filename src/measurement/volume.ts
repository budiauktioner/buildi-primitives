import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { VolumeUnit } from "./volume-unit.js";

/** Options for {@link Volume.format} and {@link Volume.normalize}. */
export interface VolumeFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: VolumeUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:kubikmeter|hektoliter|mikroliter|vätskeans|fluid\s+ounces?|fl\s*oz|gallons?|microliters?|milliliters?|centiliters?|deciliters?|hectoliters?|liters?|cubic\s+meters?|koppar|kopp|cups?|pints?|m³|m3|cbm|µL|µl|ul|ml|cl|dl|hL|hl|gal|pt|l)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A volume stored internally in liters,
 * parsed from any supported unit and convertible between all of them.
 */
export class Volume extends Quantity<VolumeUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Volume",
    localizedName: "Volym",
    emoji: "🧪",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<VolumeUnit> {
    return VolumeUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: VolumeUnit): this {
    return new Volume(baseValue, unit) as this;
  }

  get microliters(): number {
    return this.in(VolumeUnit.Microliter);
  }
  get milliliters(): number {
    return this.in(VolumeUnit.Milliliter);
  }
  get centiliters(): number {
    return this.in(VolumeUnit.Centiliter);
  }
  get deciliters(): number {
    return this.in(VolumeUnit.Deciliter);
  }
  get liters(): number {
    return this.in(VolumeUnit.Liter);
  }
  get hectoliters(): number {
    return this.in(VolumeUnit.Hectoliter);
  }
  get cubicMeters(): number {
    return this.in(VolumeUnit.CubicMeter);
  }
  get gallons(): number {
    return this.in(VolumeUnit.Gallon);
  }
  get pints(): number {
    return this.in(VolumeUnit.Pint);
  }
  get fluidOunces(): number {
    return this.in(VolumeUnit.FluidOunce);
  }
  get cups(): number {
    return this.in(VolumeUnit.Cup);
  }

  /** Creates a volume from a value and unit. */
  static create(value: number | Decimal, unit: VolumeUnit): Volume {
    VolumeUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Volume.decimalOf(value);
    return new Volume(unit.toBase(amount), unit);
  }

  static fromMicroliters(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Microliter);
  }
  static fromMilliliters(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Milliliter);
  }
  static fromCentiliters(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Centiliter);
  }
  static fromDeciliters(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Deciliter);
  }
  static fromLiters(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Liter);
  }
  static fromHectoliters(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Hectoliter);
  }
  static fromCubicMeters(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.CubicMeter);
  }
  static fromGallons(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Gallon);
  }
  static fromPints(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Pint);
  }
  static fromFluidOunces(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.FluidOunce);
  }
  static fromCups(value: number | Decimal): Volume {
    return Volume.create(value, VolumeUnit.Cup);
  }

  static tryParse(input: string | null | undefined): Volume | null {
    const parsed = tryParseQuantity(input, VolumeUnit.index);
    return parsed === null ? null : new Volume(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Volume {
    const result = Volume.tryParse(input);
    if (result === null) throw new Error("Invalid volume.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Volume.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: VolumeFormatOptions): string | null {
    const parsed = Volume.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Volume.fallback(input, options);
  }

  /** The value in liters, or `null` when the input is invalid. */
  static normalize(input: string | null | undefined, options?: VolumeFormatOptions): string | null {
    const parsed = Volume.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Volume.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Volume.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Volume>[] {
    if (!text) return [];

    const out: TextCandidate<Volume>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Volume.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Volume>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Volume",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskVolume(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: VolumeFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a volume: ${value}`);
    return parsed;
  }
}

/** Returns a masked volume, e.g. `10 L` becomes `*** L`. */
export function maskVolume(value: Volume): string {
  return `*** ${value.originalUnit.symbol}`;
}
