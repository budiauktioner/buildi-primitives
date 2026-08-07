import { describe, expect, it } from "vitest";
import {
  DunsNumber,
  ElfCode,
  EuOrganizationName,
  LeiCode,
  SwedishCfarNumber,
  SwedishOrganizationName,
  SwedishOrganizationNumber,
  SwedishOrganizationType,
  SwedishSniCode,
  maskDunsNumber,
  maskEuOrganizationName,
  maskEuVatNumber,
  maskLeiCode,
  maskSwedishOrganizationName,
  maskSwedishOrganizationNumber,
} from "../../src/organization/index.js";
import { EuVatNumber } from "../../src/organization/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("SwedishOrganizationNumber", () => {
  it("parses legal entity organization numbers", () => {
    const org = SwedishOrganizationNumber.parse("559246-0421");

    expect(org.to10DigitsOnly()).toBe("5592460421");
    expect(org.to10DigitString()).toBe("559246-0421");
    expect(org.to12DigitString()).toBe("165592460421");
    expect(org.isPerson).toBe(false);
  });

  it("parses person-based numbers", () => {
    const org = SwedishOrganizationNumber.parse("199908072391");

    expect(org.isPerson).toBe(true);
    expect(org.to12DigitString()).toBe("199908072391");
  });

  it("returns detailed validation reasons", () => {
    expect(SwedishOrganizationNumber.validate("").issues[0]!.reason).toBe(
      ValidationErrorReason.InputIsEmpty,
    );
    expect(SwedishOrganizationNumber.validate("abc").issues[0]!.reason).toBe(
      ValidationErrorReason.InvalidFormat,
    );
    expect(SwedishOrganizationNumber.validate("5592460422").issues[0]!.reason).toBe(
      ValidationErrorReason.InvalidCheckDigit,
    );
  });

  it("infers organization type from number and name", () => {
    const org = SwedishOrganizationNumber.parse("559246-0421");
    const hint = org.getSwedishOrganizationTypeHint("Budi Auktioner AB");

    expect(hint.certain).toBe(SwedishOrganizationType.Aktiebolag);
    expect(hint.bestGuess).toBe(SwedishOrganizationType.Aktiebolag);
  });

  it("masks person-based identifiers by default", () => {
    const person = SwedishOrganizationNumber.parse("199908072391");
    const org = SwedishOrganizationNumber.parse("559246-0421");

    expect(maskSwedishOrganizationNumber(person)).toBe("990807-****");
    expect(maskSwedishOrganizationNumber(org)).toBe("559246-0421");
    expect(maskSwedishOrganizationNumber(org, { maskOrganizationNumbers: true })).toBe(
      "559246-****",
    );
  });
});

describe("organization names", () => {
  it("parses Swedish organization names and infers type", () => {
    const name = SwedishOrganizationName.parse("VOLVO AB");

    expect(name.value).toBe("VOLVO AB");
    expect(name.casingNormalizedValue).toBe("Volvo AB");
    expect(name.hasOrganizationIndicators).toBe(true);
    expect(name.inferredSwedishOrganizationType).toBe(SwedishOrganizationType.Aktiebolag);
  });

  it("recognizes government agencies", () => {
    expect(SwedishOrganizationName.isKnownGovernmentAgency("Skatteverket")).toBe(true);
    expect(SwedishOrganizationName.inferSwedishOrganizationType("Skatteverket")).toBe(
      SwedishOrganizationType.OffentligSektor,
    );
  });

  it("parses EU organization names with trade-name separators", () => {
    const name = EuOrganizationName.parse('SIA "Example LV" || Example Brand');

    expect(name.legalName).toBe('SIA "Example LV"');
    expect(name.tradeName).toBe("Example Brand");
    expect(name.hasTradeName).toBe(true);
  });

  it.each([
    ["Budi Auktioner AB", "Budi Auktioner AB"],
    ["  Budi  Auktioner  AB  ", "Budi Auktioner AB"],
    ["AB", "AB"],
    ["A & B Trading", "A & B Trading"],
    ["Café Björnen", "Café Björnen"],
    ["López Trading AB", "López Trading AB"],
    ["Müller & Partners", "Müller & Partners"],
    ["O'Malley's Pub AB", "O'Malley's Pub AB"],
    ["Kebab King / Pizza House", "Kebab King / Pizza House"],
  ])("accepts common EU organization names", (input, expected) => {
    const name = EuOrganizationName.tryParse(input);
    expect(name?.value).toBe(expected);
    expect(EuOrganizationName.format(input)).toBe(expected);
    expect(EuOrganizationName.normalize(input)).toBe(expected);
  });

  it.each([[null], [""], ["   "], ["A"]])("rejects invalid EU organization names", (input) => {
    expect(EuOrganizationName.tryParse(input as string | null)).toBeNull();
    expect(EuOrganizationName.isValid(input as string | null)).toBe(false);
  });

  it.each([
    ["Volvo AB", "Volvo AB", null],
    ["Volvo AB||Volvo Cars", "Volvo AB", "Volvo Cars"],
    ["Volvo AB | Volvo Cars", "Volvo AB", "Volvo Cars"],
    ["Volvo AB | | Volvo Cars", "Volvo AB", "Volvo Cars"],
    ["ΑΦΟΙ ΠΑΠΑΔΟΠΟΥΛΟΥ ΟΕ||EXAMPLE TEXTILE", "ΑΦΟΙ ΠΑΠΑΔΟΠΟΥΛΟΥ ΟΕ", "EXAMPLE TEXTILE"],
    ["Acme Group AB||Acme Retail||Acme Wholesale", "Acme Group AB", "Acme Retail | Acme Wholesale"],
  ])("splits EU legal and trade names", (input, legalName, tradeName) => {
    const name = EuOrganizationName.parse(input);
    expect(name.legalName).toBe(legalName);
    expect(name.tradeName).toBe(tradeName);
    expect(name.hasTradeName).toBe(tradeName !== null);
  });

  it.each(["||EXAMPLE TEXTILE", "Volvo AB||", "|||"])(
    "does not split one-sided EU trade names",
    (input) => {
      const name = EuOrganizationName.parse(input);
      expect(name.legalName).toBe(name.value);
      expect(name.tradeName).toBeNull();
      expect(name.hasTradeName).toBe(false);
    },
  );

  it("exposes EU legal/trade split helper", () => {
    expect(EuOrganizationName.trySplitLegalAndTrade(null)).toBeNull();
    expect(EuOrganizationName.trySplitLegalAndTrade("Volvo AB")).toEqual({
      legalName: "Volvo AB",
      tradeName: null,
    });
    expect(EuOrganizationName.trySplitLegalAndTrade("Volvo AB||Volvo Cars")).toEqual({
      legalName: "Volvo AB",
      tradeName: "Volvo Cars",
    });
  });

  it.each([
    ['SIA "EXAMPLE LV"'],
    ['AS "EXAMPLE LV"'],
    ['UAB "EXAMPLE LT"'],
    ['AB "EXAMPLE LT"'],
    ['AS "EXAMPLE EE"'],
    ['OÜ "EXAMPLE EE"'],
    ['"EXAMPLE PL" Sp. z o.o.'],
    ['SIA "EXAMPLE LV" filiāle'],
  ])("accepts double-quoted distinctive EU names", (input) => {
    expect(EuOrganizationName.parse(input).value).toBe(input);
  });

  it.each([
    ["SIA “EXAMPLE LV”", 'SIA "EXAMPLE LV"'],
    ["SIA „EXAMPLE LV‟", 'SIA "EXAMPLE LV"'],
    ["«EXAMPLE» AS", '"EXAMPLE" AS'],
  ])("normalizes typographic double quotes", (input, expected) => {
    expect(EuOrganizationName.parse(input).value).toBe(expected);
  });

  it("preserves Baltic EU organization name diacritics", () => {
    expect(EuOrganizationName.parse('SIA "Vāca Pārtika"').value).toBe('SIA "Vāca Pārtika"');
  });

  it("masks EU organization names while preserving separators", () => {
    expect(maskEuOrganizationName(EuOrganizationName.parse("Volvo Cars AB"))).toBe("V**** C*** A*");
    expect(maskEuOrganizationName(EuOrganizationName.parse('SIA "Example LV"'))).toBe(
      'S** "E****** L*"',
    );
    expect(maskEuOrganizationName(EuOrganizationName.parse("Volvo AB||Volvo Cars"))).toBe(
      "V**** A*||V**** C***",
    );
  });

  it("masks Swedish organization names word by word", () => {
    expect(maskSwedishOrganizationName(SwedishOrganizationName.parse("Volvo AB"))).toBe("V**** A*");
    expect(maskSwedishOrganizationName(SwedishOrganizationName.parse("Budi Auktioner AB"))).toBe(
      "B*** A******** A*",
    );
  });

  it("compares EU organization names by normalized value", () => {
    const a = EuOrganizationName.parse('SIA "Example LV"');
    const b = EuOrganizationName.parse('SIA "Example LV"');
    const c = EuOrganizationName.parse('UAB "Example LT"');

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(EuOrganizationName.parse("AB").compareTo(a)).toBeLessThan(0);
    expect(a.compareTo(null)).toBe(1);
  });
});

describe("other organization identifiers", () => {
  it("parses LEI code with checksum", () => {
    const lei = LeiCode.parse("5493001KJTIIGC8Y1R12");

    expect(lei.louPrefix).toBe("5493");
    expect(lei.checkDigits).toBe("12");
    expect(maskLeiCode(lei)).toBe("5493****************");
  });

  it("compares LEI codes by normalized value", () => {
    const a = LeiCode.parse("549300T5RZ1HA5HZ3109");
    const b = LeiCode.parse("549300T5RZ1HA5HZ3109");
    const c = LeiCode.parse("549300ONBUTV20237K19");

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(c.compareTo(a)).toBeLessThan(0);
    expect(a.compareTo(null)).toBe(1);
  });

  it("parses D-U-N-S numbers", () => {
    const duns = DunsNumber.parse("123-456-789");

    expect(duns.digits).toBe("123456789");
    expect(maskDunsNumber(duns)).toBe("*********");
  });

  it("compares D-U-N-S numbers by digits", () => {
    const a = DunsNumber.parse("123-456-789");
    const b = DunsNumber.parse("123456789");
    const c = DunsNumber.parse("987654321");

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.compareTo(c)).toBeLessThan(0);
    expect(a.compareTo(null)).toBe(1);
  });

  it("parses known and unknown ELF codes", () => {
    const known = ElfCode.parse("xtiq");
    const unknown = ElfCode.parse("AB12");

    expect(known.code).toBe("XTIQ");
    expect(known.isKnown).toBe(true);
    expect(unknown.isKnown).toBe(false);
    expect(unknown.toNormalizedString()).toBe("AB12");
  });

  it("covers ELF formatting, fallback, known-code metadata, and ordering", () => {
    const known = ElfCode.parse("xtiq");
    const unknown = ElfCode.parse("ZZZZ");

    expect(known.code).toBe("XTIQ");
    expect(known.englishName).toBe("Limited company");
    expect(known.localizedName).toBe("Aktiebolag");
    expect(known.toString()).toBe("Aktiebolag");
    expect(unknown.toString()).toBe("ZZZZ");
    expect(ElfCode.format("XTIQ")).toBe("Aktiebolag");
    expect(ElfCode.format("XTI")).toBeNull();
    expect(ElfCode.format("  XTI  ", { fallbackToTrimmedInputWhenInvalid: true })).toBe("XTI");
    expect(ElfCode.normalize("xtiq")).toBe("XTIQ");
    expect(ElfCode.isNormalized("XTIQ")).toBe(true);
    expect(ElfCode.isNormalized("xtiq")).toBe(false);
    expect(ElfCode.parse("FR3V").compareTo(known)).toBeLessThan(0);
    expect(known.compareTo(null)).toBe(1);
  });

  it("parses CFAR and SNI codes", () => {
    expect(SwedishCfarNumber.parse("12345678").number).toBe("12345678");
    expect(SwedishSniCode.parse("62010").formatted).toBe("62.010");
    expect(SwedishSniCode.parse("62.010").divisionCode).toBe("62");
  });

  it("compares CFAR and SNI codes by normalized value", () => {
    const cfar = SwedishCfarNumber.parse("55667788");
    expect(SwedishCfarNumber.format("55667788")).toBe("55667788");
    expect(SwedishCfarNumber.normalize("55667788")).toBe("55667788");
    expect(cfar.equals(SwedishCfarNumber.parse("55667788"))).toBe(true);
    expect(cfar.equals(SwedishCfarNumber.parse("12345678"))).toBe(false);
    expect(SwedishCfarNumber.parse("12345678").compareTo(cfar)).toBeLessThan(0);
    expect(cfar.compareTo(null)).toBe(1);

    const sni = SwedishSniCode.parse("62010");
    expect(SwedishSniCode.format("62010")).toBe("62.010");
    expect(SwedishSniCode.normalize("62.010")).toBe("62.010");
    expect(sni.equals(SwedishSniCode.parse("62.010"))).toBe(true);
    expect(sni.equals(SwedishSniCode.parse("47917"))).toBe(false);
    expect(SwedishSniCode.parse("47917").compareTo(sni)).toBeLessThan(0);
    expect(sni.compareTo(null)).toBe(1);
  });

  it("masks Swedish VAT only when person-based or explicitly requested", () => {
    const vat = EuVatNumber.parse("SE559246042101");

    expect(maskEuVatNumber(vat)).toBe("SE559246042101");
    expect(maskEuVatNumber(vat, true)).toBe("SE559246****01");
  });
});
