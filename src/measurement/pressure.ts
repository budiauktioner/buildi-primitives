import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { PressureUnit } from "./pressure-unit.js";

/** Options for {@link Pressure.format} and {@link Pressure.normalize}. */
export interface PressureFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: PressureUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:GPa|MPa|kPa|hPa|mbar|mmHg|mm\s+Hg|lb/in²|atm|torr|bar|Pa|PSI)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A pressure stored internally in pascals,
 * parsed from any supported unit and convertible between all of them.
 */
export class Pressure extends Quantity<PressureUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Pressure",
    localizedName: "Tryck",
    emoji: "🎯",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<PressureUnit> {
    return PressureUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: PressureUnit): this {
    return new Pressure(baseValue, unit) as this;
  }

  get pascals(): number {
    return this.in(PressureUnit.Pascal);
  }
  get hectopascals(): number {
    return this.in(PressureUnit.Hectopascal);
  }
  get kilopascals(): number {
    return this.in(PressureUnit.Kilopascal);
  }
  get megapascals(): number {
    return this.in(PressureUnit.Megapascal);
  }
  get gigapascals(): number {
    return this.in(PressureUnit.Gigapascal);
  }
  get bars(): number {
    return this.in(PressureUnit.Bar);
  }
  get millibars(): number {
    return this.in(PressureUnit.Millibar);
  }
  get psi(): number {
    return this.in(PressureUnit.Psi);
  }
  get atmospheres(): number {
    return this.in(PressureUnit.Atmosphere);
  }
  get millimetersOfMercury(): number {
    return this.in(PressureUnit.MillimeterOfMercury);
  }

  /** Creates a pressure from a value and unit. */
  static create(value: number | Decimal, unit: PressureUnit): Pressure {
    PressureUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Pressure.decimalOf(value);
    return new Pressure(unit.toBase(amount), unit);
  }

  static fromPascals(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Pascal);
  }
  static fromHectopascals(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Hectopascal);
  }
  static fromKilopascals(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Kilopascal);
  }
  static fromMegapascals(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Megapascal);
  }
  static fromGigapascals(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Gigapascal);
  }
  static fromBars(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Bar);
  }
  static fromMillibars(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Millibar);
  }
  static fromPsi(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Psi);
  }
  static fromAtmospheres(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.Atmosphere);
  }
  static fromMillimetersOfMercury(value: number | Decimal): Pressure {
    return Pressure.create(value, PressureUnit.MillimeterOfMercury);
  }

  static tryParse(input: string | null | undefined): Pressure | null {
    const parsed = tryParseQuantity(input, PressureUnit.index);
    return parsed === null ? null : new Pressure(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Pressure {
    const result = Pressure.tryParse(input);
    if (result === null) throw new Error("Invalid pressure.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Pressure.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: PressureFormatOptions): string | null {
    const parsed = Pressure.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Pressure.fallback(input, options);
  }

  /** The value in pascals, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: PressureFormatOptions,
  ): string | null {
    const parsed = Pressure.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Pressure.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Pressure.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Pressure>[] {
    if (!text) return [];

    const out: TextCandidate<Pressure>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Pressure.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Pressure>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Pressure",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskPressure(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: PressureFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a pressure: ${value}`);
    return parsed;
  }
}

/** Returns a masked pressure, e.g. `10 Pa` becomes `*** Pa`. */
export function maskPressure(value: Pressure): string {
  return `*** ${value.originalUnit.symbol}`;
}
