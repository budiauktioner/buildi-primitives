import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { Currency } from "./currency.js";
import { ExchangeRates, type IExchangeRates } from "./exchange-rates.js";

const MAX_INPUT_LENGTH = 100;
const PRECISION_EPSILON = 1e-9;

interface ParseOptions {
  fallbackCurrency?: Currency | null;
}

interface FormatOptions extends ParseOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * A monetary amount composed of a numeric value and a {@link Currency}.
 *
 * Note: JavaScript has no native arbitrary-precision decimal. Amounts are
 * stored as `number` (IEEE-754 double). Parsing and arithmetic round to the
 * currency's decimal places to keep results predictable.
 */
export class MoneyAmount {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Money Amount",
    localizedName: "Belopp",
    emoji: "\u{1F4B0}",
    sources: Object.freeze(["https://www.iso.org/iso-4217-currency-codes.html"]),
  });

  readonly amount: number;
  readonly currency: Currency;

  private constructor(amount: number, currency: Currency) {
    this.amount = amount;
    this.currency = currency;
  }

  /** Creates a {@link MoneyAmount} from an explicit amount and currency. */
  static create(amount: number, currency: Currency): MoneyAmount {
    if (!hasSupportedPrecision(amount, currency.decimalPlaces)) {
      throw new Error(
        `Currency ${currency.code} supports at most ${currency.decimalPlaces} decimal places.`,
      );
    }
    return new MoneyAmount(amount, currency);
  }

  static tryParse(input: string | null | undefined, options?: ParseOptions): MoneyAmount | null {
    if (input == null || input.trim() === "") return null;
    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length > MAX_INPUT_LENGTH) return null;

    const fallback = options?.fallbackCurrency ?? null;
    const split = splitCurrencyAndNumber(trimmed, fallback);
    if (split === null) return null;

    const amount = tryParseNumber(split.numberPart, split.currency);
    if (amount === null) return null;

    return new MoneyAmount(amount, split.currency);
  }

  static parse(input: string, options?: ParseOptions): MoneyAmount {
    const r = MoneyAmount.tryParse(input, options);
    if (r === null) throw new Error("Invalid money amount.");
    return r;
  }

  static isValid(input: string | null | undefined, options?: ParseOptions): boolean {
    return MoneyAmount.tryParse(input, options) !== null;
  }

  /** Returns the amount formatted using the default culture's numeric conventions, e.g. `1 000,00 SEK`. */
  static format(input: string | null | undefined, options?: FormatOptions): string | null {
    const r = MoneyAmount.tryParse(input, options);
    if (r) return r.toString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  /** Returns the amount as a plain decimal string with the ISO code, e.g. `1000.50 SEK`. */
  static normalize(input: string | null | undefined, options?: FormatOptions): string | null {
    const r = MoneyAmount.tryParse(input, options);
    if (r) return r.toNormalizedString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && MoneyAmount.normalize(input) === input;
  }

  /** `1000.50 SEK` (invariant culture). */
  toNormalizedString(): string {
    return `${formatInvariant(this.amount, this.currency.decimalPlaces)} ${this.currency.code}`;
  }

  /** `1 000,00 SEK` (current culture). */
  toString(): string {
    const formatted = new Intl.NumberFormat(PrimitivesDefaults.culture, {
      minimumFractionDigits: this.currency.decimalPlaces,
      maximumFractionDigits: this.currency.decimalPlaces,
      useGrouping: true,
    }).format(this.amount);
    return `${formatted} ${this.currency.code}`;
  }

  // --- Arithmetic ---

  add(other: MoneyAmount): MoneyAmount {
    if (this.currency.code !== other.currency.code) {
      throw new Error(`Cannot add ${this.currency.code} and ${other.currency.code}.`);
    }
    return new MoneyAmount(
      roundTo(this.amount + other.amount, this.currency.decimalPlaces),
      this.currency,
    );
  }

  subtract(other: MoneyAmount): MoneyAmount {
    if (this.currency.code !== other.currency.code) {
      throw new Error(`Cannot subtract ${other.currency.code} from ${this.currency.code}.`);
    }
    return new MoneyAmount(
      roundTo(this.amount - other.amount, this.currency.decimalPlaces),
      this.currency,
    );
  }

  multiply(factor: number): MoneyAmount {
    return new MoneyAmount(
      roundTo(this.amount * factor, this.currency.decimalPlaces),
      this.currency,
    );
  }

  divide(divisor: number): MoneyAmount {
    if (divisor === 0) throw new Error("Division by zero.");
    return new MoneyAmount(
      roundTo(this.amount / divisor, this.currency.decimalPlaces),
      this.currency,
    );
  }

  negate(): MoneyAmount {
    return new MoneyAmount(-this.amount, this.currency);
  }

  /**
   * Converts this amount to `target` using either an explicit rate or an
   * {@link IExchangeRates} provider. The result is rounded to the target
   * currency's decimal places using half-up rounding.
   */
  convertTo(target: Currency, rateOrRates: number | IExchangeRates): MoneyAmount {
    let rate: number;
    if (typeof rateOrRates === "number") {
      rate = rateOrRates;
    } else {
      rate = rateOrRates.getRate(this.currency, target);
    }
    if (!(rate > 0)) throw new Error("Exchange rate must be positive.");
    const converted = roundTo(this.amount * rate, target.decimalPlaces);
    return new MoneyAmount(converted, target);
  }

  // --- Equality / ordering ---

  equals(other: MoneyAmount | null | undefined): boolean {
    return (
      other != null && this.amount === other.amount && this.currency.code === other.currency.code
    );
  }

  compareTo(other: MoneyAmount | null | undefined): number {
    if (other == null) return 1;
    const c =
      this.currency.code < other.currency.code
        ? -1
        : this.currency.code > other.currency.code
          ? 1
          : 0;
    if (c !== 0) return c;
    return this.amount < other.amount ? -1 : this.amount > other.amount ? 1 : 0;
  }
}

// --- Helpers ---

function hasSupportedPrecision(amount: number, decimalPlaces: number): boolean {
  if (!Number.isFinite(amount)) return false;
  const factor = Math.pow(10, decimalPlaces);
  const rounded = Math.round(amount * factor) / factor;
  if (Math.abs(amount - rounded) > Math.max(Math.abs(amount), 1) * PRECISION_EPSILON) {
    return false;
  }
  return true;
}

function roundTo(amount: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(amount * factor) / factor;
}

function formatInvariant(amount: number, decimalPlaces: number): string {
  if (decimalPlaces === 0 || Number.isInteger(amount)) {
    return Math.round(amount).toString();
  }
  return amount.toFixed(decimalPlaces);
}

interface SplitResult {
  currency: Currency;
  numberPart: string;
}

function splitCurrencyAndNumber(input: string, fallback: Currency | null): SplitResult | null {
  // Try ISO code or symbol as prefix.
  const prefix = tryMatchPrefix(input, fallback);
  if (prefix) return prefix;

  // Try ISO code or symbol as suffix.
  const suffix = tryMatchSuffix(input, fallback);
  if (suffix) return suffix;

  if (fallback === null) return null;
  return { currency: fallback, numberPart: input };
}

function isLatinLetter(ch: string): boolean {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  return (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);
}

function tryMatchPrefix(input: string, fallback: Currency | null): SplitResult | null {
  // 3-letter code prefix: "SEK1000", "SEK 1000".
  if (
    input.length >= 4 &&
    isLatinLetter(input[0]!) &&
    isLatinLetter(input[1]!) &&
    isLatinLetter(input[2]!)
  ) {
    const code = input.slice(0, 3);
    const rest = input.slice(3).replace(/^\s+/, "");
    if (rest.length > 0) {
      const c = Currency.tryParse(code);
      if (c) return { currency: c, numberPart: rest };
    }
  }

  // Symbol prefix: "$500", "kr 1000".
  return tryResolveSymbolPrefix(input, fallback);
}

function tryMatchSuffix(input: string, fallback: Currency | null): SplitResult | null {
  if (
    input.length >= 4 &&
    isLatinLetter(input[input.length - 1]!) &&
    isLatinLetter(input[input.length - 2]!) &&
    isLatinLetter(input[input.length - 3]!)
  ) {
    const code = input.slice(-3);
    const rest = input.slice(0, -3).replace(/\s+$/, "");
    if (rest.length > 0) {
      const c = Currency.tryParse(code);
      if (c) return { currency: c, numberPart: rest };
    }
  }

  return tryResolveSymbolSuffix(input, fallback);
}

function getDistinctSymbols(): string[] {
  const seen = new Set<string>();
  for (const c of Currency.all) {
    seen.add(c.symbol.toLowerCase());
  }
  return Array.from(seen).sort((a, b) => b.length - a.length);
}

function tryResolveSymbolPrefix(input: string, fallback: Currency | null): SplitResult | null {
  const inputLower = input.toLowerCase();
  for (const symbol of getDistinctSymbols()) {
    if (!inputLower.startsWith(symbol)) continue;
    const rest = input.slice(symbol.length).replace(/^\s+/, "");
    if (rest.length === 0) return null;
    const currency = resolveCurrencyForSymbol(symbol, fallback);
    if (!currency) continue;
    return { currency, numberPart: rest };
  }
  return null;
}

function tryResolveSymbolSuffix(input: string, fallback: Currency | null): SplitResult | null {
  const inputLower = input.toLowerCase();
  for (const symbol of getDistinctSymbols()) {
    if (!inputLower.endsWith(symbol)) continue;
    const rest = input.slice(0, input.length - symbol.length).replace(/\s+$/, "");
    if (rest.length === 0) return null;
    const currency = resolveCurrencyForSymbol(symbol, fallback);
    if (!currency) continue;
    return { currency, numberPart: rest };
  }
  return null;
}

function resolveCurrencyForSymbol(symbol: string, fallback: Currency | null): Currency | null {
  if (fallback && fallback.symbol.toLowerCase() === symbol) return fallback;
  for (const c of Currency.all) {
    if (c.symbol.toLowerCase() === symbol) return c;
  }
  return null;
}

function tryParseNumber(raw: string, currency: Currency): number | null {
  let s = raw.trim();
  if (s.length === 0) return null;

  let negative = false;
  if (s[0] === "-") {
    negative = true;
    s = s.slice(1).replace(/^\s+/, "");
  } else if (s[0] === "+") {
    s = s.slice(1).replace(/^\s+/, "");
  }

  if (s.length === 0) return null;

  const lastComma = s.lastIndexOf(",");
  const lastPeriod = s.lastIndexOf(".");

  let integerPart: string;
  let fracPart = "";

  if (lastComma > lastPeriod) {
    const afterComma = s.slice(lastComma + 1);
    if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
      fracPart = afterComma;
      integerPart = s.slice(0, lastComma);
    } else {
      integerPart = s;
    }
  } else if (lastPeriod > lastComma) {
    const afterPeriod = s.slice(lastPeriod + 1);
    if (afterPeriod.length <= 2 && /^\d+$/.test(afterPeriod)) {
      fracPart = afterPeriod;
      integerPart = s.slice(0, lastPeriod);
    } else {
      integerPart = s;
    }
  } else {
    integerPart = s;
  }

  const cleanInteger = integerPart.replace(/[\s\u00A0.,]/g, "");
  if (cleanInteger.length === 0 || !/^\d+$/.test(cleanInteger)) return null;

  if (fracPart.length > currency.decimalPlaces) return null;

  const combined = fracPart.length > 0 ? `${cleanInteger}.${fracPart}` : cleanInteger;
  const parsed = Number(combined);
  if (!Number.isFinite(parsed)) return null;
  if (!hasSupportedPrecision(parsed, currency.decimalPlaces)) return null;

  return negative ? -parsed : parsed;
}

/** Mask a money amount preserving the currency, e.g. `1 000,00 SEK` → `*** SEK`. */
export function maskMoneyAmount(amount: MoneyAmount): string {
  return `*** ${amount.currency.code}`;
}

// Re-export here for the rare case someone imports MoneyAmount and uses the rates type.
export { ExchangeRates };
