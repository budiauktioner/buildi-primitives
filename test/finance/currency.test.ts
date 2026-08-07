import { afterEach, describe, expect, it } from "vitest";
import { Currency, getCurrencyForCountry } from "../../src/finance/index.js";
import { Country } from "../../src/geography/index.js";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";

describe("Currency.isValid", () => {
  it.each(["SEK", "sek", "EUR", "USD", "NOK", "DKK", "GBP", "JPY"])(
    "isValid for known code %s",
    (code) => {
      expect(Currency.isValid(code)).toBe(true);
    },
  );

  it.each([null, "", " ", "XYZ", "ABCD"])("isValid false for %s", (input) => {
    expect(Currency.isValid(input)).toBe(false);
  });
});

describe("Currency.tryParse / parse", () => {
  it.each([
    ["SEK", "SEK", "Swedish krona", "Svensk krona", "kr", 2],
    ["EUR", "EUR", "Euro", "Euro", "€", 2],
    ["JPY", "JPY", "Japanese yen", "Japansk yen", "¥", 0],
    ["ISK", "ISK", "Icelandic króna", "Isländsk krona", "kr", 0],
  ])(
    "parses %s",
    (
      input: string,
      expectedCode: string,
      expectedEn: string,
      expectedSv: string,
      expectedSymbol: string,
      expectedDecimals: number,
    ) => {
      const r = Currency.tryParse(input);
      expect(r).not.toBeNull();
      expect(r!.code).toBe(expectedCode);
      expect(r!.englishName).toBe(expectedEn);
      expect(r!.localizedName).toBe(expectedSv);
      expect(r!.symbol).toBe(expectedSymbol);
      expect(r!.decimalPlaces).toBe(expectedDecimals);
    },
  );

  it.each([
    ["Swedish krona", "SEK"],
    ["Svensk krona", "SEK"],
    ["Euro", "EUR"],
    ["Pound sterling", "GBP"],
    ["Brittiskt pund", "GBP"],
  ])("parses by name %s -> %s", (input, expectedCode) => {
    const r = Currency.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.code).toBe(expectedCode);
  });

  it("is case-insensitive for codes", () => {
    expect(Currency.parse("sek")).toBe(Currency.parse("SEK"));
  });

  it("is case-insensitive for names", () => {
    expect(Currency.parse("swedish krona")).toBe(Currency.parse("Swedish krona"));
  });

  it("Parse throws for unknown input", () => {
    expect(() => Currency.parse("XYZ")).toThrow();
  });
});

describe("Currency format / normalize / display", () => {
  afterEach(() => PrimitivesDefaults.reset());

  it.each([
    ["SEK", "Svensk krona"],
    ["EUR", "Euro"],
    ["GBP", "Brittiskt pund"],
  ])("format %s -> localized %s", (input, expected) => {
    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(Currency.format(input)).toBe(expected);
  });

  it.each([
    ["XYZ", null],
    [null, null],
  ])("format invalid %s -> null", (input, expected) => {
    expect(Currency.format(input)).toBe(expected);
  });

  it("format with fallback returns trimmed input", () => {
    expect(Currency.format("  XYZ  ", { fallbackToTrimmedInputWhenInvalid: true })).toBe("XYZ");
  });

  it.each([
    ["Swedish krona", "SEK"],
    ["EUR", "EUR"],
  ])("normalize %s -> %s", (input, expected) => {
    expect(Currency.normalize(input)).toBe(expected);
  });

  it.each([null, "XYZ"])("normalize invalid %s -> null", (input) => {
    expect(Currency.normalize(input)).toBeNull();
  });

  it("toNormalizedString returns code", () => {
    expect(Currency.parse("SEK").toNormalizedString()).toBe("SEK");
  });

  it("toString returns localized name in Swedish display mode", () => {
    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(Currency.parse("SEK").toString()).toBe("Svensk krona");
  });
});

describe("Currency.all and constants", () => {
  it("all contains expected currencies", () => {
    expect(Currency.all.some((c) => c.code === "SEK")).toBe(true);
    expect(Currency.all.some((c) => c.code === "EUR")).toBe(true);
    expect(Currency.all.some((c) => c.code === "USD")).toBe(true);
    expect(Currency.all.length).toBeGreaterThanOrEqual(40);
  });

  it("static constants return expected codes", () => {
    expect(Currency.SEK.code).toBe("SEK");
    expect(Currency.EUR.code).toBe("EUR");
    expect(Currency.USD.code).toBe("USD");
    expect(Currency.NOK.code).toBe("NOK");
    expect(Currency.DKK.code).toBe("DKK");
    expect(Currency.GBP.code).toBe("GBP");
  });

  it("constants are same instances as parsed", () => {
    expect(Currency.SEK).toBe(Currency.parse("SEK"));
    expect(Currency.EUR).toBe(Currency.parse("EUR"));
    expect(Currency.USD).toBe(Currency.parse("USD"));
  });
});

describe("Currency country lookup", () => {
  it("findByCountry resolves Sweden -> SEK", () => {
    const sweden = Country.parse("SE");
    expect(getCurrencyForCountry(sweden)).toBe(Currency.SEK);
  });

  it("findByCountry resolves Germany -> EUR", () => {
    const germany = Country.parse("DE");
    expect(getCurrencyForCountry(germany)).toBe(Currency.EUR);
  });

  it("Country still exposes currencyCodes string array", () => {
    const se = Country.parse("SE");
    expect(se.currencyCodes).toContain("SEK");
  });
});

describe("Currency equality and ordering", () => {
  it("same code is equal", () => {
    const a = Currency.parse("SEK");
    const b = Currency.parse("SEK");
    expect(a.equals(b)).toBe(true);
  });

  it("different codes are not equal", () => {
    expect(Currency.parse("SEK").equals(Currency.parse("EUR"))).toBe(false);
  });

  it("compareTo orders correctly", () => {
    const a = Currency.parse("EUR");
    const b = Currency.parse("SEK");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(a)).toBe(0);
  });

  it("compareTo null returns positive", () => {
    expect(Currency.parse("USD").compareTo(null)).toBe(1);
  });

  it("nativeName uses the issuing country's own naming", () => {
    expect(Currency.SEK.nativeName).toBe(Currency.SEK.localizedName);
    expect(Currency.USD.nativeName).toBe(Currency.USD.englishName);
  });

  it("toNativeString matches nativeName", () => {
    expect(Currency.SEK.toNativeString()).toBe(Currency.SEK.nativeName);
  });
});
