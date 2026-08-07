import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link EmissionRate.format} and {@link EmissionRate.normalize}. */
export interface EmissionRateFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const KM_PER_MILE = Decimal.parse("1.60934")!;
const THOUSAND = Decimal.parse("1000")!;
const CONVERSION_PRECISION = 6;

const PATTERN = /^\s*([0-9][0-9 .,]*[0-9]|[0-9])\s*(g\/km|mg\/km|g\/mi|g\/mile|mg\/mi)\s*$/iu;

const SCAN_PATTERN = /(?<!\w)\d+[0-9 .,]*\s*(?:g\/km|mg\/km|g\/mi(?:le)?|mg\/mi)\b/giu;

/**
 * A vehicle emission rate (`utsläpp`) such as CO₂ per distance, held as grams per
 * kilometre. Accepts `g/km`, `mg/km`, `g/mi` and `mg/mi`; a bare number is read as
 * grams per kilometre.
 *
 * Sources:
 * - https://en.wikipedia.org/wiki/European_emission_standards
 * - https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle
 */
export class EmissionRate {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Emission Rate",
    localizedName: "Utsläpp",
    emoji: "💨",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/European_emission_standards",
      "https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle",
    ]),
  });

  /** Display form preserving the parsed unit, e.g. `221 g/km`. */
  readonly value: string;

  private readonly exactGramsPerKm: Decimal;

  private constructor(gramsPerKm: Decimal, value: string) {
    this.exactGramsPerKm = gramsPerKm;
    this.value = value;
  }

  /** The rate in grams per kilometre, e.g. `221`. */
  get gramsPerKm(): number {
    return this.exactGramsPerKm.toNumber();
  }

  /** The rate in milligrams per kilometre, e.g. `95700`. */
  get milligramsPerKm(): number {
    return this.exactGramsPerKm.times(THOUSAND).toNumber();
  }

  /** The rate in grams per mile, e.g. `355.66`. */
  get gramsPerMile(): number {
    return this.exactGramsPerKm.times(KM_PER_MILE).toNumber();
  }

  static fromGramsPerKm(value: number | Decimal): EmissionRate {
    const amount = positive(value);
    return new EmissionRate(amount, `${formatQuantityDecimal(amount)} g/km`);
  }

  static fromMilligramsPerKm(value: number | Decimal): EmissionRate {
    const amount = positive(value);
    return new EmissionRate(amount.dividedBy(THOUSAND), `${formatQuantityDecimal(amount)} mg/km`);
  }

  private static fromUnit(amount: Decimal, unitRaw: string): EmissionRate | null {
    switch (unitRaw.toLowerCase()) {
      case "g/km":
        return new EmissionRate(amount, `${formatQuantityDecimal(amount)} g/km`);
      case "mg/km":
        return new EmissionRate(
          amount.dividedBy(THOUSAND),
          `${formatQuantityDecimal(amount)} mg/km`,
        );
      case "g/mi":
      case "g/mile":
        return new EmissionRate(
          round(amount.dividedBy(KM_PER_MILE)),
          `${formatQuantityDecimal(amount)} g/mi`,
        );
      case "mg/mi":
        return new EmissionRate(
          round(amount.dividedBy(THOUSAND).dividedBy(KM_PER_MILE)),
          `${formatQuantityDecimal(amount)} mg/mi`,
        );
      default:
        return null;
    }
  }

  static tryParse(input: string | null | undefined): EmissionRate | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const match = PATTERN.exec(trimmed);
    if (match !== null) {
      const amount = tryParseNumberOnly(match[1]!);
      if (amount === null || amount.compareTo(Decimal.zero) <= 0) return null;
      return EmissionRate.fromUnit(amount, match[2]!);
    }

    const bare = tryParseNumberOnly(trimmed);
    if (bare === null || bare.compareTo(Decimal.zero) <= 0) return null;
    return new EmissionRate(bare, `${formatQuantityDecimal(bare)} g/km`);
  }

  static parse(input: string): EmissionRate {
    const result = EmissionRate.tryParse(input);
    if (result === null) throw new Error("Invalid emission rate.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EmissionRate.tryParse(input) !== null;
  }

  /** Returns the display form in the parsed unit, e.g. `95.7 mg/km`. */
  static format(
    input: string | null | undefined,
    options?: EmissionRateFormatOptions,
  ): string | null {
    const parsed = EmissionRate.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  /** Returns the value in g/km, e.g. `221 g/km`. */
  static normalize(
    input: string | null | undefined,
    options?: EmissionRateFormatOptions,
  ): string | null {
    const parsed = EmissionRate.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EmissionRate.normalize(input) === input;
  }

  /** Finds emission rates in unstructured text, e.g. `221 g/km`. */
  static findCandidatesInText(text: string): readonly TextCandidate<EmissionRate>[] {
    if (!text) return [];

    const out: TextCandidate<EmissionRate>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = EmissionRate.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<EmissionRate>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "EmissionRate",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskEmissionRate(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the value in g/km, e.g. `221 g/km`. */
  toNormalizedString(): string {
    return `${formatQuantityDecimal(this.exactGramsPerKm)} g/km`;
  }

  toString(): string {
    return this.value;
  }

  equals(other: EmissionRate | null | undefined): boolean {
    return other != null && this.exactGramsPerKm.equals(other.exactGramsPerKm);
  }

  compareTo(other: EmissionRate | null | undefined): number {
    if (other == null) return 1;
    return this.exactGramsPerKm.compareTo(other.exactGramsPerKm);
  }
}

/** Returns a masked emission rate, e.g. `221 g/km` becomes `*** g/km`. */
export function maskEmissionRate(rate: EmissionRate): string {
  const separator = rate.value.indexOf(" ");
  if (separator < 0) return "*".repeat(rate.value.length);
  return `*** ${rate.value.slice(separator + 1)}`;
}

function round(value: Decimal): Decimal {
  return value.round(CONVERSION_PRECISION, "half-even");
}

function positive(value: number | Decimal): Decimal {
  const amount = value instanceof Decimal ? value : Decimal.fromNumber(value);
  if (amount === null) throw new Error(`Value cannot be represented as an emission rate: ${value}`);
  if (amount.compareTo(Decimal.zero) <= 0) throw new Error("Value must be positive.");
  return amount;
}

function fallback(
  input: string | null | undefined,
  options?: EmissionRateFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
