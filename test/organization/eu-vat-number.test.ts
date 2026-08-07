import { describe, expect, it } from "vitest";
import { EuVatNumber } from "../../src/organization/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("EuVatNumber", () => {
  it("parses Swedish VAT numbers from organization numbers", () => {
    const vat = EuVatNumber.tryParse("SE559246042101");

    expect(vat).not.toBeNull();
    expect(vat!.vatPrefix).toBe("SE");
    expect(vat!.countryCode).toBe("SE");
    expect(vat!.countryName).toBe("Sweden");
    expect(vat!.body).toBe("559246042101");
    expect(vat!.toString()).toBe("SE559246042101");
  });

  it("normalizes separators and lowercase prefixes", () => {
    expect(EuVatNumber.normalize("se 559246-0421 01")).toBe("SE559246042101");
  });

  it("accepts Greek VAT prefixes as EL and GR", () => {
    expect(EuVatNumber.tryParse("EL123456789")!.countryCode).toBe("GR");
    expect(EuVatNumber.tryParseForCountry("EL123456789", "GR")).not.toBeNull();
    expect(EuVatNumber.tryParseForCountry("EL123456789", "EL")).not.toBeNull();
  });

  it("rejects VAT numbers from another country in country-specific parsing", () => {
    expect(EuVatNumber.tryParseForCountry("DE123456789", "SE")).toBeNull();
  });

  it("validates common country-specific formats", () => {
    expect(EuVatNumber.isValid("ATU12345678")).toBe(true);
    expect(EuVatNumber.isValid("NL123456789B01")).toBe(true);
    expect(EuVatNumber.isValid("BE0123456749")).toBe(true);
    expect(EuVatNumber.isValid("PL1234567802")).toBe(true);
  });

  it.each([[null], [""], [" "], ["XX123456"], ["SE559246042102"], ["DE12"]])(
    "rejects invalid VAT input %s",
    (input) => {
      expect(EuVatNumber.tryParse(input as string | null)).toBeNull();
      expect(EuVatNumber.isValid(input as string | null)).toBe(false);
      expect(EuVatNumber.format(input as string | null)).toBeNull();
      expect(EuVatNumber.normalize(input as string | null)).toBeNull();
    },
  );

  it("parse throws for invalid input", () => {
    expect(() => EuVatNumber.parse("XX123456")).toThrow("Invalid VAT number.");
  });

  it("format, normalize, isNormalized and string helpers match expected forms", () => {
    const vat = EuVatNumber.parse("se 559246-0421 01");

    expect(EuVatNumber.format("se 559246-0421 01")).toBe("SE559246042101");
    expect(EuVatNumber.normalize("se 559246-0421 01")).toBe("SE559246042101");
    expect(EuVatNumber.isNormalized("SE559246042101")).toBe(true);
    expect(EuVatNumber.isNormalized("se559246042101")).toBe(false);
    expect(vat.toNormalizedString()).toBe("SE559246042101");
    expect(vat.toString()).toBe("SE559246042101");
  });

  it("fallback options return trimmed invalid input", () => {
    expect(EuVatNumber.format(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "invalid",
    );
    expect(EuVatNumber.normalize(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "invalid",
    );
  });

  it("returns validation reasons", () => {
    expect(EuVatNumber.validate("").issues[0]!.reason).toBe(ValidationErrorReason.InputIsEmpty);
    expect(EuVatNumber.validate("1").issues[0]!.reason).toBe(ValidationErrorReason.InputTooShort);
    expect(EuVatNumber.validate("XX123").issues[0]!.reason).toBe(
      ValidationErrorReason.UnknownCountryCode,
    );
    expect(EuVatNumber.validate("SE559246042102").issues[0]!.reason).toBe(
      ValidationErrorReason.InvalidFormat,
    );
    expect(EuVatNumber.validate("SE559246042101").isValid).toBe(true);
  });

  it("validation language descriptions are populated and match isValid", () => {
    const invalid = EuVatNumber.validate("XX123");
    expect(invalid.issues[0]!.englishDescription.length).toBeGreaterThan(0);
    expect(invalid.issues[0]!.localizedDescription.length).toBeGreaterThan(0);

    for (const input of ["", "XX123", "SE559246042101", "DE123456789"]) {
      expect(EuVatNumber.validate(input).isValid).toBe(EuVatNumber.isValid(input));
    }
  });

  it("equals and compareTo match normalized value", () => {
    const a = EuVatNumber.parse("SE559246042101");
    const b = EuVatNumber.parse("se 559246-0421 01");
    const c = EuVatNumber.parse("DE123456789");

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(c.compareTo(a)).toBeLessThan(0);
    expect(a.compareTo(null)).toBe(1);
  });

  it("finds VAT candidates in text", () => {
    const candidates = EuVatNumber.findCandidatesInText("VAT SE559246042101 and DE123456789.");

    expect(candidates.map((c) => c.normalizedForm)).toEqual(["SE559246042101", "DE123456789"]);
  });
});
