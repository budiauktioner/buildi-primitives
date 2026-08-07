import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { PowerUnit } from "./power-unit.js";

/** Options for {@link Power.format} and {@link Power.normalize}. */
export interface PowerFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: PowerUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const VALUE_PREFIX = String.raw`(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*`;

/**
 * Milliwatt and megawatt differ only by case, so their symbols must be matched
 * case-sensitively. Everything else may be written either way.
 *
 * .NET expresses this as one pattern with a scoped `(?i:...)` group. JavaScript
 * has no scoped flags, so the two halves are separate patterns and
 * {@link Power.findCandidatesInText} merges their results.
 */
const CASE_SENSITIVE_PATTERN = new RegExp(String.raw`${VALUE_PREFIX}(?:µW|uW|mW|MW|TW)\b`, "gu");

const CASE_INSENSITIVE_PATTERN = new RegExp(
  String.raw`${VALUE_PREFIX}(?:kW|GW|W|hp|horsepower|hästkraft|hästkrafter|microwatt|mikrowatt|milliwatt|megawatt|gigawatt|terawatt|kilowatt|watt)\b`,
  "giu",
);

/**
 * A power stored internally in watts,
 * parsed from any supported unit and convertible between all of them.
 */
export class Power extends Quantity<PowerUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Power",
    localizedName: "Effekt",
    emoji: "💡",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Horsepower",
    ]),
  });

  protected get units(): MeasurementUnitIndex<PowerUnit> {
    return PowerUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: PowerUnit): this {
    return new Power(baseValue, unit) as this;
  }

  get microwatts(): number {
    return this.in(PowerUnit.Microwatt);
  }
  get milliwatts(): number {
    return this.in(PowerUnit.Milliwatt);
  }
  get watts(): number {
    return this.in(PowerUnit.Watt);
  }
  get kilowatts(): number {
    return this.in(PowerUnit.Kilowatt);
  }
  get megawatts(): number {
    return this.in(PowerUnit.Megawatt);
  }
  get gigawatts(): number {
    return this.in(PowerUnit.Gigawatt);
  }
  get terawatts(): number {
    return this.in(PowerUnit.Terawatt);
  }
  get horsepower(): number {
    return this.in(PowerUnit.Horsepower);
  }

  /** Creates a power from a value and unit. */
  static create(value: number | Decimal, unit: PowerUnit): Power {
    const amount = value instanceof Decimal ? value : Power.decimalOf(value);
    return new Power(unit.toBase(amount), unit);
  }

  static fromMicrowatts(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Microwatt);
  }
  static fromMilliwatts(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Milliwatt);
  }
  static fromWatts(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Watt);
  }
  static fromKilowatts(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Kilowatt);
  }
  static fromMegawatts(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Megawatt);
  }
  static fromGigawatts(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Gigawatt);
  }
  static fromTerawatts(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Terawatt);
  }
  static fromHorsepower(value: number | Decimal): Power {
    return Power.create(value, PowerUnit.Horsepower);
  }

  static tryParse(input: string | null | undefined): Power | null {
    const parsed = tryParseQuantity(input, PowerUnit.index, PowerUnit.tryParse);
    return parsed === null ? null : new Power(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Power {
    const result = Power.tryParse(input);
    if (result === null) throw new Error("Invalid power.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Power.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: PowerFormatOptions): string | null {
    const parsed = Power.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Power.fallback(input, options);
  }

  /** The value in watts, or `null` when the input is invalid. */
  static normalize(input: string | null | undefined, options?: PowerFormatOptions): string | null {
    const parsed = Power.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Power.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Power.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Power>[] {
    if (!text) return [];

    const out: TextCandidate<Power>[] = [];

    // The case-sensitive symbols run first so that `mW` and `MW` win over the
    // looser `W`, mirroring the alternation order in the .NET pattern.
    for (const pattern of [CASE_SENSITIVE_PATTERN, CASE_INSENSITIVE_PATTERN]) {
      const scanner = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = scanner.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (out.some((c) => start < c.endIndex && c.startIndex < end)) continue;

        const value = Power.tryParse(match[0]);
        if (value === null) continue;
        out.push(
          new TextCandidate<Power>({
            startIndex: start,
            length: match[0].length,
            originalText: match[0],
            typeName: "Power",
            category: TextCandidateCategory.Measurement,
            normalizedForm: value.toNormalizedString(),
            formattedForm: value.toString(),
            maskedForm: maskPower(value),
            confidence: TextMatchConfidence.Medium,
            value,
          }),
        );
      }
    }

    return out.sort((a, b) => a.startIndex - b.startIndex);
  }

  private static fallback(
    input: string | null | undefined,
    options?: PowerFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a power: ${value}`);
    return parsed;
  }
}

/** Returns a masked power, e.g. `10 W` becomes `*** W`. */
export function maskPower(value: Power): string {
  return `*** ${value.originalUnit.symbol}`;
}
