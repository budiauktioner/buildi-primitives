import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link Percentage.format} and {@link Percentage.normalize}. */
export interface PercentageFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const ZERO = Decimal.parse("0")!;
const ONE = Decimal.parse("1")!;
const HUNDRED = Decimal.parse("100")!;
const MAX_INPUT_LENGTH = 100;

const WORD_SUFFIX_PATTERN =
  /^(?<sign>[+-])?\s*(?<number>[0-9][0-9 .,]*[0-9]|[0-9])\s+(?:procent|percent)\s*$/iu;

const SCAN_PATTERN = /(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*%/gu;

/**
 * A proportion from 0 to 100 percent, held internally as a fraction from 0 to
 * 1.
 *
 * Input without a percent sign is read on whichever scale fits: `0.85` is a
 * fraction, `85` is a percentage, and anything above 100 is rejected. With a
 * sign or the word `procent` / `percent` the percentage scale is explicit.
 */
export class Percentage {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Percentage",
    localizedName: "Procent",
    emoji: "📊",
    sources: Object.freeze(["https://www.bipm.org/en/publications/si-brochure"]),
  });

  private constructor(private readonly fraction: Decimal) {}

  /** The value as a fraction from 0 to 1, e.g. `0.85` for 85%. */
  get value(): number {
    return this.fraction.toNumber();
  }

  /** The value on a 0–100 scale, e.g. `85` for 85%. */
  get percent(): number {
    return this.fraction.times(HUNDRED).toNumber();
  }

  /** Creates a percentage from a 0–1 fraction, e.g. `0.85` for 85%. */
  static fromDecimal(value: number | Decimal): Percentage {
    return new Percentage(checkedFraction(toDecimal(value)));
  }

  /** Creates a percentage from a 0–100 value, e.g. `85` for 85%. */
  static fromPercent(percent: number | Decimal): Percentage {
    const raw = toDecimal(percent);
    if (raw.compareTo(ZERO) < 0 || raw.compareTo(HUNDRED) > 0) {
      throw new Error("Percent must be in the range 0 to 100 inclusive.");
    }
    return new Percentage(raw.dividedBy(HUNDRED));
  }

  /** Creates a percentage from a 0–100 value; the same as {@link fromPercent}. */
  static create(percent: number | Decimal): Percentage {
    return Percentage.fromPercent(percent);
  }

  static tryParse(input: string | null | undefined): Percentage | null {
    if (input == null) return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) return null;

    let raw: Decimal | null;
    let isPercentScale = false;

    if (trimmed.endsWith("%")) {
      raw = tryParseNumberOnly(trimmed.slice(0, -1).trimEnd());
      isPercentScale = true;
    } else {
      const match = WORD_SUFFIX_PATTERN.exec(trimmed);
      if (match?.groups?.["number"] !== undefined) {
        const sign = match.groups["sign"] ?? "";
        raw = tryParseNumberOnly(sign + match.groups["number"]);
        isPercentScale = true;
      } else {
        raw = tryParseNumberOnly(trimmed);
      }
    }

    if (raw === null) return null;

    if (isPercentScale) {
      if (raw.compareTo(ZERO) < 0 || raw.compareTo(HUNDRED) > 0) return null;
      return new Percentage(raw.dividedBy(HUNDRED));
    }

    if (raw.compareTo(ZERO) < 0) return null;
    if (raw.compareTo(ONE) <= 0) return new Percentage(raw);
    if (raw.compareTo(HUNDRED) <= 0) return new Percentage(raw.dividedBy(HUNDRED));
    return null;
  }

  static parse(input: string): Percentage {
    const result = Percentage.tryParse(input);
    if (result === null) throw new Error("Invalid percentage.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Percentage.tryParse(input) !== null;
  }

  /** Display form with a percent sign, e.g. `85%`. */
  static format(
    input: string | null | undefined,
    options?: PercentageFormatOptions,
  ): string | null {
    const parsed = Percentage.tryParse(input);
    if (parsed !== null) {
      return options?.decimals !== undefined
        ? formatPercent(parsed.fraction, options.decimals)
        : parsed.toString();
    }
    return fallback(input, options);
  }

  /** The fraction as an invariant decimal string, e.g. `0.85`. */
  static normalize(
    input: string | null | undefined,
    options?: PercentageFormatOptions,
  ): string | null {
    const parsed = Percentage.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Percentage.normalize(input) === input;
  }

  /** The fraction, e.g. `0.85`. */
  toNormalizedString(): string {
    return this.fraction.toTrimmedString();
  }

  /** The value with a percent sign, e.g. `85%`. */
  toString(): string {
    return formatPercent(this.fraction);
  }

  plus(other: Percentage): Percentage {
    return new Percentage(checkedFraction(this.fraction.plus(other.fraction)));
  }

  minus(other: Percentage): Percentage {
    return new Percentage(checkedFraction(this.fraction.minus(other.fraction)));
  }

  times(factor: number | Decimal): Percentage {
    return new Percentage(checkedFraction(this.fraction.times(toDecimal(factor))));
  }

  dividedBy(divisor: number | Decimal): Percentage {
    return new Percentage(checkedFraction(this.fraction.dividedBy(toDecimal(divisor))));
  }

  compareTo(other: Percentage | null | undefined): number {
    if (other == null) return 1;
    return this.fraction.compareTo(other.fraction);
  }

  equals(other: Percentage | null | undefined): boolean {
    return other != null && this.fraction.equals(other.fraction);
  }

  isLessThan(other: Percentage): boolean {
    return this.compareTo(other) < 0;
  }

  isGreaterThan(other: Percentage): boolean {
    return this.compareTo(other) > 0;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<Percentage>[] {
    if (!text) return [];

    const out: TextCandidate<Percentage>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = Percentage.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Percentage>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Percentage",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskPercentage(value),
          confidence: TextMatchConfidence.Low,
          value,
        }),
      );
    }

    return out;
  }
}

/** Returns a masked percentage, e.g. `85%` becomes `***%`. */
export function maskPercentage(percentage: Percentage): string {
  void percentage;
  return "***%";
}

function formatPercent(fraction: Decimal, decimals?: number): string {
  const percent = fraction.times(HUNDRED);
  const rounded = decimals === undefined ? percent : percent.round(decimals, "away-from-zero");
  return `${rounded.toTrimmedString()}%`;
}

function checkedFraction(fraction: Decimal): Decimal {
  if (fraction.compareTo(ZERO) < 0 || fraction.compareTo(ONE) > 0) {
    throw new Error("The operation produced a percentage outside the range 0% to 100%.");
  }
  return fraction;
}

function toDecimal(value: number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a percentage: ${value}`);
  return parsed;
}

function fallback(
  input: string | null | undefined,
  options?: PercentageFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
  if (input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
