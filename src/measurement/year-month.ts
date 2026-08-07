import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link YearMonth.format} and {@link YearMonth.normalize}. */
export interface YearMonthFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MIN_YEAR = 1000;
const MAX_YEAR = 9999;

const ISO_LIKE_PATTERN =
  /^\s*(?<year>\d{4})[-/](?<month>0?[1-9]|1[0-2])(?:[-/](?<day>0?[1-9]|[12]\d|3[01]))?\s*$/u;
const MONTH_YEAR_NUMERIC_PATTERN = /^\s*(?<month>0?[1-9]|1[0-2])[-/](?<year>\d{4})\s*$/u;
const MONTH_NAME_YEAR_PATTERN = /^\s*(?<name>[A-Za-zÅÄÖåäö]+\.?)\s+(?<year>\d{4})\s*$/u;
const YEAR_MONTH_NAME_PATTERN = /^\s*(?<year>\d{4})\s+(?<name>[A-Za-zÅÄÖåäö]+\.?)\s*$/u;

const MONTH_NAMES = new Map<string, number>([
  ["januari", 1],
  ["februari", 2],
  ["mars", 3],
  ["april", 4],
  ["maj", 5],
  ["juni", 6],
  ["juli", 7],
  ["augusti", 8],
  ["september", 9],
  ["oktober", 10],
  ["november", 11],
  ["december", 12],
  ["january", 1],
  ["february", 2],
  ["march", 3],
  ["may", 5],
  ["june", 6],
  ["july", 7],
  ["august", 8],
  ["october", 10],
  ["jan", 1],
  ["feb", 2],
  ["mar", 3],
  ["apr", 4],
  ["jun", 6],
  ["jul", 7],
  ["aug", 8],
  ["sep", 9],
  ["sept", 9],
  ["okt", 10],
  ["oct", 10],
  ["nov", 11],
  ["dec", 12],
]);

/**
 * A calendar month, held as a year from 1000 to 9999 and a month from 1 to 12.
 *
 * Accepts ISO 8601 (`2026-07`), a full ISO date read at month precision
 * (`2026-07-01`), slash-separated forms (`2026/07`, `07/2026`), and Swedish or
 * English month names (`juli 2026`, `Jul 2026`, `2026 July`).
 *
 * Sources:
 * - https://www.iso.org/iso-8601-date-and-time-format.html
 */
export class YearMonth {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Year-Month",
    localizedName: "Årsmånad",
    emoji: "📅",
    sources: Object.freeze(["https://www.iso.org/iso-8601-date-and-time-format.html"]),
  });

  /** The earliest supported year. */
  static readonly minYear = MIN_YEAR;

  /** The latest supported year. */
  static readonly maxYear = MAX_YEAR;

  private constructor(
    /** The calendar year, e.g. `2026`. */
    readonly year: number,
    /** The calendar month, from 1 to 12. */
    readonly month: number,
  ) {}

  /** Creates a year-month. Throws when either part is out of range. */
  static create(year: number, month: number): YearMonth {
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
      throw new Error(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error("Month must be between 1 and 12.");
    }
    return new YearMonth(year, month);
  }

  /** Creates a year-month from a date, discarding the day. */
  static fromDate(date: Date): YearMonth {
    return YearMonth.create(date.getFullYear(), date.getMonth() + 1);
  }

  static tryParse(input: string | null | undefined): YearMonth | null {
    if (input == null) return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0) return null;

    const iso = ISO_LIKE_PATTERN.exec(trimmed);
    if (iso?.groups !== undefined) {
      const day = iso.groups["day"];
      if (day !== undefined && !isValidDay(iso.groups["year"]!, iso.groups["month"]!, day)) {
        return null;
      }
      return build(iso.groups["year"]!, iso.groups["month"]!);
    }

    const monthYear = MONTH_YEAR_NUMERIC_PATTERN.exec(trimmed);
    if (monthYear?.groups !== undefined) {
      return build(monthYear.groups["year"]!, monthYear.groups["month"]!);
    }

    const nameYear = MONTH_NAME_YEAR_PATTERN.exec(trimmed);
    if (nameYear?.groups !== undefined) {
      const month = tryParseMonthName(nameYear.groups["name"]!);
      if (month !== null) return build(nameYear.groups["year"]!, String(month));
    }

    const yearName = YEAR_MONTH_NAME_PATTERN.exec(trimmed);
    if (yearName?.groups !== undefined) {
      const month = tryParseMonthName(yearName.groups["name"]!);
      if (month !== null) return build(yearName.groups["year"]!, String(month));
    }

    return null;
  }

  static parse(input: string): YearMonth {
    const result = YearMonth.tryParse(input);
    if (result === null) throw new Error("Invalid year-month.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return YearMonth.tryParse(input) !== null;
  }

  /** The canonical ISO 8601 form, e.g. `2026-07`. */
  static format(input: string | null | undefined, options?: YearMonthFormatOptions): string | null {
    const parsed = YearMonth.tryParse(input);
    if (parsed !== null) return parsed.toString();
    return fallback(input, options);
  }

  /** The canonical ISO 8601 form, e.g. `2026-07`. */
  static normalize(
    input: string | null | undefined,
    options?: YearMonthFormatOptions,
  ): string | null {
    const parsed = YearMonth.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && YearMonth.normalize(input) === input;
  }

  toNormalizedString(): string {
    return `${String(this.year).padStart(4, "0")}-${String(this.month).padStart(2, "0")}`;
  }

  toString(): string {
    return this.toNormalizedString();
  }

  /** The first day of the month, as a UTC date. */
  toFirstDayOfMonth(): Date {
    return new Date(Date.UTC(this.year, this.month - 1, 1));
  }

  /** The last day of the month, as a UTC date. */
  toLastDayOfMonth(): Date {
    return new Date(Date.UTC(this.year, this.month, 0));
  }

  compareTo(other: YearMonth | null | undefined): number {
    if (other == null) return 1;
    if (this.year !== other.year) return this.year - other.year;
    return this.month - other.month;
  }

  equals(other: YearMonth | null | undefined): boolean {
    return other != null && this.year === other.year && this.month === other.month;
  }
}

/** Returns a masked year-month, e.g. `2026-07` becomes `****-**`. */
export function maskYearMonth(yearMonth: YearMonth): string {
  void yearMonth;
  return "****-**";
}

function build(yearText: string, monthText: string): YearMonth | null {
  const year = Number(yearText);
  const month = Number(monthText);
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  if (month < 1 || month > 12) return null;
  return YearMonth.create(year, month);
}

function isValidDay(yearText: string, monthText: string, dayText: string): boolean {
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  return day <= daysInMonth(year, month);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function tryParseMonthName(name: string): number | null {
  const key = name.trim().replace(/\.$/u, "").toLowerCase();
  return MONTH_NAMES.get(key) ?? null;
}

function fallback(
  input: string | null | undefined,
  options?: YearMonthFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
  if (input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
