import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { trySplitMeasurement, tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link OperatingHours.format} and {@link OperatingHours.normalize}. */
export interface OperatingHoursFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const HOUR_SUFFIXES = ["h", "tim", "timmar", "timme", "hours", "hour", "hrs", "hr"];

const SCAN_PATTERN = /(?<!\w)(?:\d+[0-9 .,]*\d|\d)\s*(?:timmar|timme|tim|hours|hour|hrs|hr|h)\b/giu;

/**
 * Machine operating hours (`drifttimmar`), e.g. `1234 h`. A bare number is read as
 * hours; an explicit `h`, `tim` or `timmar` suffix is also accepted.
 */
export class OperatingHours {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Operating Hours",
    localizedName: "Drifttimmar",
    emoji: "⏱️",
    sources: Object.freeze([]),
  });

  /** Display form, e.g. `1234 h`. */
  readonly value: string;

  private readonly exactHours: Decimal;

  private constructor(hours: Decimal) {
    this.exactHours = hours;
    this.value = `${formatQuantityDecimal(hours)} h`;
  }

  /** The reading in hours. */
  get hours(): number {
    return this.exactHours.toNumber();
  }

  /** @internal The exact reading, used by the masking helper. */
  get _exactHours(): Decimal {
    return this.exactHours;
  }

  /** Creates a reading from an hour value. The value must not be negative. */
  static create(hours: number | Decimal): OperatingHours {
    const amount = hours instanceof Decimal ? hours : decimalOf(hours);
    if (amount.isNegative) throw new Error("Operating hours cannot be negative.");
    return new OperatingHours(amount);
  }

  static fromHours(hours: number | Decimal): OperatingHours {
    return OperatingHours.create(hours);
  }

  static tryParse(input: string | null | undefined): OperatingHours | null {
    if (input == null || input.trim().length === 0) return null;
    const trimmed = sanitizeInput(input).trim();

    const bare = tryParseNumberOnly(trimmed);
    if (bare !== null) return bare.isNegative ? null : new OperatingHours(bare);

    const split = trySplitMeasurement(trimmed);
    if (split === null || split.value.isNegative) return null;
    if (!HOUR_SUFFIXES.includes(split.unitSuffix.toLowerCase())) return null;

    return new OperatingHours(split.value);
  }

  static parse(input: string): OperatingHours {
    const result = OperatingHours.tryParse(input);
    if (result === null) throw new Error("Invalid operating hours.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return OperatingHours.tryParse(input) !== null;
  }

  /** Returns the display form, e.g. `1234 h`. Returns `null` when the input is invalid. */
  static format(
    input: string | null | undefined,
    options?: OperatingHoursFormatOptions,
  ): string | null {
    const parsed = OperatingHours.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  /** Returns the value in hours, e.g. `1234 h`. Returns `null` when the input is invalid. */
  static normalize(
    input: string | null | undefined,
    options?: OperatingHoursFormatOptions,
  ): string | null {
    const parsed = OperatingHours.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && OperatingHours.normalize(input) === input;
  }

  /**
   * Finds operating-hour readings in unstructured text. Only values with an explicit
   * hour suffix match, which keeps false positives down.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<OperatingHours>[] {
    if (!text) return [];

    const out: TextCandidate<OperatingHours>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = OperatingHours.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<OperatingHours>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "OperatingHours",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskOperatingHours(value),
          confidence: TextMatchConfidence.Low,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the reading in hours, e.g. `1234 h`. */
  toNormalizedString(): string {
    return `${formatQuantityDecimal(this.exactHours)} h`;
  }

  toString(): string {
    return this.value;
  }

  plus(other: OperatingHours): OperatingHours {
    return new OperatingHours(this.exactHours.plus(other.exactHours));
  }

  minus(other: OperatingHours): OperatingHours {
    return new OperatingHours(this.exactHours.minus(other.exactHours));
  }

  times(factor: number | Decimal): OperatingHours {
    return new OperatingHours(
      this.exactHours.times(factor instanceof Decimal ? factor : decimalOf(factor)),
    );
  }

  dividedBy(divisor: number | Decimal): OperatingHours {
    return new OperatingHours(
      this.exactHours.dividedBy(divisor instanceof Decimal ? divisor : decimalOf(divisor)),
    );
  }

  equals(other: OperatingHours | null | undefined): boolean {
    return other != null && this.exactHours.equals(other.exactHours);
  }

  compareTo(other: OperatingHours | null | undefined): number {
    if (other == null) return 1;
    return this.exactHours.compareTo(other.exactHours);
  }
}

/** Returns a masked operating-hour reading, e.g. `1234 h` becomes `**** h`. */
export function maskOperatingHours(hours: OperatingHours): string {
  return `${"*".repeat(hours._exactHours.toString().length)} h`;
}

function fallback(
  input: string | null | undefined,
  options?: OperatingHoursFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decimalOf(value: number): Decimal {
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as hours: ${value}`);
  return parsed;
}
