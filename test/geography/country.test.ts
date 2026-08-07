import { describe, expect, it } from "vitest";
import { Country, Continent } from "../../src/geography/index.js";

describe("Country", () => {
  it.each([
    ["SE", "SE"],
    ["se", "SE"],
    ["SWE", "SE"],
    ["Sweden", "SE"],
    ["Sverige", "SE"],
    ["Germany", "DE"],
    ["Tyskland", "DE"],
    ["Deutschland", "DE"],
    ["DE", "DE"],
    ["DEU", "DE"],
    ["USA", "US"],
    ["UK", "GB"],
    ["Holland", "NL"],
    ["the Netherlands", "NL"],
  ])("tryParse(%s) resolves to %s", (input, alpha2) => {
    expect(Country.tryParse(input)?.alpha2Code).toBe(alpha2);
  });

  it.each([[null], [""], ["  "], ["XX"], ["NotACountry"], ["a".repeat(101)]])(
    "tryParse rejects %s",
    (input) => {
      expect(Country.tryParse(input as string | null)).toBeNull();
    },
  );

  it("isValid is consistent with tryParse", () => {
    expect(Country.isValid("Sweden")).toBe(true);
    expect(Country.isValid("ZZ")).toBe(false);
  });

  it("parse throws on invalid input", () => {
    expect(() => Country.parse("nope")).toThrow("Unknown country.");
  });

  it("normalizes to alpha-2 code", () => {
    expect(Country.normalize("Sweden")).toBe("SE");
    expect(Country.normalize("usa")).toBe("US");
    expect(Country.normalize("nope")).toBeNull();
  });

  it("static instances expose the correct country", () => {
    expect(Country.Sweden.alpha2Code).toBe("SE");
    expect(Country.UnitedKingdom.alpha2Code).toBe("GB");
    expect(Country.Germany.continent).toBe(Continent.Europe);
  });

  it("exposes membership flags", () => {
    expect(Country.Sweden.isInEuropeanUnion).toBe(true);
    expect(Country.Sweden.isInSchengen).toBe(true);
    expect(Country.Sweden.isInNordics).toBe(true);
    expect(Country.UnitedKingdom.isInEuropeanUnion).toBe(false);
    expect(Country.Switzerland.isInSchengen).toBe(true);
    expect(Country.Switzerland.isInEea).toBe(false);
  });

  it("exposes currency metadata", () => {
    expect(Country.Sweden.currencyCode).toBe("SEK");
    expect(Country.Sweden.currency?.code).toBe("SEK");
    expect(Country.Sweden.usesEuro).toBe(false);
    expect(Country.Germany.usesEuro).toBe(true);
    expect(Country.Germany.currencies.map((c) => c.code)).toContain("EUR");
  });

  it("exposes language metadata", () => {
    expect(Country.Sweden.primaryLanguage?.alpha2Code).toBe("sv");
    expect(Country.Germany.officialLanguages.map((l) => l.alpha2Code)).toContain("de");
  });

  it("exposes value, formatted and coordinate shorthands", () => {
    expect(Country.Sweden.value).toBe("SE");
    expect(Country.Sweden.formatted).toBe("Sweden");
    expect(Country.Sweden.latitude).toBeCloseTo(Country.Sweden.coordinate.latitude);
    expect(Country.Sweden.longitude).toBeCloseTo(Country.Sweden.coordinate.longitude);
  });

  it("toNormalizedString returns alpha-2", () => {
    expect(Country.Sweden.toNormalizedString()).toBe("SE");
  });

  it("looks up by phone calling code", () => {
    expect(Country.tryFindByCallingCode("46")?.alpha2Code).toBe("SE");
    expect(Country.tryFindByCallingCode("1")?.alpha2Code).toBe("US");
    expect(Country.tryFindByCallingCode("44")?.alpha2Code).toBe("GB");
    expect(Country.tryFindByCallingCode("7")?.alpha2Code).toBe("RU");
    expect(Country.tryFindByCallingCode(null)).toBeNull();
  });

  it("findNeighbors returns nearby countries excluding self", () => {
    const neighbors = Country.Sweden.findNeighbors(2000);
    expect(neighbors.length).toBeGreaterThan(0);
    expect(neighbors.every((d) => d.country.alpha2Code !== "SE")).toBe(true);
    const codes = neighbors.map((d) => d.country.alpha2Code);
    expect(codes).toContain("NO");
    expect(codes).toContain("FI");
    expect(codes).toContain("DK");
  });

  it("equals and compareTo work", () => {
    const a = Country.parse("SE");
    const b = Country.parse("Sweden");
    expect(a.equals(b)).toBe(true);
    // alpha-2 ordering: "NO" < "SE"
    expect(Country.Norway.compareTo(Country.Sweden)).toBeLessThan(0);
  });

  it("findCandidatesInText finds country names", () => {
    const text = "I went from Sweden to Germany via Denmark.";
    const candidates = Country.findCandidatesInText(text);
    const codes = candidates.map((c) => c.value.alpha2Code).sort();
    expect(codes).toContain("SE");
    expect(codes).toContain("DE");
    expect(codes).toContain("DK");
  });

  it("all countries have valid coordinates and continents", () => {
    for (const c of Country.all) {
      expect(c.coordinate).toBeDefined();
      expect(c.continent).toBeInstanceOf(Continent);
    }
  });
});
