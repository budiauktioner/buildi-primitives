/**
 * Local parser for Swedish personnummer and samordningsnummer.
 *
 * Replaces the .NET dependency on ActiveLogin.Identity with an in-house
 * implementation that supports the same input shapes:
 *
 * - 12 digits: `199908072391`
 * - 10 digits: `9908072391` (century inferred)
 * - Separator forms: `YYMMDD-NNNC` or `YYYYMMDD-NNNC`. The separator may be
 *   `-` (standard) or `+` (used when the person is 100 years or older;
 *   only valid when the input was given in 10-digit form).
 *
 * For coordination numbers (`samordningsnummer`) the day-of-month is shifted
 * by 60 (i.e. real day = day - 60), so valid days for coordination numbers
 * are 61-91 (or 60 when day-of-month is unknown).
 */

import { luhnIsValid } from "../internal/luhn.js";
import { Clock, systemClock } from "../internal/clock.js";

const defaultClock: Clock = systemClock;

export type PinKind = "personal" | "coordination";

export interface ParsedPin {
  kind: PinKind;
  /** Full 4-digit year. */
  year: number;
  /** 1-12. */
  month: number;
  /**
   * For personal numbers: 1-31. For coordination numbers: realDay (1-31) or
   * `0` when the day-of-month is unknown (raw day was 60).
   */
  realDay: number;
  /** Three-digit individual number. */
  individual: string;
  /** Single check digit. */
  checkDigit: string;
  /** Whether the input had a `+` separator (indicates 100+ years old at parse time). */
  hadPlusSeparator: boolean;
}

const TWELVE = /^(\d{4})(\d{2})(\d{2})(\d{3})(\d)$/;
const TEN = /^(\d{2})(\d{2})(\d{2})(\d{3})(\d)$/;
const TEN_WITH_SEP = /^(\d{2})(\d{2})(\d{2})([-+])(\d{3})(\d)$/;
const TWELVE_WITH_SEP = /^(\d{4})(\d{2})(\d{2})([-+])(\d{3})(\d)$/;

export function parsePin(input: string, clock: Clock = defaultClock): ParsedPin | null {
  if (!input) return null;
  const cleaned = input.trim();
  if (cleaned.length === 0) return null;

  let year: number, month: number, day: number;
  let individual: string, check: string;
  let hadPlus = false;
  let isTwelve = false;

  let m = TWELVE.exec(cleaned);
  if (m) {
    year = +m[1]!;
    month = +m[2]!;
    day = +m[3]!;
    individual = m[4]!;
    check = m[5]!;
    isTwelve = true;
  } else if ((m = TEN.exec(cleaned))) {
    const yy = +m[1]!;
    year = inferCenturyForTenDigit(yy, false, clock);
    month = +m[2]!;
    day = +m[3]!;
    individual = m[4]!;
    check = m[5]!;
  } else if ((m = TEN_WITH_SEP.exec(cleaned))) {
    const yy = +m[1]!;
    hadPlus = m[4] === "+";
    year = inferCenturyForTenDigit(yy, hadPlus, clock);
    month = +m[2]!;
    day = +m[3]!;
    individual = m[5]!;
    check = m[6]!;
  } else if ((m = TWELVE_WITH_SEP.exec(cleaned))) {
    year = +m[1]!;
    month = +m[2]!;
    day = +m[3]!;
    individual = m[5]!;
    check = m[6]!;
    if (m[4] === "+") return null;
  } else {
    return null;
  }

  if (month < 1 || month > 12) return null;

  const isCoordination = day >= 60 && day <= 91;
  let realDay: number;
  let kind: PinKind;
  if (isCoordination) {
    kind = "coordination";
    realDay = day === 60 ? 0 : day - 60;
    if (realDay !== 0 && !isValidDay(year, month, realDay)) return null;
  } else {
    kind = "personal";
    if (!isValidDay(year, month, day)) return null;
    realDay = day;
  }

  const luhnInput =
    String(year % 100).padStart(2, "0") +
    String(month).padStart(2, "0") +
    String(day).padStart(2, "0") +
    individual +
    check;
  if (!luhnIsValid(luhnInput)) return null;

  // 12-digit form must use a 4-digit year that matches the inferred century.
  if (isTwelve && (year < 1800 || year > 2200)) return null;

  return {
    kind,
    year,
    month,
    realDay,
    individual,
    checkDigit: check,
    hadPlusSeparator: hadPlus,
  };
}

function isValidDay(year: number, month: number, day: number): boolean {
  if (day < 1) return false;
  const dim = daysInMonth(year, month);
  return day <= dim;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function inferCenturyForTenDigit(yy: number, plusSeparator: boolean, clock: Clock): number {
  const now = clock.now();
  const currentYear = now.getUTCFullYear();
  const currentCentury = Math.floor(currentYear / 100);
  const candidate = currentCentury * 100 + yy;
  let year = candidate;
  if (year > currentYear) year -= 100;
  if (plusSeparator) year -= 100;
  return year;
}

/** Build the canonical 12-digit form. */
export function pinTo12Digit(p: ParsedPin): string {
  const day = p.kind === "coordination" ? (p.realDay === 0 ? 60 : p.realDay + 60) : p.realDay;
  return (
    String(p.year).padStart(4, "0") +
    String(p.month).padStart(2, "0") +
    String(day).padStart(2, "0") +
    p.individual +
    p.checkDigit
  );
}

/** Build the canonical 10-digit display form (`YYMMDD-NNNC` or `YYMMDD+NNNC`). */
export function pinTo10Digit(p: ParsedPin, clock: Clock = defaultClock): string {
  const day = p.kind === "coordination" ? (p.realDay === 0 ? 60 : p.realDay + 60) : p.realDay;
  const yy = String(p.year % 100).padStart(2, "0");
  const sep = ageInYears(p, clock) >= 100 ? "+" : "-";
  return (
    yy +
    String(p.month).padStart(2, "0") +
    String(day).padStart(2, "0") +
    sep +
    p.individual +
    p.checkDigit
  );
}

function ageInYears(p: ParsedPin, clock: Clock): number {
  if (p.kind === "coordination" && p.realDay === 0) return 0;
  const now = clock.now();
  const day = p.kind === "coordination" ? p.realDay : p.realDay;
  const birth = new Date(Date.UTC(p.year, p.month - 1, day || 1));
  const ms = now.getTime() - birth.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

/** Estimate gender. The third digit of the individual portion is even for female, odd for male. */
export function pinGender(p: ParsedPin): "female" | "male" {
  const d = parseInt(p.individual.charAt(p.individual.length - 1), 10);
  return d % 2 === 0 ? "female" : "male";
}

/** Best-effort date of birth (`null` if coordination day is unknown). */
export function pinDateOfBirth(p: ParsedPin): Date | null {
  if (p.kind === "coordination" && p.realDay === 0) return null;
  return new Date(Date.UTC(p.year, p.month - 1, p.realDay));
}

/** Age in whole years (`null` if coordination day is unknown). */
export function pinAgeInYears(p: ParsedPin, clock: Clock = defaultClock): number | null {
  if (p.kind === "coordination" && p.realDay === 0) return null;
  return ageInYears(p, clock);
}
