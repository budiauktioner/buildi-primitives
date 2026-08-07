import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { WeightUnit } from "./weight-unit.js";

/** Options for {@link Weight.format} and {@link Weight.normalize}. */
export interface WeightFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: WeightUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:metric\s+ton|microgram|milligram|hectogram|hektogram|kilogram|gram|tonne|ton|ounces|ounce|pounds|pound|stones|stone|hekto|lbs|lb|µg|ug|mg|hg|kg|g|oz|st|t|pund|uns)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A weight stored internally in kilograms,
 * parsed from any supported unit and convertible between all of them.
 */
export class Weight extends Quantity<WeightUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Weight",
    localizedName: "Vikt",
    emoji: "⚖️",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-base-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<WeightUnit> {
    return WeightUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: WeightUnit): this {
    return new Weight(baseValue, unit) as this;
  }

  get micrograms(): number {
    return this.in(WeightUnit.Microgram);
  }
  get milligrams(): number {
    return this.in(WeightUnit.Milligram);
  }
  get grams(): number {
    return this.in(WeightUnit.Gram);
  }
  get hectograms(): number {
    return this.in(WeightUnit.Hectogram);
  }
  get kilograms(): number {
    return this.in(WeightUnit.Kilogram);
  }
  get metricTons(): number {
    return this.in(WeightUnit.MetricTon);
  }
  get pounds(): number {
    return this.in(WeightUnit.Pound);
  }
  get ounces(): number {
    return this.in(WeightUnit.Ounce);
  }
  get stones(): number {
    return this.in(WeightUnit.Stone);
  }

  /** Creates a weight from a value and unit. */
  static create(value: number | Decimal, unit: WeightUnit): Weight {
    WeightUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Weight.decimalOf(value);
    return new Weight(unit.toBase(amount), unit);
  }

  static fromMicrograms(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Microgram);
  }
  static fromMilligrams(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Milligram);
  }
  static fromGrams(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Gram);
  }
  static fromHectograms(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Hectogram);
  }
  static fromKilograms(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Kilogram);
  }
  static fromMetricTons(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.MetricTon);
  }
  static fromPounds(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Pound);
  }
  static fromOunces(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Ounce);
  }
  static fromStones(value: number | Decimal): Weight {
    return Weight.create(value, WeightUnit.Stone);
  }

  static tryParse(input: string | null | undefined): Weight | null {
    const parsed = tryParseQuantity(input, WeightUnit.index);
    return parsed === null ? null : new Weight(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Weight {
    const result = Weight.tryParse(input);
    if (result === null) throw new Error("Invalid weight.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Weight.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: WeightFormatOptions): string | null {
    const parsed = Weight.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Weight.fallback(input, options);
  }

  /** The value in kilograms, or `null` when the input is invalid. */
  static normalize(input: string | null | undefined, options?: WeightFormatOptions): string | null {
    const parsed = Weight.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Weight.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Weight.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Weight>[] {
    if (!text) return [];

    const out: TextCandidate<Weight>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Weight.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Weight>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Weight",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskWeight(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: WeightFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a weight: ${value}`);
    return parsed;
  }
}

/** Returns a masked weight, e.g. `10 kg` becomes `*** kg`. */
export function maskWeight(value: Weight): string {
  return `*** ${value.originalUnit.symbol}`;
}
