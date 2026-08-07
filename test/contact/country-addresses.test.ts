import { describe, expect, it } from "vitest";
import * as A from "../../src/contact/country-addresses.js";

interface CountryAddressCase {
  name: string;
  address: {
    tryParse: (input: string | null) => CountryAddressResult | null;
    tryParseStructured: (parts: {
      street: string | null;
      zipCode?: string | null;
      city?: string | null;
      country?: string | null;
    }) => CountryAddressResult | null;
    parse: (input: string) => CountryAddressResult;
    isValid: (input: string | null) => boolean;
    format: (
      input: string | null,
      options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
    ) => string | null;
    normalize: (
      input: string | null,
      options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
    ) => string | null;
    isNormalized: (input: string | null) => boolean;
  };
  alpha2: string;
  zip: string;
  formattedZip: string;
  city: string;
}

interface CountryAddressResult {
  country: { alpha2Code: string };
  countryZipCode: { value: string; formatted: string };
  city: { value: string };
  street: { street: string };
  value: string;
  formatted: string;
  toString(): string;
  toNormalizedString(): string;
  toMultilineString(): string;
}

const cases: CountryAddressCase[] = [
  {
    name: "Norwegian",
    address: A.NorwegianAddress,
    alpha2: "NO",
    zip: "0150",
    formattedZip: "0150",
    city: "Oslo",
  },
  {
    name: "Finnish",
    address: A.FinnishAddress,
    alpha2: "FI",
    zip: "00100",
    formattedZip: "00100",
    city: "Helsinki",
  },
  {
    name: "Danish",
    address: A.DanishAddress,
    alpha2: "DK",
    zip: "1050",
    formattedZip: "1050",
    city: "Köpenhamn",
  },
  {
    name: "German",
    address: A.GermanAddress,
    alpha2: "DE",
    zip: "10117",
    formattedZip: "10117",
    city: "Berlin",
  },
  {
    name: "Polish",
    address: A.PolishAddress,
    alpha2: "PL",
    zip: "00950",
    formattedZip: "00-950",
    city: "Warszawa",
  },
  {
    name: "Estonian",
    address: A.EstonianAddress,
    alpha2: "EE",
    zip: "10115",
    formattedZip: "10115",
    city: "Tallinn",
  },
  {
    name: "Lithuanian",
    address: A.LithuanianAddress,
    alpha2: "LT",
    zip: "LT-01001",
    formattedZip: "LT-01001",
    city: "Vilnius",
  },
  {
    name: "Romanian",
    address: A.RomanianAddress,
    alpha2: "RO",
    zip: "010011",
    formattedZip: "010011",
    city: "Bukarest",
  },
  {
    name: "Bulgarian",
    address: A.BulgarianAddress,
    alpha2: "BG",
    zip: "1000",
    formattedZip: "1000",
    city: "Sofia",
  },
  {
    name: "Latvian",
    address: A.LatvianAddress,
    alpha2: "LV",
    zip: "LV-1050",
    formattedZip: "LV-1050",
    city: "Riga",
  },
  {
    name: "Czech",
    address: A.CzechAddress,
    alpha2: "CZ",
    zip: "11000",
    formattedZip: "110 00",
    city: "Prag",
  },
  {
    name: "Spanish",
    address: A.SpanishAddress,
    alpha2: "ES",
    zip: "28001",
    formattedZip: "28001",
    city: "Madrid",
  },
  {
    name: "Dutch",
    address: A.DutchAddress,
    alpha2: "NL",
    zip: "1012 AB",
    formattedZip: "1012 AB",
    city: "Amsterdam",
  },
  {
    name: "Greek",
    address: A.GreekAddress,
    alpha2: "GR",
    zip: "10674",
    formattedZip: "106 74",
    city: "Aten",
  },
  {
    name: "Italian",
    address: A.ItalianAddress,
    alpha2: "IT",
    zip: "00186",
    formattedZip: "00186",
    city: "Rom",
  },
  {
    name: "Slovenian",
    address: A.SlovenianAddress,
    alpha2: "SI",
    zip: "1000",
    formattedZip: "1000",
    city: "Ljubljana",
  },
  {
    name: "Croatian",
    address: A.CroatianAddress,
    alpha2: "HR",
    zip: "10000",
    formattedZip: "10000",
    city: "Zagreb",
  },
  {
    name: "Portuguese",
    address: A.PortugueseAddress,
    alpha2: "PT",
    zip: "1100148",
    formattedZip: "1100-148",
    city: "Lissabon",
  },
  {
    name: "Hungarian",
    address: A.HungarianAddress,
    alpha2: "HU",
    zip: "1055",
    formattedZip: "1055",
    city: "Budapest",
  },
  {
    name: "French",
    address: A.FrenchAddress,
    alpha2: "FR",
    zip: "75008",
    formattedZip: "75008",
    city: "Paris",
  },
  {
    name: "Slovak",
    address: A.SlovakAddress,
    alpha2: "SK",
    zip: "81101",
    formattedZip: "811 01",
    city: "Bratislava",
  },
  {
    name: "Belgian",
    address: A.BelgianAddress,
    alpha2: "BE",
    zip: "1000",
    formattedZip: "1000",
    city: "Bryssel",
  },
  {
    name: "British",
    address: A.BritishAddress,
    alpha2: "GB",
    zip: "SW1A 1AA",
    formattedZip: "SW1A 1AA",
    city: "London",
  },
  {
    name: "Austrian",
    address: A.AustrianAddress,
    alpha2: "AT",
    zip: "1010",
    formattedZip: "1010",
    city: "Wien",
  },
  {
    name: "Cypriot",
    address: A.CypriotAddress,
    alpha2: "CY",
    zip: "1060",
    formattedZip: "1060",
    city: "Nicosia",
  },
  {
    name: "Icelandic",
    address: A.IcelandicAddress,
    alpha2: "IS",
    zip: "101",
    formattedZip: "101",
    city: "Reykjavik",
  },
  {
    name: "Swiss",
    address: A.SwissAddress,
    alpha2: "CH",
    zip: "3005",
    formattedZip: "3005",
    city: "Bern",
  },
  {
    name: "Irish",
    address: A.IrishAddress,
    alpha2: "IE",
    zip: "D02 XR20",
    formattedZip: "D02 XR20",
    city: "Dublin",
  },
  {
    name: "Luxembourgish",
    address: A.LuxembourgishAddress,
    alpha2: "LU",
    zip: "1648",
    formattedZip: "1648",
    city: "Luxemburg",
  },
  {
    name: "Maltese",
    address: A.MalteseAddress,
    alpha2: "MT",
    zip: "VLT 1535",
    formattedZip: "VLT 1535",
    city: "Valletta",
  },
  {
    name: "Liechtenstein",
    address: A.LiechtensteinAddress,
    alpha2: "LI",
    zip: "9490",
    formattedZip: "9490",
    city: "Vaduz",
  },
];

describe.each(cases)("$name address", ({ address, alpha2, zip, formattedZip, city }) => {
  const street = "Example Street 1";
  const text = `${street}, ${zip} ${city}, ${alpha2}`;

  it("parses structured input and exposes expected properties", () => {
    const parsed = address.tryParseStructured({ street, zipCode: zip, city, country: alpha2 });
    expect(parsed).not.toBeNull();
    expect(parsed!.country.alpha2Code).toBe(alpha2);
    expect(parsed!.countryZipCode.formatted).toBe(formattedZip);
    expect(parsed!.city.value).toBe(city);
    expect(parsed!.street.street).toBe(street);
  });

  it("parse, format, normalize and string helpers agree", () => {
    const parsed = address.parse(text);
    expect(address.isValid(text)).toBe(true);
    expect(address.format(text)).toBe(parsed.toString());
    expect(address.normalize(text)).toBe(parsed.toNormalizedString());
    expect(parsed.formatted).toBe(parsed.toString());
    expect(parsed.value).toBe(parsed.toNormalizedString());
    expect(parsed.toMultilineString()).toContain(street);
    expect(parsed.toMultilineString()).toContain(`${formattedZip} ${city}`);
  });

  it("rejects invalid or wrong-country input consistently", () => {
    expect(address.tryParse(null)).toBeNull();
    expect(address.isValid(null)).toBe(false);
    expect(address.format(null)).toBeNull();
    expect(address.normalize(null)).toBeNull();
    expect(
      address.tryParseStructured({ street, zipCode: "114 53", city: "Stockholm", country: "SE" }),
    ).toBeNull();
    expect(() => address.parse("not an address")).toThrow();
  });

  it("fallback options return trimmed invalid input", () => {
    expect(address.format(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "invalid",
    );
    expect(address.normalize(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "invalid",
    );
  });
});
