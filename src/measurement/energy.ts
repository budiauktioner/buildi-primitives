import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { EnergyUnit } from "./energy-unit.js";

/** Options for {@link Energy.format} and {@link Energy.normalize}. */
export interface EnergyFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: EnergyUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:TWh|GWh|MWh|kWh|TJ|GJ|MJ|kJ|kcal|Wh|BTU|cal|J)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A energy stored internally in joules,
 * parsed from any supported unit and convertible between all of them.
 */
export class Energy extends Quantity<EnergyUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Energy",
    localizedName: "Energi",
    emoji: "⚡",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<EnergyUnit> {
    return EnergyUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: EnergyUnit): this {
    return new Energy(baseValue, unit) as this;
  }

  get joules(): number {
    return this.in(EnergyUnit.Joule);
  }
  get kilojoules(): number {
    return this.in(EnergyUnit.Kilojoule);
  }
  get megajoules(): number {
    return this.in(EnergyUnit.Megajoule);
  }
  get gigajoules(): number {
    return this.in(EnergyUnit.Gigajoule);
  }
  get terajoules(): number {
    return this.in(EnergyUnit.Terajoule);
  }
  get wattHours(): number {
    return this.in(EnergyUnit.WattHour);
  }
  get kilowattHours(): number {
    return this.in(EnergyUnit.KilowattHour);
  }
  get megawattHours(): number {
    return this.in(EnergyUnit.MegawattHour);
  }
  get gigawattHours(): number {
    return this.in(EnergyUnit.GigawattHour);
  }
  get terawattHours(): number {
    return this.in(EnergyUnit.TerawattHour);
  }
  get calories(): number {
    return this.in(EnergyUnit.Calorie);
  }
  get kilocalories(): number {
    return this.in(EnergyUnit.Kilocalorie);
  }
  get btus(): number {
    return this.in(EnergyUnit.Btu);
  }

  /** Creates a energy from a value and unit. */
  static create(value: number | Decimal, unit: EnergyUnit): Energy {
    EnergyUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Energy.decimalOf(value);
    return new Energy(unit.toBase(amount), unit);
  }

  static fromJoules(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Joule);
  }
  static fromKilojoules(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Kilojoule);
  }
  static fromMegajoules(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Megajoule);
  }
  static fromGigajoules(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Gigajoule);
  }
  static fromTerajoules(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Terajoule);
  }
  static fromWattHours(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.WattHour);
  }
  static fromKilowattHours(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.KilowattHour);
  }
  static fromMegawattHours(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.MegawattHour);
  }
  static fromGigawattHours(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.GigawattHour);
  }
  static fromTerawattHours(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.TerawattHour);
  }
  static fromCalories(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Calorie);
  }
  static fromKilocalories(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Kilocalorie);
  }
  static fromBtus(value: number | Decimal): Energy {
    return Energy.create(value, EnergyUnit.Btu);
  }

  static tryParse(input: string | null | undefined): Energy | null {
    const parsed = tryParseQuantity(input, EnergyUnit.index);
    return parsed === null ? null : new Energy(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Energy {
    const result = Energy.tryParse(input);
    if (result === null) throw new Error("Invalid energy.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Energy.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: EnergyFormatOptions): string | null {
    const parsed = Energy.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Energy.fallback(input, options);
  }

  /** The value in joules, or `null` when the input is invalid. */
  static normalize(input: string | null | undefined, options?: EnergyFormatOptions): string | null {
    const parsed = Energy.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Energy.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Energy.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Energy>[] {
    if (!text) return [];

    const out: TextCandidate<Energy>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Energy.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Energy>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Energy",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskEnergy(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: EnergyFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a energy: ${value}`);
    return parsed;
  }
}

/** Returns a masked energy, e.g. `10 J` becomes `*** J`. */
export function maskEnergy(value: Energy): string {
  return `*** ${value.originalUnit.symbol}`;
}
