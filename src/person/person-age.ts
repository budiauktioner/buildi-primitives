import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { Clock, systemClock } from "../internal/clock.js";

const MAX_YEARS = 200;
const DAYS_PER_YEAR = 365;
const DAYS_PER_MONTH = 30;
const MAX_TOTAL_DAYS = MAX_YEARS * DAYS_PER_YEAR;

const YEARS_PATTERN = /^\s*(\d+(?:[.,]\d+)?)\s*(?:år|years?)?\s*$/iu;
const MONTHS_PATTERN = /^\s*(\d+)\s+(?:månader?|månad|months?)\s*$/iu;
const DAYS_PATTERN = /^\s*(\d+)\s+(?:dagar?|dag|days?)\s*$/iu;

/** A person's age (`ålder`). */
export class PersonAge {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Age",
    localizedName: "Ålder",
    emoji: "\u{1F382}",
    sources: Object.freeze([
      "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/foraldrabalk-1949381_sfs-1949-381/",
      "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/brottsbalk-1962700_sfs-1962-700/",
    ]),
  });

  readonly years: number;
  readonly totalMonths: number;
  readonly totalDays: number;

  get isOfSwedishLegalAge(): boolean {
    return this.years >= 18;
  }
  get isSwedishCriminallyResponsible(): boolean {
    return this.years >= 15;
  }
  get isOfSwedishRetirementAge(): boolean {
    return this.years >= 65;
  }

  private constructor(years: number, totalMonths: number, totalDays: number) {
    this.years = years;
    this.totalMonths = totalMonths;
    this.totalDays = totalDays;
  }

  static tryParse(input: string | null | undefined): PersonAge | null {
    if (input == null || input.trim() === "") return null;
    const sanitized = input.trim();
    if (sanitized.length > 50) return null;

    let m = DAYS_PATTERN.exec(sanitized);
    if (m) {
      const d = parseInt(m[1]!, 10);
      return tryFromDays(d);
    }
    m = MONTHS_PATTERN.exec(sanitized);
    if (m) {
      const months = parseInt(m[1]!, 10);
      return tryFromMonths(months);
    }
    m = YEARS_PATTERN.exec(sanitized);
    if (m) {
      const value = parseFloat(m[1]!.replace(",", "."));
      if (!Number.isFinite(value) || value < 0) return null;
      const intYears = Math.trunc(value);
      if (value === intYears) return tryFromYears(intYears);
      return tryFromDays(Math.trunc(value * DAYS_PER_YEAR));
    }
    return null;
  }

  static parse(input: string): PersonAge {
    const r = PersonAge.tryParse(input);
    if (r === null) throw new Error("Invalid person age.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return PersonAge.tryParse(input) !== null;
  }

  static fromYears(years: number): PersonAge {
    if (years < 0 || years > MAX_YEARS || !Number.isInteger(years)) {
      throw new RangeError(`Years must be between 0 and ${MAX_YEARS}.`);
    }
    return new PersonAge(years, years * 12, years * DAYS_PER_YEAR);
  }

  static fromMonths(months: number): PersonAge {
    if (months < 0 || months > MAX_YEARS * 12 || !Number.isInteger(months)) {
      throw new RangeError(`Months must be between 0 and ${MAX_YEARS * 12}.`);
    }
    return new PersonAge(Math.trunc(months / 12), months, months * DAYS_PER_MONTH);
  }

  static fromDays(days: number): PersonAge {
    if (days < 0 || days > MAX_TOTAL_DAYS || !Number.isInteger(days)) {
      throw new RangeError(`Days must be between 0 and ${MAX_TOTAL_DAYS}.`);
    }
    return new PersonAge(Math.trunc(days / DAYS_PER_YEAR), Math.trunc(days / DAYS_PER_MONTH), days);
  }

  /**
   * Build a {@link PersonAge} from a birth date and an optional reference date.
   * `birthDate` and `referenceDate` are interpreted as UTC midnights of the date
   * portion of the supplied {@link Date} values.
   */
  static fromBirthDate(
    birthDate: Date,
    options?: { referenceDate?: Date; clock?: Clock },
  ): PersonAge {
    const ref = options?.referenceDate ?? options?.clock?.now() ?? systemClock.now();
    const birth = new Date(
      Date.UTC(birthDate.getUTCFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate()),
    );
    const today = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
    if (birth > today)
      throw new RangeError("Birth date cannot be in the future relative to the reference date.");

    const totalDays = Math.floor((today.getTime() - birth.getTime()) / 86400000);
    let years = today.getUTCFullYear() - birth.getUTCFullYear();
    if (
      today.getUTCMonth() < birth.getUTCMonth() ||
      (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())
    ) {
      years--;
    }
    let monthDate = new Date(
      Date.UTC(birth.getUTCFullYear() + years, birth.getUTCMonth(), birth.getUTCDate()),
    );
    let months = 0;
    while (true) {
      const next = new Date(monthDate);
      next.setUTCMonth(next.getUTCMonth() + 1);
      if (next > today) break;
      monthDate = next;
      months++;
    }
    return new PersonAge(years, years * 12 + months, totalDays);
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = PersonAge.tryParse(input);
    if (r) return r.toString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = PersonAge.tryParse(input);
    if (r) return r.toNormalizedString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && PersonAge.normalize(input) === input;
  }

  toNormalizedString(): string {
    return String(this.years);
  }

  toString(): string {
    return this.years >= 1 ? `${this.years} år` : `${this.totalMonths} månader`;
  }

  equals(other: PersonAge | null | undefined): boolean {
    return other != null && this.totalDays === other.totalDays;
  }
  compareTo(other: PersonAge | null | undefined): number {
    if (other == null) return 1;
    return this.totalDays - other.totalDays;
  }
}

function tryFromYears(years: number): PersonAge | null {
  if (years < 0 || years > MAX_YEARS) return null;
  return PersonAge.fromYears(years);
}

function tryFromMonths(months: number): PersonAge | null {
  if (months < 0 || months > MAX_YEARS * 12) return null;
  if (months * DAYS_PER_MONTH > MAX_TOTAL_DAYS) return null;
  return PersonAge.fromMonths(months);
}

function tryFromDays(days: number): PersonAge | null {
  if (days < 0 || days > MAX_TOTAL_DAYS) return null;
  return PersonAge.fromDays(days);
}
