import { Decimal } from "../internal/decimal.js";
import type { MeasurementUnitIndex } from "../internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { LuminousFluxUnit } from "./luminous-flux-unit.js";

/** Options for {@link LuminousFlux.format} and {@link LuminousFlux.normalize}. */
export interface LuminousFluxFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Convert to this unit instead of preserving the parsed one. */
  unit?: LuminousFluxUnit;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const SCAN_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:[+-]\s*)?\d+[0-9 .,]*\s*(?:klm|lm)(?![\p{L}\p{N}_])`,
  "giu",
);

/**
 * A luminous flux stored internally in lumens,
 * parsed from any supported unit and convertible between all of them.
 */
export class LuminousFlux extends Quantity<LuminousFluxUnit> {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Luminous Flux",
    localizedName: "Ljusflöde",
    emoji: "💡",
    sources: Object.freeze([
      "https://www.bipm.org/en/measurement-units/si-derived-units",
      "https://en.wikipedia.org/wiki/Lumen_(unit)",
    ]),
  });

  protected get units(): MeasurementUnitIndex<LuminousFluxUnit> {
    return LuminousFluxUnit.index;
  }

  protected withBaseValue(baseValue: Decimal, unit: LuminousFluxUnit): this {
    return new LuminousFlux(baseValue, unit) as this;
  }

  get lumens(): number {
    return this.in(LuminousFluxUnit.Lumen);
  }
  get kilolumens(): number {
    return this.in(LuminousFluxUnit.Kilolumen);
  }

  /** Creates a luminous flux from a value and unit. */
  static create(value: number | Decimal, unit: LuminousFluxUnit): LuminousFlux {
    LuminousFluxUnit.index.assertOwns(unit);
    const amount = value instanceof Decimal ? value : LuminousFlux.decimalOf(value);
    return new LuminousFlux(unit.toBase(amount), unit);
  }

  static fromLumens(value: number | Decimal): LuminousFlux {
    return LuminousFlux.create(value, LuminousFluxUnit.Lumen);
  }
  static fromKilolumens(value: number | Decimal): LuminousFlux {
    return LuminousFlux.create(value, LuminousFluxUnit.Kilolumen);
  }

  static tryParse(input: string | null | undefined): LuminousFlux | null {
    const parsed = tryParseQuantity(input, LuminousFluxUnit.index);
    return parsed === null ? null : new LuminousFlux(parsed.baseValue, parsed.unit);
  }

  static parse(input: string): LuminousFlux {
    const result = LuminousFlux.tryParse(input);
    if (result === null) throw new Error("Invalid luminous flux.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return LuminousFlux.tryParse(input) !== null;
  }

  /** Display form in the parsed unit, or `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: LuminousFluxFormatOptions,
  ): string | null {
    const parsed = LuminousFlux.tryParse(input);
    if (parsed !== null) {
      if (options?.unit !== undefined || options?.decimals !== undefined) {
        return parsed.toStringInUnit(options.unit ?? parsed.originalUnit, options.decimals);
      }
      return parsed.toString();
    }
    return LuminousFlux.fallback(input, options);
  }

  /** The value in lumens, or `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: LuminousFluxFormatOptions,
  ): string | null {
    const parsed = LuminousFlux.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return LuminousFlux.fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && LuminousFlux.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<LuminousFlux>[] {
    if (!text) return [];

    const out: TextCandidate<LuminousFlux>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = LuminousFlux.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<LuminousFlux>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "LuminousFlux",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskLuminousFlux(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  private static fallback(
    input: string | null | undefined,
    options?: LuminousFluxFormatOptions,
  ): string | null {
    if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
    if (input == null) return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private static decimalOf(value: number): Decimal {
    const parsed = Decimal.fromNumber(value);
    if (parsed === null)
      throw new Error(`Value cannot be represented as a luminous flux: ${value}`);
    return parsed;
  }
}

/** Returns a masked luminous flux, e.g. `10 lm` becomes `*** lm`. */
export function maskLuminousFlux(value: LuminousFlux): string {
  return `*** ${value.originalUnit.symbol}`;
}
