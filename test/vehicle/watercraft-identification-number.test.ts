import { describe, expect, it } from "vitest";
import { defaultTextScanner } from "../../src/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/text-match-confidence.js";
import { ValidationErrorReason } from "../../src/validation/validation-error-reason.js";
import {
  maskWatercraftIdentificationNumber,
  WatercraftIdentificationNumber,
  WatercraftIdentificationNumberScheme,
} from "../../src/vehicle/index.js";

describe("WatercraftIdentificationNumber", () => {
  it.each([
    "NL-HXAB7A33G506",
    "NLHXAB7A33G506",
    "nl-hxab7a33g506",
    "  NL-HXAB7A33G506  ",
    "NL - HXA B7A33 G 5 06",
    "NL\tHXAB7A33G506",
    "SE-KIX4567AI925",
    "SE-A2B12345C023",
    "US-ZZZ00001A020",
    "ZZZ00001A020",
    "zzz 00001 a020",
    "A0112345L999",
  ])("isValid returns true for %j", (input) => {
    expect(WatercraftIdentificationNumber.isValid(input)).toBe(true);
  });

  it.each([
    null,
    "",
    " ",
    "NL-HXAB7A33G50",
    "NL-HXAB7A33G5066",
    "ZZZ00001A02",
    "ZZZ00001A0200",
    "XX-HXAB7A33G506",
    "UK-HXAB7A33G506",
    "N1-HXAB7A33G506",
    "NL-H0AB7A33G506",
    "NL-1XAB7A33G506",
    "NL-HXAI7A33G506",
    "NL-HXAB7O33G506",
    "NL-HXAB7A3QG506",
    "ZZZI0001A020",
    "NL-HXAB7A33M506",
    "ZZZ00001M020",
    "NL-HXAB7A33GA06",
    "NL-HXAB7A33G5A6",
    "ZZZ00001M83J",
    "NL-HXA-B7A33G506",
    "NLH-XAB7A33G506",
    "-NLHXAB7A33G506",
    "NLHXAB7A33G506-",
    "ZZZ-00001A020",
    "ZZ-Z00001A020",
    "NL/HXAB7A33G506",
    "NL.HXAB7A33G506",
    "SE-ÅZZ00001A020",
    "ABCDEFGH123456789",
  ])("isValid returns false for %j", (input) => {
    expect(WatercraftIdentificationNumber.isValid(input)).toBe(false);
  });

  // Whitespace that .NET and JavaScript classify differently must be handled the same in both ports.
  it.each([
    "NL-HXA\u0085B7A33G506", // next line
    "NL-HXA\uFEFFB7A33G506", // zero-width no-break space
    "NL-HXA\u00A0B7A33G506", // no-break space
    "NL-HXA\u3000B7A33G506", // ideographic space
  ])("ignores the whitespace in %j", (input) => {
    expect(WatercraftIdentificationNumber.tryParse(input)?.value).toBe("NLHXAB7A33G506");
  });

  // .NET char.IsWhiteSpace counts U+0085 and not U+FEFF; the empty check and the fallback text follow it.
  it.each([
    ["\u0085", ValidationErrorReason.InputIsEmpty, null],
    [" \u0085 ", ValidationErrorReason.InputIsEmpty, null],
    ["\uFEFF", ValidationErrorReason.InvalidCharacters, "\uFEFF"],
    [" \u0085X\uFEFF ", ValidationErrorReason.InvalidLength, "X\uFEFF"],
  ] as const)(
    "validates, formats and normalizes %j as .NET does",
    (input, expectedReason, expectedFallback) => {
      const options = { fallbackToTrimmedInputWhenInvalid: true };

      expect(
        WatercraftIdentificationNumber.validate(input).issues.map((issue) => issue.reason),
      ).toEqual([expectedReason]);
      expect(WatercraftIdentificationNumber.format(input, options)).toBe(expectedFallback);
      expect(WatercraftIdentificationNumber.normalize(input, options)).toBe(expectedFallback);
      expect(WatercraftIdentificationNumber.format(input)).toBeNull();
      expect(WatercraftIdentificationNumber.normalize(input)).toBeNull();
    },
  );

  // Letters whose culture-aware upper case is, or looks like, an ASCII letter must not pass as A–Z.
  it.each([
    "SE-K\u0131X4567AI925", // dotless ı
    "U\u017F-ZZZ00001A020", // long ſ
    "NL-HXAB7A33G50\u00DF", // ß
    "NL-HXA\u212A7A33G506", // Kelvin sign
    "SE-\u0130XA12345C323", // dotted İ
    "\uFF3AZZ00001A020", // fullwidth Ｚ
  ])("rejects the non-ASCII look-alike letter in %j as invalid characters", (input) => {
    const result = WatercraftIdentificationNumber.validate(input);

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.reason)).toEqual([
      ValidationErrorReason.InvalidCharacters,
    ]);
  });

  it("upper-cases every ASCII letter", () => {
    for (let code = "a".charCodeAt(0); code <= "z".charCodeAt(0); code++) {
      const letter = String.fromCharCode(code);
      const input = `${letter}${letter}${letter}00001a020`;

      expect(WatercraftIdentificationNumber.tryParse(input)?.value).toBe(input.toUpperCase());
    }
  });

  it("parses an ISO 10087 number into its segments", () => {
    const win = WatercraftIdentificationNumber.tryParse("NL-HXAB7A33G506");

    expect(win).not.toBeNull();
    expect(win!.scheme).toBe(WatercraftIdentificationNumberScheme.Iso10087);
    expect(win!.value).toBe("NLHXAB7A33G506");
    expect(win!.formatted).toBe("NL-HXAB7A33G506");
    expect(win!.countryCode).toBe("NL");
    expect(win!.country!.alpha2Code).toBe("NL");
    expect(win!.manufacturerCode).toBe("HXA");
    expect(win!.serialNumber).toBe("B7A33");
    expect(win!.productionMonthCode).toBe("G");
    expect(win!.productionMonth).toBe(7);
    expect(win!.productionYearDigit).toBe(5);
    expect(win!.modelYearDigits).toBe("06");
  });

  it("parses a US hull identification number into its segments", () => {
    const win = WatercraftIdentificationNumber.tryParse("zzz00001a020");

    expect(win).not.toBeNull();
    expect(win!.scheme).toBe(
      WatercraftIdentificationNumberScheme.UnitedStatesHullIdentificationNumber,
    );
    expect(win!.value).toBe("ZZZ00001A020");
    expect(win!.formatted).toBe("ZZZ00001A020");
    expect(win!.countryCode).toBeNull();
    expect(win!.country).toBeNull();
    expect(win!.manufacturerCode).toBe("ZZZ");
    expect(win!.serialNumber).toBe("00001");
    expect(win!.productionMonthCode).toBe("A");
    expect(win!.productionMonth).toBe(1);
    expect(win!.productionYearDigit).toBe(0);
    expect(win!.modelYearDigits).toBe("20");
  });

  it("accepts the letter I in the manufacturer code and as September", () => {
    const win = WatercraftIdentificationNumber.tryParse("SE-KIX4567AI925");

    expect(win!.manufacturerCode).toBe("KIX");
    expect(win!.productionMonthCode).toBe("I");
    expect(win!.productionMonth).toBe(9);
  });

  it.each([
    ["A", 1],
    ["F", 6],
    ["I", 9],
    ["L", 12],
  ] as const)("decodes month code %s as %i", (code, expectedMonth) => {
    const win = WatercraftIdentificationNumber.tryParse(`NL-HXAB7A33${code}506`);
    expect(win!.productionMonth).toBe(expectedMonth);
  });

  it.each([null, undefined, "", "NL-HXAB7A33M506"])("tryParse returns null for %j", (input) => {
    expect(WatercraftIdentificationNumber.tryParse(input)).toBeNull();
  });

  it("parse throws for invalid input", () => {
    expect(() => WatercraftIdentificationNumber.parse("INVALID")).toThrow();
  });

  it.each([
    ["nlhxab7a33g506", "NL-HXAB7A33G506"],
    ["NL - HXA B7A33 G506", "NL-HXAB7A33G506"],
    ["zzz00001a020", "ZZZ00001A020"],
    ["invalid", null],
    [null, null],
  ] as const)("format(%j) returns %j", (input, expected) => {
    expect(WatercraftIdentificationNumber.format(input)).toBe(expected);
  });

  it("format returns the trimmed input when fallback is requested", () => {
    expect(
      WatercraftIdentificationNumber.format("  SE 1234 ", {
        fallbackToTrimmedInputWhenInvalid: true,
      }),
    ).toBe("SE 1234");
  });

  it.each([
    ["NL-HXAB7A33G506", "NLHXAB7A33G506"],
    ["nl hxab7a33g506", "NLHXAB7A33G506"],
    ["zzz00001a020", "ZZZ00001A020"],
    ["invalid", null],
    ["", null],
  ] as const)("normalize(%j) returns %j", (input, expected) => {
    expect(WatercraftIdentificationNumber.normalize(input)).toBe(expected);
  });

  it.each([
    ["NLHXAB7A33G506", true],
    ["ZZZ00001A020", true],
    ["NL-HXAB7A33G506", false],
    ["zzz00001a020", false],
    [null, false],
  ] as const)("isNormalized(%j) returns %s", (input, expected) => {
    expect(WatercraftIdentificationNumber.isNormalized(input)).toBe(expected);
  });

  it.each([
    ["NLHXAB7A33G506", "NL-HXAB7A33G506"],
    ["ZZZ00001A020", "ZZZ00001A020"],
  ] as const)("toString of %j is the formatted value", (input, expected) => {
    expect(WatercraftIdentificationNumber.parse(input).toString()).toBe(expected);
  });

  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["", false, ValidationErrorReason.InputIsEmpty],
    ["NL/HXAB7A33G506", false, ValidationErrorReason.InvalidCharacters],
    ["NL-HXA-B7A33G506", false, ValidationErrorReason.InvalidFormat],
    ["ZZZ-00001A020", false, ValidationErrorReason.InvalidFormat],
    ["NL-HXAB7A33G50", false, ValidationErrorReason.InvalidLength],
    ["XX-HXAB7A33G506", false, ValidationErrorReason.UnknownCountryCode],
    ["NL-H0AB7A33G506", false, ValidationErrorReason.InvalidManufacturerCode],
    ["NL-HXAB7A3QG506", false, ValidationErrorReason.InvalidSerialNumber],
    ["NL-HXAB7A33M506", false, ValidationErrorReason.InvalidMonthCode],
    ["NL-HXAB7A33G5A6", false, ValidationErrorReason.InvalidYearDigits],
    ["NL-HXAB7A33G506", true, null],
    ["ZZZ00001A020", true, null],
  ] as const)(
    "validate(%j) is valid=%s with reason %s",
    (input, expectedIsValid, expectedReason) => {
      const result = WatercraftIdentificationNumber.validate(input);

      expect(result.isValid).toBe(expectedIsValid);
      if (expectedReason === null) {
        expect(result.issues).toEqual([]);
      } else {
        expect(result.issues.map((i) => i.reason)).toEqual([expectedReason]);
      }
    },
  );

  it("validate reports every segment that fails", () => {
    const result = WatercraftIdentificationNumber.validate("N1-H0AI7A33M5A6");

    expect(result.isValid).toBe(false);
    expect(result.issues.map((i) => i.reason)).toEqual([
      ValidationErrorReason.UnknownCountryCode,
      ValidationErrorReason.InvalidManufacturerCode,
      ValidationErrorReason.InvalidSerialNumber,
      ValidationErrorReason.InvalidMonthCode,
      ValidationErrorReason.InvalidYearDigits,
    ]);
  });

  it("validate issues carry both language descriptions", () => {
    const [issue] = WatercraftIdentificationNumber.validate("NL-HXAB7A33M506").issues;

    expect(issue!.englishDescription.trim()).not.toBe("");
    expect(issue!.localizedDescription.trim()).not.toBe("");
    expect(issue!.englishDescription).not.toBe(issue!.localizedDescription);
  });

  it.each([
    null,
    "NL-HXAB7A33G506",
    "NLHXAB7A33G506",
    "ZZZ00001A020",
    "NL-HXAB7A33M506",
    "ZZZ-00001A020",
    "UK-HXAB7A33G506",
  ])("validate(%j).isValid matches isValid", (input) => {
    expect(WatercraftIdentificationNumber.validate(input).isValid).toBe(
      WatercraftIdentificationNumber.isValid(input),
    );
  });

  it.each([
    ["NL-HXAB7A33G506", "NL-HXA*********"],
    ["ZZZ00001A020", "ZZZ*********"],
  ] as const)("masks %j as %j", (input, expected) => {
    const masked = maskWatercraftIdentificationNumber(WatercraftIdentificationNumber.parse(input));

    expect(masked).toBe(expected);
    expect(masked.length).toBe(WatercraftIdentificationNumber.format(input)!.length);
  });

  it("finds a hyphenated ISO number in text with medium confidence", () => {
    const results = WatercraftIdentificationNumber.findCandidatesInText(
      "Skrovnummer: NL-HXAB7A33G506 enligt skylten.",
    );

    expect(results).toHaveLength(1);
    expect(results[0]!.originalText).toBe("NL-HXAB7A33G506");
    expect(results[0]!.normalizedForm).toBe("NLHXAB7A33G506");
    expect(results[0]!.formattedForm).toBe("NL-HXAB7A33G506");
    expect(results[0]!.confidence).toBe(TextMatchConfidence.Medium);
  });

  it.each(["CIN NLHXAB7A33G506 on the transom", "HIN zzz00001a020 on the transom"])(
    "finds an unseparated number in %j with low confidence",
    (text) => {
      const results = WatercraftIdentificationNumber.findCandidatesInText(text);

      expect(results).toHaveLength(1);
      expect(results[0]!.confidence).toBe(TextMatchConfidence.Low);
    },
  );

  it.each(["VIN ABCDEFGH123456789", "Part NL-HXAB7A33G506-2", "Order ZZZ00001M020"])(
    "ignores longer runs and invalid numbers in %j",
    (text) => {
      expect(WatercraftIdentificationNumber.findCandidatesInText(text)).toEqual([]);
    },
  );

  // Non-ASCII letters are not A–Z, so next to a number they neither block nor join the match.
  it.each([
    ["\u0131NL-HXAB7A33G506", 1],
    ["NL-HXAB7A33G506\u0131", 0],
    ["\u017FNL-HXAB7A33G506", 1],
    ["NL-HXAB7A33G506\u017F", 0],
    ["\u00DFNL-HXAB7A33G506", 1],
    ["NL-HXAB7A33G506\u212A", 0],
    ["\u0130NL-HXAB7A33G506", 1],
    ["\uFF21NL-HXAB7A33G506", 1],
  ] as const)("treats the non-ASCII letter in %j as a boundary", (text, expectedStart) => {
    const candidates = WatercraftIdentificationNumber.findCandidatesInText(text);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.startIndex).toBe(expectedStart);
    expect(candidates[0]!.originalText).toBe("NL-HXAB7A33G506");
  });

  it("returns no candidates for empty text", () => {
    expect(WatercraftIdentificationNumber.findCandidatesInText(null as unknown as string)).toEqual(
      [],
    );
    expect(WatercraftIdentificationNumber.findCandidatesInText("")).toEqual([]);
  });

  it("is reported by the default text scanner", () => {
    const result = defaultTextScanner.scan("Båten har skrovnummer NL-HXAB7A33G506.");

    expect(result.watercraftIdentificationNumbers).toHaveLength(1);
    expect(result.watercraftIdentificationNumbers[0]!.normalizedForm).toBe("NLHXAB7A33G506");
  });

  it("compares by normalized value", () => {
    const a = WatercraftIdentificationNumber.parse("NL-HXAB7A33G506");
    const b = WatercraftIdentificationNumber.parse("nlhxab7a33g506");
    const c = WatercraftIdentificationNumber.parse("ZZZ00001A020");

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.compareTo(c)).toBeLessThan(0);
    expect(a.compareTo(b)).toBe(0);
    expect(a.compareTo(null)).toBe(1);
  });
});
