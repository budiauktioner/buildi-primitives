import { afterEach, describe, expect, it } from "vitest";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";
import { Continent, Country } from "../../src/geography/index.js";

describe("Continent", () => {
  afterEach(() => PrimitivesDefaults.reset());

  it.each([
    "AF",
    "AN",
    "AS",
    "EU",
    "NA",
    "OC",
    "SA",
    "Africa",
    "Antarctica",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America",
    "Afrika",
    "Antarktis",
    "Asien",
    "Europa",
    "Nordamerika",
    "Oceanien",
    "Sydamerika",
    "eu",
    "europe",
    " EU ",
  ])("isValid accepts %s", (input) => {
    expect(Continent.isValid(input)).toBe(true);
  });

  it.each([[null], [""], [" "], ["XX"], ["Atlantis"], ["Eurasia"]])(
    "isValid rejects %s",
    (input) => {
      expect(Continent.isValid(input as string | null)).toBe(false);
      expect(Continent.tryParse(input as string | null)).toBeNull();
    },
  );

  it.each([
    ["AF", "AF", "Africa", "Afrika"],
    ["Africa", "AF", "Africa", "Afrika"],
    ["Afrika", "AF", "Africa", "Afrika"],
    ["EU", "EU", "Europe", "Europa"],
    ["Europe", "EU", "Europe", "Europa"],
    ["Europa", "EU", "Europe", "Europa"],
    ["NA", "NA", "North America", "Nordamerika"],
    ["North America", "NA", "North America", "Nordamerika"],
    ["Nordamerika", "NA", "North America", "Nordamerika"],
    ["SA", "SA", "South America", "Sydamerika"],
    ["South America", "SA", "South America", "Sydamerika"],
    ["Sydamerika", "SA", "South America", "Sydamerika"],
  ])("tryParse(%s) returns expected properties", (input, code, english, localized) => {
    const result = Continent.tryParse(input);
    expect(result?.code).toBe(code);
    expect(result?.englishName).toBe(english);
    expect(result?.localizedName).toBe(localized);
  });

  it("parse throws for invalid inputs", () => {
    expect(() => Continent.parse("")).toThrow("Unknown continent.");
    expect(() => Continent.parse("Atlantis")).toThrow("Unknown continent.");
  });

  it.each([
    ["EU", "EU"],
    ["Europe", "EU"],
    ["Europa", "EU"],
    ["eu", "EU"],
    [" EU ", "EU"],
    [null, null],
    ["", null],
    ["XX", null],
  ])("normalize(%s) returns %s", (input, expected) => {
    expect(Continent.normalize(input as string | null)).toBe(expected);
  });

  it("normalize can fall back to trimmed invalid input", () => {
    expect(Continent.normalize("XX", { fallbackToTrimmedInputWhenInvalid: true })).toBe("XX");
    expect(Continent.normalize(" bogus ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "bogus",
    );
  });

  it.each([
    ["EU", true],
    ["AF", true],
    ["Europe", false],
    ["eu", false],
    [null, false],
  ])("isNormalized(%s) returns %s", (input, expected) => {
    expect(Continent.isNormalized(input as string | null)).toBe(expected);
  });

  it("format and toString follow UI culture", () => {
    PrimitivesDefaults.uiCulture = "en-US";
    expect(Continent.format("EU")).toBe("Europe");
    expect(Continent.Europe.toString()).toBe("Europe");

    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(Continent.format("EU")).toBe("Europa");
    expect(Continent.Europe.toString()).toBe("Europa");
  });

  it("format returns null or fallback for invalid input", () => {
    expect(Continent.format(null)).toBeNull();
    expect(Continent.format("")).toBeNull();
    expect(Continent.format("XX")).toBeNull();
    expect(Continent.format("Atlantis", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "Atlantis",
    );
  });

  it("exposes all continents and normalized values", () => {
    expect(Continent.all).toHaveLength(7);
    expect(Continent.Europe.toNormalizedString()).toBe("EU");
    expect(Continent.Africa.toNormalizedString()).toBe("AF");
  });

  it("country continent returns expected continent", () => {
    expect(Country.parse("SE").continent).toBe(Continent.Europe);
    expect(Country.parse("SE").continent.code).toBe("EU");
  });

  it("equals and compareTo match code identity", () => {
    const a = Continent.parse("EU");
    const b = Continent.parse("Europe");
    expect(a.equals(b)).toBe(true);
    expect(Continent.Europe.equals(Continent.Asia)).toBe(false);
    expect(Continent.Africa.compareTo(Continent.Europe)).toBeLessThan(0);
    expect(Continent.Europe.compareTo(Continent.Africa)).toBeGreaterThan(0);
    expect(Continent.Europe.compareTo(null)).toBe(1);
  });
});
