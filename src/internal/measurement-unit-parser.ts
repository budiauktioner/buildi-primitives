/**
 * Splits measurement strings such as `10 km`, `5.5cm` or `3,5 m` into a numeric
 * part and a unit suffix, tolerating both European and US decimal separators
 * plus space, period and comma as thousands separators.
 *
 * Unit lookup is the caller's job — this only hands back the raw suffix.
 *
 * Equivalent of `Buildi.Primitives.Measurement.MeasurementUnitParser`
 * (internal in .NET).
 */

import { Decimal } from "./decimal.js";
import { sanitizeInput } from "./input-sanitization.js";

const MAX_INPUT_LENGTH = 100;

const INPUT_PATTERN = /^(?<sign>[+-])?\s*(?<number>[0-9][0-9 .,]*[0-9]|[0-9])\s*(?<unit>.+)$/u;

/** The numeric value and trailing unit suffix of a measurement string. */
export interface MeasurementSplit {
  readonly value: Decimal;
  readonly unitSuffix: string;
}

/**
 * Splits `input` into a value and a unit suffix, or returns `null` when it does
 * not look like a measurement.
 */
export function trySplitMeasurement(input: string | null | undefined): MeasurementSplit | null {
  if (input == null || input.trim().length === 0) return null;

  const trimmed = sanitizeInput(input).trim();
  if (trimmed.length > MAX_INPUT_LENGTH) return null;

  const match = INPUT_PATTERN.exec(trimmed);
  if (match?.groups === undefined) return null;

  const unitSuffix = (match.groups["unit"] ?? "").trim();
  if (unitSuffix.length === 0) return null;

  const value = tryParseNumber(match.groups["number"] ?? "");
  if (value === null) return null;

  return {
    value: match.groups["sign"] === "-" ? value.negated() : value,
    unitSuffix,
  };
}

const BARE_NUMBER_CHARACTERS = /^[0-9.,\u0020\u00A0]+$/u;

/** Parses a bare number with no unit suffix, e.g. the input to `Count`. */
export function tryParseNumberOnly(input: string | null | undefined): Decimal | null {
  if (input == null || input.trim().length === 0) return null;

  const trimmed = input.trim();
  if (trimmed.length > MAX_INPUT_LENGTH) return null;

  let rest = trimmed;
  let negative = false;
  if (rest.startsWith("-")) {
    negative = true;
    rest = rest.slice(1).trimStart();
  } else if (rest.startsWith("+")) {
    rest = rest.slice(1).trimStart();
  }

  if (rest.length === 0 || !BARE_NUMBER_CHARACTERS.test(rest)) return null;

  const value = tryParseNumber(rest);
  if (value === null) return null;

  return negative ? value.negated() : value;
}

/**
 * Resolves which separator is the decimal point by taking the last one that
 * appears, so both `1.234,5` and `1,234.5` come out as the same value. A group
 * of more than ten digits after the separator is treated as a thousands group
 * rather than a fraction.
 */
function tryParseNumber(raw: string): Decimal | null {
  const s = raw.trim();
  if (s.length === 0) return null;

  const lastComma = s.lastIndexOf(",");
  const lastPeriod = s.lastIndexOf(".");

  let integerPart = s;
  let fractionPart = "";

  if (lastComma > lastPeriod) {
    const afterComma = s.slice(lastComma + 1);
    if (afterComma.length > 0 && afterComma.length <= 10 && /^\d+$/u.test(afterComma)) {
      fractionPart = afterComma;
      integerPart = s.slice(0, lastComma);
    }
  } else if (lastPeriod > lastComma) {
    const afterPeriod = s.slice(lastPeriod + 1);
    if (afterPeriod.length > 0 && afterPeriod.length <= 10 && /^\d+$/u.test(afterPeriod)) {
      fractionPart = afterPeriod;
      integerPart = s.slice(0, lastPeriod);
    }
  }

  const cleanInteger = integerPart.replace(/[ \u00A0.,]/gu, "");
  if (cleanInteger.length === 0 || !/^\d+$/u.test(cleanInteger)) return null;

  return Decimal.parse(fractionPart.length > 0 ? `${cleanInteger}.${fractionPart}` : cleanInteger);
}
