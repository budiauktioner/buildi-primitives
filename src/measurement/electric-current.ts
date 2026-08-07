import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { ElectricCurrentUnit } from "./electric-current-unit.js";

/** Options for {@link ElectricCurrent.format} and {@link ElectricCurrent.normalize}. */
export interface ElectricCurrentFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: ElectricCurrentUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:µA|uA|mA|kA|A)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A electric current stored internally in amperes,
 * parsed from any supported unit and convertible between all of them.
 */
export class ElectricCurrent extends Quantity<ElectricCurrentUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Electric Current",
    localizedName: "Elektrisk ström",
    emoji: "⚡",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-base-units",
      "https://en.wikipedia.org/wiki/Ampere",
    ]),
  });

  protected get units(): MeasurementUnitIndex<ElectricCurrentUnit> {
    return ElectricCurrentUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: ElectricCurrentUnit): this {
    return new ElectricCurrent(baseValue, unit) as this;
  }

  get microamperes(): number {
    return this.in(ElectricCurrentUnit.Microampere);
  }
  get milliamperes(): number {
    return this.in(ElectricCurrentUnit.Milliampere);
  }
  get amperes(): number {
    return this.in(ElectricCurrentUnit.Ampere);
  }
  get kiloamperes(): number {
    return this.in(ElectricCurrentUnit.Kiloampere);
  }

  /** Creates a electric current from a value and unit. */
  static create(value: number | Decimal, unit: ElectricCurrentUnit): ElectricCurrent {
    ElectricCurrentUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : ElectricCurrent.decimalOf(value);
    return new ElectricCurrent(unit.toBase(amount), unit);
  }

  static fromMicroamperes(value: number | Decimal): ElectricCurrent {
    return ElectricCurrent.create(value, ElectricCurrentUnit.Microampere);
  }
  static fromMilliamperes(value: number | Decimal): ElectricCurrent {
    return ElectricCurrent.create(value, ElectricCurrentUnit.Milliampere);
  }
  static fromAmperes(value: number | Decimal): ElectricCurrent {
    return ElectricCurrent.create(value, ElectricCurrentUnit.Ampere);
  }
  static fromKiloamperes(value: number | Decimal): ElectricCurrent {
    return ElectricCurrent.create(value, ElectricCurrentUnit.Kiloampere);
  }

  static tryParse(input: string | null | undefined): ElectricCurrent | null {
    const parsed = tryParseQuantity(input, ElectricCurrentUnit.index);
    return parsed === null ? null : new ElectricCurrent(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): ElectricCurrent {
    const result = ElectricCurrent.tryParse(input);
    if (result === null) throw new Error("Invalid electric current.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ElectricCurrent.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: ElectricCurrentFormatOptions,
  ): string | null {
    const parsed = ElectricCurrent.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return ElectricCurrent.fallback(input, options);
  }

  /** The value in amperes, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: ElectricCurrentFormatOptions,
  ): string | null {
    const parsed = ElectricCurrent.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return ElectricCurrent.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ElectricCurrent.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<ElectricCurrent>[] {
    if (!text) return [];

    const out: TextCandidate<ElectricCurrent>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = ElectricCurrent.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<ElectricCurrent>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "ElectricCurrent",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskElectricCurrent(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: ElectricCurrentFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null)
      throw new Error(`Value cannot be represented as a electric current: ${value}`);
    return parsed;
  }
}

/** Returns a masked electric current, e.g. `10 A` becomes `*** A`. */
export function maskElectricCurrent(value: ElectricCurrent): string {
  return `*** ${value.originalUnit.symbol}`;
}
