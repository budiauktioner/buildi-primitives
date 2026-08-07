import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import { Power } from "../measurement/power.js";
import { PowerUnit } from "../measurement/power-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link EnginePower.format} and {@link EnginePower.normalize}. */
export interface EnginePowerFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: PowerUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const HK_PATTERN = /^\s*([0-9][0-9 .,]*[0-9]|[0-9])\s*hk\s*$/iu;
const APPROXIMATE_PREFIX = /^(?:ca\.?\s+|circa\s+|~\s*|approx\.?\s+|ungefär\s+)/iu;
const SCAN_PATTERN = /(?<![\p{L}\p{N}_])\d+[0-9 .,]*\s*hk(?![\p{L}\p{N}_])/giu;

/**
 * Engine power output (`motoreffekt`), e.g. `150 hp`, `110 kW` or the Swedish
 * `150 hk`. A bare number is read as horsepower, and a leading `ca` or `~` is
 * ignored.
 */
export class EnginePower {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Engine Power",
    localizedName: "Motoreffekt",
    emoji: "🐎",
    sources: Object.freeze([]),
  });

  /** The underlying power value. */
  readonly powerValue: Power;

  /** Display form preserving the parsed unit, e.g. `150 hp`. */
  readonly value: string;

  private constructor(power: Power, displayValue?: string) {
    this.powerValue = power;
    this.value = displayValue ?? power.toString();
  }

  get horsepower(): number {
    return this.powerValue.horsepower;
  }

  get kilowatts(): number {
    return this.powerValue.kilowatts;
  }

  get watts(): number {
    return this.powerValue.watts;
  }

  /** Creates an engine power from a value and power unit. The value must be positive. */
  static create(value: number | Decimal, unit: PowerUnit): EnginePower {
    const amount = value instanceof Decimal ? value : decimalOf(value);
    if (amount.compareTo(Decimal.zero) <= 0) throw new Error("Engine power must be positive.");
    return new EnginePower(Power.create(amount, unit));
  }

  static fromHorsepower(value: number | Decimal): EnginePower {
    return EnginePower.create(value, PowerUnit.Horsepower);
  }

  static fromKilowatts(value: number | Decimal): EnginePower {
    return EnginePower.create(value, PowerUnit.Kilowatt);
  }

  static fromWatts(value: number | Decimal): EnginePower {
    return EnginePower.create(value, PowerUnit.Watt);
  }

  static tryParse(input: string | null | undefined): EnginePower | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim().replace(APPROXIMATE_PREFIX, "");

    const bare = tryParseNumberOnly(trimmed);
    if (bare !== null) return fromHorsepower(bare);

    // `hk` is Swedish for horsepower and is not a symbol the Power unit index knows.
    const hk = HK_PATTERN.exec(trimmed);
    if (hk !== null) {
      const amount = tryParseNumberOnly(hk[1]!);
      return amount === null ? null : fromHorsepower(amount);
    }

    const parsed = Power.tryParse(trimmed);
    if (parsed === null || parsed.watts <= 0) return null;
    return new EnginePower(parsed);
  }

  static parse(input: string): EnginePower {
    const result = EnginePower.tryParse(input);
    if (result === null) throw new Error("Invalid engine power.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EnginePower.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `150 hp`. Returns `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: EnginePowerFormatOptions,
  ): string | null {
    const parsed = EnginePower.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.powerValue.toStringInUnit(
          options.unit ?? parsed.powerValue.originalUnit,
          options.decimals,
        );
      }
      return parsed.value;
    }
    return fallback(input, options);
  }

  /** Returns the value in watts, e.g. `110000 W`. Returns `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: EnginePowerFormatOptions,
  ): string | null {
    const parsed = EnginePower.tryParse(input);
    if (parsed !== null) return parsed.powerValue.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EnginePower.normalize(input) === input;
  }

  /**
   * Finds engine power written with the Swedish `hk` suffix. Standard power units
   * such as `kW` and `hp` are found by {@link Power.findCandidatesInText} instead.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<EnginePower>[] {
    if (!text) return [];

    const out: TextCandidate<EnginePower>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = EnginePower.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<EnginePower>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "EnginePower",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskEnginePower(value),
          confidence: TextMatchConfidence.Low,
          value,
        }),
      );
    }

    return out;
  }

  toNormalizedString(): string {
    return this.powerValue.toNormalizedString();
  }

  toString(): string {
    return this.value;
  }

  /** Returns the value in the most readable SI unit, e.g. `1.5 kW` rather than `1500 W`. */
  toNaturalString(decimals?: number): string {
    return this.powerValue.toNaturalString(decimals);
  }

  plus(other: EnginePower): EnginePower {
    return new EnginePower(this.powerValue.plus(other.powerValue));
  }

  minus(other: EnginePower): EnginePower {
    return new EnginePower(this.powerValue.minus(other.powerValue));
  }

  times(factor: number | Decimal): EnginePower {
    return new EnginePower(
      this.powerValue.times(factor instanceof Decimal ? factor : decimalOf(factor)),
    );
  }

  dividedBy(divisor: number | Decimal): EnginePower {
    return new EnginePower(
      this.powerValue.dividedBy(divisor instanceof Decimal ? divisor : decimalOf(divisor)),
    );
  }

  negated(): EnginePower {
    return new EnginePower(this.powerValue.negated());
  }

  equals(other: EnginePower | null | undefined): boolean {
    return other != null && this.powerValue.equals(other.powerValue);
  }

  compareTo(other: EnginePower | null | undefined): number {
    if (other == null) return 1;
    return this.powerValue.compareTo(other.powerValue);
  }

  /** @internal Used by the private factories that keep a custom display form. */
  static _fromDisplay(power: Power, displayValue: string): EnginePower {
    return new EnginePower(power, displayValue);
  }
}

/** Returns a masked engine power, e.g. `150 hp` becomes `*** hp`. */
export function maskEnginePower(power: EnginePower): string {
  return `*** ${power.powerValue.originalUnit.symbol}`;
}

function fromHorsepower(amount: Decimal): EnginePower | null {
  if (amount.compareTo(Decimal.zero) <= 0) return null;
  return EnginePower._fromDisplay(
    Power.fromHorsepower(amount),
    `${formatQuantityDecimal(amount)} ${PowerUnit.Horsepower.symbol}`,
  );
}

function fallback(
  input: string | null | undefined,
  options?: EnginePowerFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decimalOf(value: number): Decimal {
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a power: ${value}`);
  return parsed;
}
