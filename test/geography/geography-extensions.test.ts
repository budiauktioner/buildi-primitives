import { describe, expect, it } from "vitest";
import {
  SwedishCounty,
  SwedishMunicipality,
  getAdjacentCounties,
  getAdjacentMunicipalities,
  getMunicipalities,
  maskGeoCoordinate,
  maskSwedishCounty,
  maskSwedishMunicipality,
  GeoCoordinate,
  Continent,
  Country,
  getBorderingCountries,
  getCountries,
} from "../../src/geography/index.js";

describe("geography-extensions", () => {
  it("getMunicipalities returns all municipalities for a county", () => {
    const stockholm = SwedishCounty.parse("01");
    const ms = getMunicipalities(stockholm);
    expect(ms.length).toBeGreaterThan(20);
    expect(ms.every((m) => m.countyCode === "01")).toBe(true);
  });

  it("getAdjacentCounties returns neighbors", () => {
    const sk = SwedishCounty.parse("12"); // Skåne
    const adj = getAdjacentCounties(sk);
    const codes = adj.map((c) => c.code);
    expect(codes).toContain("13"); // Halland
    expect(codes).toContain("10"); // Blekinge
  });

  it("Gotland has no adjacent counties", () => {
    expect(getAdjacentCounties(SwedishCounty.parse("09"))).toHaveLength(0);
  });

  it("getAdjacentMunicipalities returns neighbors", () => {
    const malmo = SwedishMunicipality.parse("Malmö");
    const adj = getAdjacentMunicipalities(malmo);
    expect(adj.length).toBeGreaterThan(0);
  });

  it("getBorderingCountries returns land-border neighbors", () => {
    expect(getBorderingCountries(Country.Sweden).map((c) => c.alpha2Code)).toEqual(["FI", "NO"]);
    expect(
      getBorderingCountries(Country.Germany)
        .map((c) => c.alpha2Code)
        .sort(),
    ).toEqual(["AT", "BE", "CH", "CZ", "DK", "FR", "LU", "NL", "PL"]);
    expect(getBorderingCountries(Country.Iceland)).toHaveLength(0);
    expect(getBorderingCountries(Country.parse("AU"))).toHaveLength(0);
  });

  it.each([
    ["SE", "NO"],
    ["SE", "FI"],
    ["FR", "ES"],
    ["US", "CA"],
    ["RU", "NO"],
  ])("getBorderingCountries is symmetric for %s and %s", (a, b) => {
    const countryA = Country.parse(a);
    const countryB = Country.parse(b);

    expect(getBorderingCountries(countryA)).toContain(countryB);
    expect(getBorderingCountries(countryB)).toContain(countryA);
  });

  it("getCountries returns continent countries ordered by English name", () => {
    const europe = getCountries(Continent.Europe);

    expect(europe).toContain(Country.Sweden);
    expect(
      europe[0]?.englishName.localeCompare(europe[europe.length - 1]!.englishName),
    ).toBeLessThan(0);
    const all = Continent.all.flatMap((continent) => getCountries(continent));
    expect(new Set(all.map((country) => country.alpha2Code)).size).toBe(Country.all.length);
  });
});

describe("geography-masking", () => {
  it("masks coordinates", () => {
    const c = GeoCoordinate.create(59.3293, 18.0686);
    expect(maskGeoCoordinate(c)).toBe("59.3***, 18.0***");
  });

  it("masks municipality showing only first character", () => {
    expect(maskSwedishMunicipality(SwedishMunicipality.parse("Stockholm"))).toBe("S********");
  });

  it("masks county", () => {
    expect(maskSwedishCounty(SwedishCounty.parse("01"))).toBe("S********* ***");
  });
});
