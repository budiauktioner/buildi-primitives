import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { FrequencyUnit } from "./frequency-unit.js";

/** Options for {@link Frequency.format} and {@link Frequency.normalize}. */
export interface FrequencyFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: FrequencyUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:THz|GHz|MHz|kHz|Hz|rpm|rev/min|varv/min|r/min)\b`,
  "giu",
);

/**
 * A frequency stored internally in hertz,
 * parsed from any supported unit and convertible between all of them.
 */
export class Frequency extends Quantity<FrequencyUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Frequency",
    localizedName: "Frekvens",
    emoji: "📡",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<FrequencyUnit> {
    return FrequencyUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: FrequencyUnit): this {
    return new Frequency(baseValue, unit) as this;
  }

  get hertz(): number {
    return this.in(FrequencyUnit.Hertz);
  }
  get kilohertz(): number {
    return this.in(FrequencyUnit.Kilohertz);
  }
  get megahertz(): number {
    return this.in(FrequencyUnit.Megahertz);
  }
  get gigahertz(): number {
    return this.in(FrequencyUnit.Gigahertz);
  }
  get terahertz(): number {
    return this.in(FrequencyUnit.Terahertz);
  }
  get rpm(): number {
    return this.in(FrequencyUnit.RevolutionsPerMinute);
  }

  /** Creates a frequency from a value and unit. */
  static create(value: number | Decimal, unit: FrequencyUnit): Frequency {
    FrequencyUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Frequency.decimalOf(value);
    return new Frequency(unit.toBase(amount), unit);
  }

  static fromHertz(value: number | Decimal): Frequency {
    return Frequency.create(value, FrequencyUnit.Hertz);
  }
  static fromKilohertz(value: number | Decimal): Frequency {
    return Frequency.create(value, FrequencyUnit.Kilohertz);
  }
  static fromMegahertz(value: number | Decimal): Frequency {
    return Frequency.create(value, FrequencyUnit.Megahertz);
  }
  static fromGigahertz(value: number | Decimal): Frequency {
    return Frequency.create(value, FrequencyUnit.Gigahertz);
  }
  static fromTerahertz(value: number | Decimal): Frequency {
    return Frequency.create(value, FrequencyUnit.Terahertz);
  }
  static fromRpm(value: number | Decimal): Frequency {
    return Frequency.create(value, FrequencyUnit.RevolutionsPerMinute);
  }

  static tryParse(input: string | null | undefined): Frequency | null {
    const parsed = tryParseQuantity(input, FrequencyUnit.index);
    return parsed === null ? null : new Frequency(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Frequency {
    const result = Frequency.tryParse(input);
    if (result === null) throw new Error("Invalid frequency.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Frequency.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: FrequencyFormatOptions): string | null {
    const parsed = Frequency.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Frequency.fallback(input, options);
  }

  /** The value in hertz, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: FrequencyFormatOptions,
  ): string | null {
    const parsed = Frequency.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Frequency.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Frequency.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Frequency>[] {
    if (!text) return [];

    const out: TextCandidate<Frequency>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Frequency.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Frequency>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Frequency",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskFrequency(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: FrequencyFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a frequency: ${value}`);
    return parsed;
  }
}

/** Returns a masked frequency, e.g. `10 Hz` becomes `*** Hz`. */
export function maskFrequency(value: Frequency): string {
  return `*** ${value.originalUnit.symbol}`;
}
