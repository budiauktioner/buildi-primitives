import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link Count.format} and {@link Count.normalize}. */
export interface CountFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MIN_VALUE = 0;
const MAX_VALUE = 1_000_000_000;
const MAX_INPUT_LENGTH = 50;

const INPUT_PATTERN =
  /^(?<number>[0-9](?:[0-9 .,\u00A0]*[0-9])?)\s*(?<suffix>st\.?|stk\.?|stycken|stycke|pcs\.?|pc\.?|pieces|piece|ea\.?|x)?$/iu;

/**
 * A whole number of items, from 0 to one billion, written with or without a
 * piece suffix — `5`, `5 st`, `1 345 stycken`, `3 x`.
 *
 * Separators are treated as thousands grouping, so `1.345` is one thousand
 * three hundred and forty-five. A group of one or two digits after the last
 * separator cannot be grouping, so `1,5` is rejected rather than rounded.
 */
export class Count {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Count",
    localizedName: "Antal",
    emoji: "🔢",
    sources: Object.freeze([]),
  });

  /** The smallest count that can be represented. */
  static readonly minValue = MIN_VALUE;

  /** The largest count that can be represented. */
  static readonly maxValue = MAX_VALUE;

  private constructor(
    /** The count as an integer, e.g. `5`. */
    readonly value: number,
  ) {}

  /** Creates a count from an integer. Throws when it is out of range. */
  static create(value: number): Count {
    if (!Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) {
      throw new Error(`Count must be between ${MIN_VALUE} and ${MAX_VALUE}.`);
    }
    return new Count(value);
  }

  static tryParse(input: string | null | undefined): Count | null {
    if (input == null) return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) return null;

    const match = INPUT_PATTERN.exec(trimmed);
    const number = match?.groups?.["number"];
    if (number === undefined) return null;

    const value = tryParseInteger(number);
    if (value === null || value < MIN_VALUE || value > MAX_VALUE) return null;

    return new Count(value);
  }

  static parse(input: string): Count {
    const result = Count.tryParse(input);
    if (result === null) throw new Error("Invalid count.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Count.tryParse(input) !== null;
  }

  /** Display form with the Swedish piece abbreviation, e.g. `1 345 st`. */
  static format(input: string | null | undefined, options?: CountFormatOptions): string | null {
    const parsed = Count.tryParse(input);
    if (parsed !== null) return parsed.toString();
    return fallback(input, options);
  }

  /** The digit-only canonical form, e.g. `1345`. */
  static normalize(input: string | null | undefined, options?: CountFormatOptions): string | null {
    const parsed = Count.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Count.normalize(input) === input;
  }

  /** The digit-only canonical form, e.g. `1345`. */
  toNormalizedString(): string {
    return String(this.value);
  }

  /** The count with grouped thousands and a piece abbreviation, e.g. `1 345 st`. */
  toString(): string {
    return `${formatGrouped(this.value)} st`;
  }

  /** Grouped but without the suffix, e.g. `1 345`. */
  toNaturalString(): string {
    return formatGrouped(this.value);
  }

  compareTo(other: Count | null | undefined): number {
    if (other == null) return 1;
    return this.value - other.value;
  }

  equals(other: Count | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
}

/** Returns a masked count, e.g. `5 st` becomes `*** st`. */
export function maskCount(count: Count): string {
  void count;
  return "*** st";
}

function formatGrouped(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, " ");
}

/**
 * Reads an integer whose separators are all thousands grouping. A trailing
 * group shorter than three digits means the separator was a decimal point, and
 * a count is not a decimal, so the input is rejected.
 */
function tryParseInteger(raw: string): number | null {
  const compact = raw.replace(/[ \u00A0]/gu, "");
  if (compact.length === 0) return null;

  const lastSeparator = Math.max(compact.lastIndexOf(","), compact.lastIndexOf("."));
  if (lastSeparator >= 0) {
    const trailing = compact.slice(lastSeparator + 1);
    if (trailing.length > 0 && trailing.length < 3 && /^\d+$/u.test(trailing)) return null;
  }

  const digits = compact.replace(/[.,]/gu, "");
  if (digits.length === 0 || !/^\d+$/u.test(digits)) return null;

  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

function fallback(input: string | null | undefined, options?: CountFormatOptions): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
  if (input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
