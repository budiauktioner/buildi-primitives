import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ElectricChargeUnit } from "./electric-charge-unit.js";

/** Options for {@link ElectricCharge.format} and {@link ElectricCharge.normalize}. */
export interface ElectricChargeFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: ElectricChargeUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:mAh|Ah|C)\b`,
  "giu",
);

/**
 * A electric charge stored internally in ampere-hours,
 * parsed from any supported unit and convertible between all of them.
 */
export class ElectricCharge extends Quantity<ElectricChargeUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Electric Charge",
    localizedName: "Elektrisk laddning",
    emoji: "🔋",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Ampere-hour",
    ]),
  });

  protected get units(): MeasurementUnitIndex<ElectricChargeUnit> {
    return ElectricChargeUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: ElectricChargeUnit): this {
    return new ElectricCharge(baseValue, unit) as this;
  }

  get milliampereHours(): number {
    return this.in(ElectricChargeUnit.MilliampereHour);
  }
  get ampereHours(): number {
    return this.in(ElectricChargeUnit.AmpereHour);
  }
  get coulombs(): number {
    return this.in(ElectricChargeUnit.Coulomb);
  }

  /** Creates a electric charge from a value and unit. */
  static create(value: number | Decimal, unit: ElectricChargeUnit): ElectricCharge {
    ElectricChargeUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : ElectricCharge.decimalOf(value);
    return new ElectricCharge(unit.toBase(amount), unit);
  }

  static fromMilliampereHours(value: number | Decimal): ElectricCharge {
    return ElectricCharge.create(value, ElectricChargeUnit.MilliampereHour);
  }
  static fromAmpereHours(value: number | Decimal): ElectricCharge {
    return ElectricCharge.create(value, ElectricChargeUnit.AmpereHour);
  }
  static fromCoulombs(value: number | Decimal): ElectricCharge {
    return ElectricCharge.create(value, ElectricChargeUnit.Coulomb);
  }

  static tryParse(input: string | null | undefined): ElectricCharge | null {
    const parsed = tryParseQuantity(input, ElectricChargeUnit.index);
    return parsed === null ? null : new ElectricCharge(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): ElectricCharge {
    const result = ElectricCharge.tryParse(input);
    if (result === null) throw new Error("Invalid electric charge.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ElectricCharge.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: ElectricChargeFormatOptions,
  ): string | null {
    const parsed = ElectricCharge.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return ElectricCharge.fallback(input, options);
  }

  /** The value in ampere-hours, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: ElectricChargeFormatOptions,
  ): string | null {
    const parsed = ElectricCharge.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return ElectricCharge.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ElectricCharge.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<ElectricCharge>[] {
    if (!text) return [];

    const out: TextCandidate<ElectricCharge>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = ElectricCharge.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<ElectricCharge>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "ElectricCharge",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskElectricCharge(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: ElectricChargeFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null)
      throw new Error(`Value cannot be represented as a electric charge: ${value}`);
    return parsed;
  }
}

/** Returns a masked electric charge, e.g. `10 Ah` becomes `*** Ah`. */
export function maskElectricCharge(value: ElectricCharge): string {
  return `*** ${value.originalUnit.symbol}`;
}
