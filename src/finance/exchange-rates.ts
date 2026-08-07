import { Currency } from "./currency.js";

/** Provides exchange rates between {@link Currency} pairs. */
export interface IExchangeRates {
  /**
   * Returns the exchange rate from `from` to `to`. Returns `1` when both
   * currencies are the same. Throws when no rate is available.
   */
  getRate(from: Currency, to: Currency): number;

  /**
   * Attempts to read a rate. Returns `null` when no rate is available.
   * Returns `1` when both currencies are the same.
   */
  tryGetRate(from: Currency, to: Currency): number | null;
}

/**
 * Dictionary-backed collection of exchange rates. Automatically derives the
 * inverse rate unless an explicit value is added in both directions.
 */
export class ExchangeRates implements IExchangeRates {
  readonly #rates = new Map<string, number>();

  /**
   * Adds a rate from `from` to `to`. A rate of `0.095` from SEK to USD means
   * `1 SEK = 0.095 USD`. Returns `this` for fluent chaining.
   */
  addRate(from: Currency, to: Currency, rate: number): this {
    if (!(rate > 0)) throw new Error("Exchange rate must be positive.");
    this.#rates.set(`${from.code}|${to.code}`, rate);
    const inverseKey = `${to.code}|${from.code}`;
    if (!this.#rates.has(inverseKey)) {
      this.#rates.set(inverseKey, 1 / rate);
    }
    return this;
  }

  getRate(from: Currency, to: Currency): number {
    if (from.code === to.code) return 1;
    const r = this.#rates.get(`${from.code}|${to.code}`);
    if (r === undefined)
      throw new Error(`No exchange rate available from ${from.code} to ${to.code}.`);
    return r;
  }

  tryGetRate(from: Currency, to: Currency): number | null {
    if (from.code === to.code) return 1;
    return this.#rates.get(`${from.code}|${to.code}`) ?? null;
  }
}
