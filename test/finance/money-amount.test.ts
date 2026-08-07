import { afterEach, describe, expect, it } from "vitest";
import { Currency, ExchangeRates, MoneyAmount, maskMoneyAmount } from "../../src/finance/index.js";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";

describe("MoneyAmount.tryParse basic code formats", () => {
  it.each([
    ["1000 SEK", 1000, "SEK"],
    ["1 000 SEK", 1000, "SEK"],
    ["1000SEK", 1000, "SEK"],
    ["SEK1000", 1000, "SEK"],
    ["SEK 1000", 1000, "SEK"],
    ["  1000 SEK  ", 1000, "SEK"],
  ])("parses %s -> %s %s", (input, expectedAmount, expectedCode) => {
    const r = MoneyAmount.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(expectedAmount);
    expect(r!.currency.code).toBe(expectedCode);
  });

  it.each([
    ["1000 kr", 1000, "SEK"],
    ["kr1000", 1000, "SEK"],
    ["kr 1000", 1000, "SEK"],
    ["$500", 500, "USD"],
    ["€1000", 1000, "EUR"],
    ["£250", 250, "GBP"],
  ])("parses symbol %s -> %s %s", (input, expectedAmount, expectedCode) => {
    const r = MoneyAmount.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(expectedAmount);
    expect(r!.currency.code).toBe(expectedCode);
  });

  it.each([
    ["1 000,50 SEK", 1000.5, "SEK"],
    ["1000,50 SEK", 1000.5, "SEK"],
    ["1 000,00 SEK", 1000, "SEK"],
  ])("parses Swedish decimal %s -> %s", (input, expectedAmount, expectedCode) => {
    const r = MoneyAmount.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(expectedAmount);
    expect(r!.currency.code).toBe(expectedCode);
  });

  it.each([
    ["1.000,50 EUR", 1000.5, "EUR"],
    ["10.000,99 EUR", 10000.99, "EUR"],
  ])("parses European format %s -> %s", (input, expectedAmount, expectedCode) => {
    const r = MoneyAmount.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(expectedAmount);
    expect(r!.currency.code).toBe(expectedCode);
  });

  it.each([
    ["1,000.50 USD", 1000.5, "USD"],
    ["10,000.99 USD", 10000.99, "USD"],
  ])("parses US format %s -> %s", (input, expectedAmount, expectedCode) => {
    const r = MoneyAmount.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(expectedAmount);
    expect(r!.currency.code).toBe(expectedCode);
  });

  it.each([
    ["USD500", 500, "USD"],
    ["EUR 1 000", 1000, "EUR"],
    ["GBP100", 100, "GBP"],
  ])("parses prefix code without space %s -> %s", (input, expectedAmount, expectedCode) => {
    const r = MoneyAmount.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(expectedAmount);
    expect(r!.currency.code).toBe(expectedCode);
  });

  it.each([
    ["-1000 SEK", -1000],
    ["+500 SEK", 500],
    ["- 1 000 SEK", -1000],
  ])("parses signed amounts %s -> %s", (input, expectedAmount) => {
    const r = MoneyAmount.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(expectedAmount);
    expect(r!.currency.code).toBe("SEK");
  });

  it("uses fallback currency when string has none", () => {
    const r = MoneyAmount.tryParse("1000", { fallbackCurrency: Currency.SEK });
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(1000);
    expect(r!.currency.code).toBe("SEK");
  });

  it("uses fallback with decimal", () => {
    const r = MoneyAmount.tryParse("1 000,50", { fallbackCurrency: Currency.SEK });
    expect(r).not.toBeNull();
    expect(r!.amount).toBe(1000.5);
    expect(r!.currency.code).toBe("SEK");
  });

  it("ambiguous symbol uses fallback override", () => {
    const r = MoneyAmount.tryParse("1000 kr", { fallbackCurrency: Currency.NOK });
    expect(r).not.toBeNull();
    expect(r!.currency.code).toBe("NOK");
  });

  it("string currency overrides fallback", () => {
    const r = MoneyAmount.tryParse("500 EUR", { fallbackCurrency: Currency.SEK });
    expect(r).not.toBeNull();
    expect(r!.currency.code).toBe("EUR");
  });

  it("fails without currency or fallback", () => {
    expect(MoneyAmount.tryParse("1000")).toBeNull();
  });

  it.each([null, "", " ", "abc", "SEK", "kr"])("returns null for invalid %s", (input) => {
    expect(MoneyAmount.tryParse(input)).toBeNull();
  });
});

describe("MoneyAmount.create", () => {
  it("creates from amount and currency", () => {
    const m = MoneyAmount.create(1500.75, Currency.SEK);
    expect(m.amount).toBe(1500.75);
    expect(m.currency).toBe(Currency.SEK);
  });

  it("throws for unsupported decimal precision", () => {
    expect(() => MoneyAmount.create(1.5, Currency.parse("JPY"))).toThrow();
  });
});

describe("MoneyAmount toString and normalization", () => {
  afterEach(() => PrimitivesDefaults.reset());

  it("toString uses Swedish numeric conventions", () => {
    PrimitivesDefaults.culture = "sv-SE";
    const m = MoneyAmount.create(1000.5, Currency.SEK);
    const s = m.toString();
    expect(s).toContain("SEK");
    expect(s).toContain(",50");
  });

  it("toNormalizedString returns invariant format", () => {
    expect(MoneyAmount.create(1000.5, Currency.SEK).toNormalizedString()).toBe("1000.50 SEK");
  });

  it("toNormalizedString for zero-decimal currency", () => {
    expect(MoneyAmount.create(5000, Currency.parse("JPY")).toNormalizedString()).toBe("5000 JPY");
  });

  it.each([
    ["1000 SEK", "1000 SEK"],
    ["1 000,50 EUR", "1000.50 EUR"],
  ])("normalize %s -> %s", (input, expected) => {
    expect(MoneyAmount.normalize(input)).toBe(expected);
  });

  it.each([
    ["invalid", null],
    [null, null],
  ])("normalize invalid %s -> null", (input, expected) => {
    expect(MoneyAmount.normalize(input)).toBe(expected);
  });

  it("format returns null for invalid", () => {
    expect(MoneyAmount.format("invalid")).toBeNull();
  });

  it("format with fallback returns trimmed input", () => {
    expect(MoneyAmount.format("  invalid  ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "invalid",
    );
  });
});

describe("MoneyAmount.isValid / parse", () => {
  it("isValid with fallback for plain number", () => {
    expect(MoneyAmount.isValid("1000", { fallbackCurrency: Currency.SEK })).toBe(true);
    expect(MoneyAmount.isValid("1000")).toBe(false);
  });

  it("parse throws for invalid", () => {
    expect(() => MoneyAmount.parse("invalid")).toThrow();
  });

  it("parse with fallback succeeds", () => {
    const m = MoneyAmount.parse("1000", { fallbackCurrency: Currency.EUR });
    expect(m.amount).toBe(1000);
    expect(m.currency.code).toBe("EUR");
  });

  it.each(["1.5 JPY", "1,5 JPY", "1.50 CLP"])("rejects unsupported precision %s", (input) => {
    expect(MoneyAmount.tryParse(input)).toBeNull();
  });

  it("rejects unsupported precision for ambiguous symbol fallback", () => {
    expect(MoneyAmount.tryParse("1,25 kr", { fallbackCurrency: Currency.parse("ISK") })).toBeNull();
  });
});

describe("MoneyAmount equality and arithmetic", () => {
  it("same amount and currency are equal", () => {
    const a = MoneyAmount.create(100, Currency.SEK);
    const b = MoneyAmount.create(100, Currency.SEK);
    expect(a.equals(b)).toBe(true);
  });

  it("different amounts not equal", () => {
    expect(
      MoneyAmount.create(100, Currency.SEK).equals(MoneyAmount.create(200, Currency.SEK)),
    ).toBe(false);
  });

  it("different currencies not equal", () => {
    expect(
      MoneyAmount.create(100, Currency.SEK).equals(MoneyAmount.create(100, Currency.EUR)),
    ).toBe(false);
  });

  it("add same currency works", () => {
    const a = MoneyAmount.create(100, Currency.SEK);
    const b = MoneyAmount.create(50, Currency.SEK);
    const sum = a.add(b);
    expect(sum.amount).toBe(150);
    expect(sum.currency.code).toBe("SEK");
  });

  it("add different currency throws", () => {
    const a = MoneyAmount.create(100, Currency.SEK);
    const b = MoneyAmount.create(50, Currency.USD);
    expect(() => a.add(b)).toThrow();
  });

  it("subtract works", () => {
    const a = MoneyAmount.create(100, Currency.SEK);
    const b = MoneyAmount.create(30, Currency.SEK);
    expect(a.subtract(b).amount).toBe(70);
  });

  it("multiply works", () => {
    expect(MoneyAmount.create(100, Currency.SEK).multiply(2).amount).toBe(200);
  });

  it("divide works", () => {
    expect(MoneyAmount.create(100, Currency.SEK).divide(2).amount).toBe(50);
  });

  it("negate works", () => {
    expect(MoneyAmount.create(100, Currency.SEK).negate().amount).toBe(-100);
  });
});

describe("MoneyAmount.convertTo", () => {
  it("converts with explicit rate", () => {
    const sek = MoneyAmount.create(1000, Currency.SEK);
    const usd = sek.convertTo(Currency.parse("USD"), 0.095);
    expect(usd.amount).toBe(95);
    expect(usd.currency.code).toBe("USD");
  });

  it("rounds to target currency decimals", () => {
    const usd = MoneyAmount.create(100, Currency.parse("USD"));
    const jpy = usd.convertTo(Currency.parse("JPY"), 157.35);
    expect(jpy.amount).toBe(15735);
    expect(jpy.currency.code).toBe("JPY");
  });

  it("negative rate throws", () => {
    expect(() => MoneyAmount.create(100, Currency.SEK).convertTo(Currency.USD, -1)).toThrow();
  });

  it("zero rate throws", () => {
    expect(() => MoneyAmount.create(100, Currency.SEK).convertTo(Currency.USD, 0)).toThrow();
  });

  it("convertTo with ExchangeRates uses inverse", () => {
    const rates = new ExchangeRates().addRate(Currency.SEK, Currency.USD, 0.095);
    const usd = MoneyAmount.create(9.5, Currency.USD);
    const sek = usd.convertTo(Currency.SEK, rates);
    expect(sek.amount).toBe(100);
  });

  it("convertTo same currency returns same amount", () => {
    const rates = new ExchangeRates();
    const sek = MoneyAmount.create(100, Currency.SEK);
    expect(sek.convertTo(Currency.SEK, rates).amount).toBe(100);
  });

  it("missing rate throws", () => {
    const rates = new ExchangeRates();
    expect(() => MoneyAmount.create(100, Currency.SEK).convertTo(Currency.USD, rates)).toThrow();
  });
});

describe("ExchangeRates", () => {
  it("addRate with zero rate throws", () => {
    expect(() => new ExchangeRates().addRate(Currency.SEK, Currency.USD, 0)).toThrow();
  });

  it("tryGetRate returns true when available", () => {
    const r = new ExchangeRates().addRate(Currency.SEK, Currency.parse("EUR"), 0.087);
    const result = r.tryGetRate(Currency.SEK, Currency.parse("EUR"));
    expect(result).toBe(0.087);
  });

  it("tryGetRate returns null when missing", () => {
    expect(new ExchangeRates().tryGetRate(Currency.SEK, Currency.parse("EUR"))).toBeNull();
  });

  it("explicit both directions overrides inverse", () => {
    const r = new ExchangeRates()
      .addRate(Currency.SEK, Currency.USD, 0.095)
      .addRate(Currency.USD, Currency.SEK, 10.6);
    expect(r.getRate(Currency.USD, Currency.SEK)).toBe(10.6);
    expect(r.getRate(Currency.SEK, Currency.USD)).toBe(0.095);
  });

  it("fluent chaining works", () => {
    const r = new ExchangeRates()
      .addRate(Currency.SEK, Currency.USD, 0.095)
      .addRate(Currency.SEK, Currency.parse("EUR"), 0.087)
      .addRate(Currency.SEK, Currency.GBP, 0.074);
    expect(r.getRate(Currency.SEK, Currency.USD)).toBe(0.095);
    expect(r.getRate(Currency.SEK, Currency.parse("EUR"))).toBe(0.087);
    expect(r.getRate(Currency.SEK, Currency.GBP)).toBe(0.074);
  });
});

describe("MoneyAmount.compareTo", () => {
  it("orders by amount within same currency", () => {
    const a = MoneyAmount.create(100, Currency.SEK);
    const b = MoneyAmount.create(200, Currency.SEK);
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
  });

  it("orders by currency code first", () => {
    const eur = MoneyAmount.create(100, Currency.parse("EUR"));
    const sek = MoneyAmount.create(100, Currency.SEK);
    expect(eur.compareTo(sek)).toBeLessThan(0);
  });

  it("compareTo null returns positive", () => {
    expect(MoneyAmount.create(100, Currency.SEK).compareTo(null)).toBe(1);
  });
});

describe("maskMoneyAmount", () => {
  it("masks amount preserving currency", () => {
    expect(maskMoneyAmount(MoneyAmount.create(1000.5, Currency.SEK))).toBe("*** SEK");
  });
});
