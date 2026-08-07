import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { VoltageUnit } from "./voltage-unit.js";

/** Options for {@link Voltage.format} and {@link Voltage.normalize}. */
export interface VoltageFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: VoltageUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:µV|uV|mV|kV|MV|V)\b`,
  "giu",
);

/**
 * A voltage stored internally in volts,
 * parsed from any supported unit and convertible between all of them.
 */
export class Voltage extends Quantity<VoltageUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Voltage",
    localizedName: "Spänning",
    emoji: "🔌",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Volt",
    ]),
  });

  protected get units(): MeasurementUnitIndex<VoltageUnit> {
    return VoltageUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: VoltageUnit): this {
    return new Voltage(baseValue, unit) as this;
  }

  get microvolts(): number {
    return this.in(VoltageUnit.Microvolt);
  }
  get millivolts(): number {
    return this.in(VoltageUnit.Millivolt);
  }
  get volts(): number {
    return this.in(VoltageUnit.Volt);
  }
  get kilovolts(): number {
    return this.in(VoltageUnit.Kilovolt);
  }
  get megavolts(): number {
    return this.in(VoltageUnit.Megavolt);
  }

  /** Creates a voltage from a value and unit. */
  static create(value: number | Decimal, unit: VoltageUnit): Voltage {
    VoltageUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Voltage.decimalOf(value);
    return new Voltage(unit.toBase(amount), unit);
  }

  static fromMicrovolts(value: number | Decimal): Voltage {
    return Voltage.create(value, VoltageUnit.Microvolt);
  }
  static fromMillivolts(value: number | Decimal): Voltage {
    return Voltage.create(value, VoltageUnit.Millivolt);
  }
  static fromVolts(value: number | Decimal): Voltage {
    return Voltage.create(value, VoltageUnit.Volt);
  }
  static fromKilovolts(value: number | Decimal): Voltage {
    return Voltage.create(value, VoltageUnit.Kilovolt);
  }
  static fromMegavolts(value: number | Decimal): Voltage {
    return Voltage.create(value, VoltageUnit.Megavolt);
  }

  static tryParse(input: string | null | undefined): Voltage | null {
    const parsed = tryParseQuantity(input, VoltageUnit.index, VoltageUnit.tryParse);
    return parsed === null ? null : new Voltage(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Voltage {
    const result = Voltage.tryParse(input);
    if (result === null) throw new Error("Invalid voltage.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Voltage.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: VoltageFormatOptions): string | null {
    const parsed = Voltage.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Voltage.fallback(input, options);
  }

  /** The value in volts, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: VoltageFormatOptions,
  ): string | null {
    const parsed = Voltage.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Voltage.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Voltage.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Voltage>[] {
    if (!text) return [];

    const out: TextCandidate<Voltage>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Voltage.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Voltage>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Voltage",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskVoltage(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: VoltageFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a voltage: ${value}`);
    return parsed;
  }
}

/** Returns a masked voltage, e.g. `10 V` becomes `*** V`. */
export function maskVoltage(value: Voltage): string {
  return `*** ${value.originalUnit.symbol}`;
}
