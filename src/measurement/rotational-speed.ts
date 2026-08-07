import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { RotationalSpeedUnit } from "./rotational-speed-unit.js";

/** Options for {@link RotationalSpeed.format} and {@link RotationalSpeed.normalize}. */
export interface RotationalSpeedFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: RotationalSpeedUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:rpm|r/min|rev/min|varv/min|rps|r/s|rev/s|varv/s|rad/s(?:ec)?)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A rotational speed stored internally in revolutions per minute,
 * parsed from any supported unit and convertible between all of them.
 */
export class RotationalSpeed extends Quantity<RotationalSpeedUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Rotational Speed",
    localizedName: "Varvtal",
    emoji: "🔄",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Revolutions_per_minute",
      "https://www.bipm.org/en/measurement-units/si-derived-units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<RotationalSpeedUnit> {
    return RotationalSpeedUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: RotationalSpeedUnit): this {
    return new RotationalSpeed(baseValue, unit) as this;
  }

  get rpm(): number {
    return this.in(RotationalSpeedUnit.Rpm);
  }
  get rps(): number {
    return this.in(RotationalSpeedUnit.Rps);
  }
  get radiansPerSecond(): number {
    return this.in(RotationalSpeedUnit.RadiansPerSecond);
  }

  /** Creates a rotational speed from a value and unit. */
  static create(value: number | Decimal, unit: RotationalSpeedUnit): RotationalSpeed {
    RotationalSpeedUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : RotationalSpeed.decimalOf(value);
    return new RotationalSpeed(unit.toBase(amount), unit);
  }

  static fromRpm(value: number | Decimal): RotationalSpeed {
    return RotationalSpeed.create(value, RotationalSpeedUnit.Rpm);
  }
  static fromRps(value: number | Decimal): RotationalSpeed {
    return RotationalSpeed.create(value, RotationalSpeedUnit.Rps);
  }
  static fromRadiansPerSecond(value: number | Decimal): RotationalSpeed {
    return RotationalSpeed.create(value, RotationalSpeedUnit.RadiansPerSecond);
  }

  /** A bare number is read as rpm, the unit rotational speed is usually quoted in. */
  static tryParse(input: string | null | undefined): RotationalSpeed | null {
    const bare = tryParseNumberOnly(input);
    if (bare !== null) return new RotationalSpeed(bare, RotationalSpeedUnit.Rpm);

    const parsed = tryParseQuantity(input, RotationalSpeedUnit.index);
    return parsed === null ? null : new RotationalSpeed(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): RotationalSpeed {
    const result = RotationalSpeed.tryParse(input);
    if (result === null) throw new Error("Invalid rotational speed.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return RotationalSpeed.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: RotationalSpeedFormatOptions,
  ): string | null {
    const parsed = RotationalSpeed.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return RotationalSpeed.fallback(input, options);
  }

  /** The value in revolutions per minute, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: RotationalSpeedFormatOptions,
  ): string | null {
    const parsed = RotationalSpeed.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return RotationalSpeed.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && RotationalSpeed.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<RotationalSpeed>[] {
    if (!text) return [];

    const out: TextCandidate<RotationalSpeed>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = RotationalSpeed.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<RotationalSpeed>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "RotationalSpeed",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskRotationalSpeed(value),
          confidence: TextMatchConfidence.Low,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: RotationalSpeedFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null)
      throw new Error(`Value cannot be represented as a rotational speed: ${value}`);
    return parsed;
  }
}

/** Returns a masked rotational speed, e.g. `10 rpm` becomes `*** rpm`. */
export function maskRotationalSpeed(value: RotationalSpeed): string {
  return `*** ${value.originalUnit.symbol}`;
}
