import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link Year.format} and {@link Year.normalize}. */
export interface YearFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MIN_YEAR = 1000;
const MAX_YEAR = 9999;

const YEAR_PATTERN = /^\s*(?<year>\d{4})\s*$/u;

/**
 * A four-digit calendar year from 1000 to 9999.
 *
 * Sources:
 * - https://www.iso.org/iso-8601-date-and-time-format.html
 */
export class Year {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Year",
    localizedName: "År",
    emoji: "📅",
    sources: Object.freeze(["https://www.iso.org/iso-8601-date-and-time-format.html"]),
  });

  /** The earliest supported year. */
  static readonly minYear = MIN_YEAR;

  /** The latest supported year. */
  static readonly maxYear = MAX_YEAR;

  private constructor(
    /** The calendar year as an integer, e.g. `2024`. */
    readonly value: number,
  ) {}

  /** Creates a year from an integer. Throws when it is out of range. */
  static create(year: number): Year {
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
      throw new Error(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
    }
    return new Year(year);
  }

  static tryParse(input: string | null | undefined): Year | null {
    if (input == null) return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0) return null;

    const match = YEAR_PATTERN.exec(trimmed);
    const digits = match?.groups?.["year"];
    if (digits === undefined) return null;

    const year = Number(digits);
    if (year < MIN_YEAR || year > MAX_YEAR) return null;

    return new Year(year);
  }

  static parse(input: string): Year {
    const result = Year.tryParse(input);
    if (result === null) throw new Error("Invalid year.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Year.tryParse(input) !== null;
  }

  /** The year as a four-digit string, e.g. `2024`. */
  static format(input: string | null | undefined, options?: YearFormatOptions): string | null {
    const parsed = Year.tryParse(input);
    if (parsed !== null) return parsed.toString();
    return fallback(input, options);
  }

  /** The canonical four-digit year, e.g. `2024`. */
  static normalize(input: string | null | undefined, options?: YearFormatOptions): string | null {
    const parsed = Year.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Year.normalize(input) === input;
  }

  toNormalizedString(): string {
    return String(this.value).padStart(4, "0");
  }

  toString(): string {
    return this.toNormalizedString();
  }

  compareTo(other: Year | null | undefined): number {
    if (other == null) return 1;
    return this.value - other.value;
  }

  equals(other: Year | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
}

/** Returns a masked year, e.g. `2024` becomes `****`. */
export function maskYear(year: Year): string {
  void year;
  return "****";
}

function fallback(input: string | null | undefined, options?: YearFormatOptions): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
  if (input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
