import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { LuminanceUnit } from "./luminance-unit.js";

/** Options for {@link Luminance.format} and {@link Luminance.normalize}. */
export interface LuminanceFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: LuminanceUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:kcd/m²|kcd/m2|cd/m²|cd/m2|knits?|nits?)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A luminance stored internally in candela per square metre,
 * parsed from any supported unit and convertible between all of them.
 */
export class Luminance extends Quantity<LuminanceUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Luminance",
    localizedName: "Luminans",
    emoji: "🔆",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Luminance",
      "https://en.wikipedia.org/wiki/Candela_per_square_metre",
    ]),
  });

  protected get units(): MeasurementUnitIndex<LuminanceUnit> {
    return LuminanceUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: LuminanceUnit): this {
    return new Luminance(baseValue, unit) as this;
  }

  get candelaPerSquareMetre(): number {
    return this.in(LuminanceUnit.CandelaPerSquareMetre);
  }
  get nits(): number {
    return this.in(LuminanceUnit.Nit);
  }
  get kilocandelaPerSquareMetre(): number {
    return this.in(LuminanceUnit.KilocandelaPerSquareMetre);
  }

  /** Creates a luminance from a value and unit. */
  static create(value: number | Decimal, unit: LuminanceUnit): Luminance {
    LuminanceUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Luminance.decimalOf(value);
    return new Luminance(unit.toBase(amount), unit);
  }

  static fromCandelaPerSquareMetre(value: number | Decimal): Luminance {
    return Luminance.create(value, LuminanceUnit.CandelaPerSquareMetre);
  }
  static fromNits(value: number | Decimal): Luminance {
    return Luminance.create(value, LuminanceUnit.Nit);
  }
  static fromKilocandelaPerSquareMetre(value: number | Decimal): Luminance {
    return Luminance.create(value, LuminanceUnit.KilocandelaPerSquareMetre);
  }

  /**
   * A bare number is read as candela per square metre, since screen brightness
   * is quoted that way. Negative luminance is rejected.
   */
  static tryParse(input: string | null | undefined): Luminance | null {
    const bare = tryParseNumberOnly(input);
    if (bare !== null) {
      if (bare.isNegative) return null;
      return new Luminance(bare, LuminanceUnit.CandelaPerSquareMetre);
    }

    const parsed = tryParseQuantity(input, LuminanceUnit.index);
    return parsed === null ? null : new Luminance(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Luminance {
    const result = Luminance.tryParse(input);
    if (result === null) throw new Error("Invalid luminance.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Luminance.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: LuminanceFormatOptions): string | null {
    const parsed = Luminance.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Luminance.fallback(input, options);
  }

  /** The value in candela per square metre, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: LuminanceFormatOptions,
  ): string | null {
    const parsed = Luminance.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Luminance.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Luminance.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Luminance>[] {
    if (!text) return [];

    const out: TextCandidate<Luminance>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Luminance.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Luminance>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Luminance",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskLuminance(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: LuminanceFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a luminance: ${value}`);
    return parsed;
  }
}

/** Returns a masked luminance, e.g. `10 cd/m²` becomes `*** cd/m²`. */
export function maskLuminance(value: Luminance): string {
  return `*** ${value.originalUnit.symbol}`;
}
