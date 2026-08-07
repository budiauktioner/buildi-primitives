import { describe, expect, it } from "vitest";
import * as Z from "../../src/contact/country-zip-codes.js";

interface ZipCase {
  name: string;
  zip: {
    tryParse: (s: string | null) => unknown;
    parse: (s: string) => {
      value: string;
      formatted: string;
      toString(): string;
      toNormalizedString(): string;
    };
    isValid: (s: string | null) => boolean;
    format: (
      s: string | null,
      options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
    ) => string | null;
    normalize: (
      s: string | null,
      options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
    ) => string | null;
    isNormalized: (s: string | null) => boolean;
  };
  valid: { input: string; value: string; formatted: string };
  invalid: string[];
}

const cases: ZipCase[] = [
  {
    name: "Norwegian",
    zip: Z.NorwegianAddressZipCode,
    valid: { input: "0150", value: "0150", formatted: "0150" },
    invalid: ["abc", "12345"],
  },
  {
    name: "Finnish",
    zip: Z.FinnishAddressZipCode,
    valid: { input: "00100", value: "00100", formatted: "00100" },
    invalid: ["123"],
  },
  {
    name: "Danish",
    zip: Z.DanishAddressZipCode,
    valid: { input: "1050", value: "1050", formatted: "1050" },
    invalid: ["DKDK"],
  },
  {
    name: "German",
    zip: Z.GermanAddressZipCode,
    valid: { input: "10115", value: "10115", formatted: "10115" },
    invalid: ["123"],
  },
  {
    name: "Polish",
    zip: Z.PolishAddressZipCode,
    valid: { input: "00950", value: "00950", formatted: "00-950" },
    invalid: ["123"],
  },
  {
    name: "Estonian",
    zip: Z.EstonianAddressZipCode,
    valid: { input: "10115", value: "10115", formatted: "10115" },
    invalid: ["123"],
  },
  {
    name: "Lithuanian",
    zip: Z.LithuanianAddressZipCode,
    valid: { input: "LT-01001", value: "01001", formatted: "LT-01001" },
    invalid: ["XX-1234"],
  },
  {
    name: "Romanian",
    zip: Z.RomanianAddressZipCode,
    valid: { input: "010011", value: "010011", formatted: "010011" },
    invalid: ["12345"],
  },
  {
    name: "Bulgarian",
    zip: Z.BulgarianAddressZipCode,
    valid: { input: "1000", value: "1000", formatted: "1000" },
    invalid: ["10000"],
  },
  {
    name: "Latvian",
    zip: Z.LatvianAddressZipCode,
    valid: { input: "LV-1050", value: "1050", formatted: "LV-1050" },
    invalid: ["123"],
  },
  {
    name: "Czech",
    zip: Z.CzechAddressZipCode,
    valid: { input: "11000", value: "11000", formatted: "110 00" },
    invalid: ["123"],
  },
  {
    name: "Spanish",
    zip: Z.SpanishAddressZipCode,
    valid: { input: "28001", value: "28001", formatted: "28001" },
    invalid: ["123"],
  },
  {
    name: "Dutch",
    zip: Z.DutchAddressZipCode,
    valid: { input: "1012 AB", value: "1012AB", formatted: "1012 AB" },
    invalid: ["10120"],
  },
  {
    name: "Greek",
    zip: Z.GreekAddressZipCode,
    valid: { input: "10674", value: "10674", formatted: "106 74" },
    invalid: ["123"],
  },
  {
    name: "Italian",
    zip: Z.ItalianAddressZipCode,
    valid: { input: "00186", value: "00186", formatted: "00186" },
    invalid: ["123"],
  },
  {
    name: "Slovenian",
    zip: Z.SlovenianAddressZipCode,
    valid: { input: "1000", value: "1000", formatted: "1000" },
    invalid: ["12"],
  },
  {
    name: "Croatian",
    zip: Z.CroatianAddressZipCode,
    valid: { input: "10000", value: "10000", formatted: "10000" },
    invalid: ["123"],
  },
  {
    name: "Portuguese",
    zip: Z.PortugueseAddressZipCode,
    valid: { input: "1100148", value: "1100148", formatted: "1100-148" },
    invalid: ["12345"],
  },
  {
    name: "Hungarian",
    zip: Z.HungarianAddressZipCode,
    valid: { input: "1055", value: "1055", formatted: "1055" },
    invalid: ["1"],
  },
  {
    name: "French",
    zip: Z.FrenchAddressZipCode,
    valid: { input: "75008", value: "75008", formatted: "75008" },
    invalid: ["123"],
  },
  {
    name: "Slovak",
    zip: Z.SlovakAddressZipCode,
    valid: { input: "81101", value: "81101", formatted: "811 01" },
    invalid: ["1"],
  },
  {
    name: "Belgian",
    zip: Z.BelgianAddressZipCode,
    valid: { input: "1000", value: "1000", formatted: "1000" },
    invalid: ["12345"],
  },
  {
    name: "British",
    zip: Z.BritishAddressZipCode,
    valid: { input: "SW1A 1AA", value: "SW1A1AA", formatted: "SW1A 1AA" },
    invalid: ["NOTAPOSTCODE"],
  },
  {
    name: "Austrian",
    zip: Z.AustrianAddressZipCode,
    valid: { input: "1010", value: "1010", formatted: "1010" },
    invalid: ["123"],
  },
  {
    name: "Cypriot",
    zip: Z.CypriotAddressZipCode,
    valid: { input: "1060", value: "1060", formatted: "1060" },
    invalid: ["123"],
  },
  {
    name: "Icelandic",
    zip: Z.IcelandicAddressZipCode,
    valid: { input: "101", value: "101", formatted: "101" },
    invalid: ["12"],
  },
  {
    name: "Swiss",
    zip: Z.SwissAddressZipCode,
    valid: { input: "3005", value: "3005", formatted: "3005" },
    invalid: ["123"],
  },
  {
    name: "Irish",
    zip: Z.IrishAddressZipCode,
    valid: { input: "D02 XR20", value: "D02XR20", formatted: "D02 XR20" },
    invalid: ["123"],
  },
  {
    name: "Luxembourgish",
    zip: Z.LuxembourgishAddressZipCode,
    valid: { input: "1648", value: "1648", formatted: "1648" },
    invalid: ["1"],
  },
  {
    name: "Maltese",
    zip: Z.MalteseAddressZipCode,
    valid: { input: "VLT 1535", value: "VLT1535", formatted: "VLT 1535" },
    invalid: ["123"],
  },
  {
    name: "Liechtenstein",
    zip: Z.LiechtensteinAddressZipCode,
    valid: { input: "9490", value: "9490", formatted: "9490" },
    invalid: ["123"],
  },
];

describe.each(cases)("$name zip code", ({ zip, valid, invalid }) => {
  it("parses valid input and exposes expected properties", () => {
    expect(zip.isValid(valid.input)).toBe(true);
    const parsed = zip.tryParse(valid.input) as { value: string; formatted: string } | null;
    expect(parsed).not.toBeNull();
    expect(parsed!.value).toBe(valid.value);
    expect(parsed!.formatted).toBe(valid.formatted);
  });

  it("parse, toString and toNormalizedString return expected values", () => {
    const parsed = zip.parse(valid.input);
    expect(parsed.value).toBe(valid.value);
    expect(parsed.toString()).toBe(valid.formatted);
    expect(parsed.toNormalizedString()).toBe(valid.value);
  });

  it("format and normalize return expected values", () => {
    expect(zip.format(valid.input)).toBe(valid.formatted);
    expect(zip.normalize(valid.input)).toBe(valid.value);
  });

  it("reports normalized status", () => {
    expect(zip.isNormalized(valid.value)).toBe(true);
    if (valid.input !== valid.value) expect(zip.isNormalized(valid.input)).toBe(false);
  });

  it("rejects invalid inputs consistently", () => {
    for (const i of invalid) {
      expect(zip.isValid(i)).toBe(false);
      expect(zip.tryParse(i)).toBeNull();
      expect(zip.format(i)).toBeNull();
      expect(zip.normalize(i)).toBeNull();
      expect(() => zip.parse(i)).toThrow();
    }
    expect(zip.isValid(null)).toBe(false);
    expect(zip.tryParse(null as unknown as string)).toBeNull();
    expect(zip.format(null)).toBeNull();
    expect(zip.normalize(null)).toBeNull();
  });

  it("fallback options return trimmed invalid input", () => {
    expect(zip.format(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe("invalid");
    expect(zip.normalize(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe("invalid");
  });
});
