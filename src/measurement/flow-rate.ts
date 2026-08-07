import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { FlowRateUnit } from "./flow-rate-unit.js";

/** Options for {@link FlowRate.format} and {@link FlowRate.normalize}. */
export interface FlowRateFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: FlowRateUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:m[³3]/(?:h|min|tim)|l/(?:s|min|h|timme)|gal/min|gpm)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A flow rate stored internally in liters per minute,
 * parsed from any supported unit and convertible between all of them.
 */
export class FlowRate extends Quantity<FlowRateUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Flow Rate",
    localizedName: "Flöde",
    emoji: "🌊",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Volumetric_flow_rate"]),
  });

  protected get units(): MeasurementUnitIndex<FlowRateUnit> {
    return FlowRateUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: FlowRateUnit): this {
    return new FlowRate(baseValue, unit) as this;
  }

  get litersPerSecond(): number {
    return this.in(FlowRateUnit.LitersPerSecond);
  }
  get litersPerMinute(): number {
    return this.in(FlowRateUnit.LitersPerMinute);
  }
  get litersPerHour(): number {
    return this.in(FlowRateUnit.LitersPerHour);
  }
  get cubicMetersPerHour(): number {
    return this.in(FlowRateUnit.CubicMetersPerHour);
  }
  get cubicMetersPerMinute(): number {
    return this.in(FlowRateUnit.CubicMetersPerMinute);
  }
  get gallonsPerMinute(): number {
    return this.in(FlowRateUnit.GallonsPerMinute);
  }

  /** Creates a flow rate from a value and unit. */
  static create(value: number | Decimal, unit: FlowRateUnit): FlowRate {
    FlowRateUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : FlowRate.decimalOf(value);
    return new FlowRate(unit.toBase(amount), unit);
  }

  static fromLitersPerSecond(value: number | Decimal): FlowRate {
    return FlowRate.create(value, FlowRateUnit.LitersPerSecond);
  }
  static fromLitersPerMinute(value: number | Decimal): FlowRate {
    return FlowRate.create(value, FlowRateUnit.LitersPerMinute);
  }
  static fromLitersPerHour(value: number | Decimal): FlowRate {
    return FlowRate.create(value, FlowRateUnit.LitersPerHour);
  }
  static fromCubicMetersPerHour(value: number | Decimal): FlowRate {
    return FlowRate.create(value, FlowRateUnit.CubicMetersPerHour);
  }
  static fromCubicMetersPerMinute(value: number | Decimal): FlowRate {
    return FlowRate.create(value, FlowRateUnit.CubicMetersPerMinute);
  }
  static fromGallonsPerMinute(value: number | Decimal): FlowRate {
    return FlowRate.create(value, FlowRateUnit.GallonsPerMinute);
  }

  static tryParse(input: string | null | undefined): FlowRate | null {
    const parsed = tryParseQuantity(input, FlowRateUnit.index);
    return parsed === null ? null : new FlowRate(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): FlowRate {
    const result = FlowRate.tryParse(input);
    if (result === null) throw new Error("Invalid flow rate.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return FlowRate.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: FlowRateFormatOptions): string | null {
    const parsed = FlowRate.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return FlowRate.fallback(input, options);
  }

  /** The value in liters per minute, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: FlowRateFormatOptions,
  ): string | null {
    const parsed = FlowRate.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return FlowRate.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && FlowRate.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<FlowRate>[] {
    if (!text) return [];

    const out: TextCandidate<FlowRate>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = FlowRate.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<FlowRate>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "FlowRate",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskFlowRate(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: FlowRateFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a flow rate: ${value}`);
    return parsed;
  }
}

/** Returns a masked flow rate, e.g. `10 L/min` becomes `*** L/min`. */
export function maskFlowRate(value: FlowRate): string {
  return `*** ${value.originalUnit.symbol}`;
}
