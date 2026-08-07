import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { TorqueUnit } from "./torque-unit.js";

/** Options for {@link Torque.format} and {@link Torque.normalize}. */
export interface TorqueFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: TorqueUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:foot-pounds|foot-pound|inch-pounds|inch-pound|kilogramkraftmeter|kilonewton[\s-]?meters?|millinewton[\s-]?meters?|newtonmeter|fotpund|tumpund|kgf-m|kgf·m|kgfm|ft-lb|ft·lb|in-lb|in·lb|kN·m|kNm|mN·m|mNm|N·m|Nm)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A torque stored internally in newton meters,
 * parsed from any supported unit and convertible between all of them.
 */
export class Torque extends Quantity<TorqueUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Torque",
    localizedName: "Vridmoment",
    emoji: "🔧",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Conversion_of_units",
    ]),
  });

  protected get units(): MeasurementUnitIndex<TorqueUnit> {
    return TorqueUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: TorqueUnit): this {
    return new Torque(baseValue, unit) as this;
  }

  get millinewtonMeters(): number {
    return this.in(TorqueUnit.MillinewtonMeter);
  }
  get newtonMeters(): number {
    return this.in(TorqueUnit.NewtonMeter);
  }
  get kilonewtonMeters(): number {
    return this.in(TorqueUnit.KilonewtonMeter);
  }
  get footPounds(): number {
    return this.in(TorqueUnit.FootPound);
  }
  get kilogramForceMeters(): number {
    return this.in(TorqueUnit.KilogramForceMeter);
  }
  get inchPounds(): number {
    return this.in(TorqueUnit.InchPound);
  }

  /** Creates a torque from a value and unit. */
  static create(value: number | Decimal, unit: TorqueUnit): Torque {
    TorqueUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : Torque.decimalOf(value);
    return new Torque(unit.toBase(amount), unit);
  }

  static fromMillinewtonMeters(value: number | Decimal): Torque {
    return Torque.create(value, TorqueUnit.MillinewtonMeter);
  }
  static fromNewtonMeters(value: number | Decimal): Torque {
    return Torque.create(value, TorqueUnit.NewtonMeter);
  }
  static fromKilonewtonMeters(value: number | Decimal): Torque {
    return Torque.create(value, TorqueUnit.KilonewtonMeter);
  }
  static fromFootPounds(value: number | Decimal): Torque {
    return Torque.create(value, TorqueUnit.FootPound);
  }
  static fromKilogramForceMeters(value: number | Decimal): Torque {
    return Torque.create(value, TorqueUnit.KilogramForceMeter);
  }
  static fromInchPounds(value: number | Decimal): Torque {
    return Torque.create(value, TorqueUnit.InchPound);
  }

  static tryParse(input: string | null | undefined): Torque | null {
    const parsed = tryParseQuantity(input, TorqueUnit.index);
    return parsed === null ? null : new Torque(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): Torque {
    const result = Torque.tryParse(input);
    if (result === null) throw new Error("Invalid torque.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Torque.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(input: string | null | undefined, options?: TorqueFormatOptions): string | null {
    const parsed = Torque.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return Torque.fallback(input, options);
  }

  /** The value in newton meters, or `null` when the input is invalid. */
  static normalize(input: string | null | undefined, options?: TorqueFormatOptions): string | null {
    const parsed = Torque.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return Torque.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Torque.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Torque>[] {
    if (!text) return [];

    const out: TextCandidate<Torque>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Torque.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Torque>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Torque",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskTorque(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: TorqueFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null) throw new Error(`Value cannot be represented as a torque: ${value}`);
    return parsed;
  }
}

/** Returns a masked torque, e.g. `10 Nm` becomes `*** Nm`. */
export function maskTorque(value: Torque): string {
  return `*** ${value.originalUnit.symbol}`;
}
