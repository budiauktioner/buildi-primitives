import { afterEach, describe, expect, it } from "vitest";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";
import {
  SwedishCoordinationNumber,
  SwedishPersonalIdentityNumber,
} from "../../src/person/index.js";
import {
  EuVatNumber,
  LeiCode,
  SwedishOrganizationIdentifierParser,
  SwedishOrganizationIdentifierType,
  SwedishOrganizationNumber,
  SwedishOrganizationType,
  getAllabolagUrl,
  getBolagsverketUrl,
  getGleifUrl,
  toEuVatNumber,
  toCoordinationNumber,
  toPersonalIdentityNumber,
  toSwedishOrganizationNumber,
  toViesUrl,
} from "../../src/organization/index.js";

describe("organization conversion helpers", () => {
  afterEach(() => PrimitivesDefaults.reset());

  it("converts Swedish organization numbers to SE VAT", () => {
    const org = SwedishOrganizationNumber.parse("559246-0421");
    const vat = toEuVatNumber(org);

    expect(vat.toString()).toBe("SE559246042101");
  });

  it("converts SE VAT numbers back to Swedish organization numbers", () => {
    const vat = EuVatNumber.parse("SE559246042101");
    const org = toSwedishOrganizationNumber(vat);

    expect(org!.to10DigitString()).toBe("559246-0421");
  });

  it("converts person-based organization numbers to personal identity numbers", () => {
    const org = SwedishOrganizationNumber.parse("199908072391");
    const pin = toPersonalIdentityNumber(org);

    expect(pin).toBeInstanceOf(SwedishPersonalIdentityNumber);
    expect(pin!.to12DigitString()).toBe("199908072391");
  });

  it("converts coordination-number based organization numbers", () => {
    const org = SwedishOrganizationNumber.parse("199908672398");
    const coordinationNumber = toCoordinationNumber(org);

    expect(coordinationNumber).toBeInstanceOf(SwedishCoordinationNumber);
    expect(coordinationNumber!.to12DigitString()).toBe("199908672398");
  });

  it("builds lookup URLs", () => {
    const org = SwedishOrganizationNumber.parse("559246-0421");
    const vat = EuVatNumber.parse("SE559246042101");
    const lei = LeiCode.parse("5493001KJTIIGC8Y1R12");

    expect(getBolagsverketUrl(org).toString()).toBe(
      "https://foretagsinfo.bolagsverket.se/sok-foretagsinformation-web/foretag/559246-0421",
    );
    expect(getAllabolagUrl(org)).toBe("https://www.allabolag.se/165592460421");
    expect(toViesUrl(vat)).toBe(
      "https://ec.europa.eu/taxation_customs/vies/#/vat-validation/SE559246042101",
    );
    expect(getGleifUrl(lei).toString()).toBe(
      "https://search.gleif.org/#/record/5493001KJTIIGC8Y1R12",
    );
  });
});

describe("SwedishOrganizationIdentifierParser", () => {
  afterEach(() => PrimitivesDefaults.reset());

  it("parses Swedish organization numbers first when Swedish default country", () => {
    PrimitivesDefaults.countryAlpha2Code = "SE";
    const parsed = SwedishOrganizationIdentifierParser.tryParse("559246-0421", {
      organizationName: "Budi Auktioner AB",
    });

    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe(SwedishOrganizationIdentifierType.SwedishOrganizationNumber);
    expect(parsed!.normalizedValue).toBe("165592460421");
    expect(parsed!.organizationTypeHintCertain).toBe(SwedishOrganizationType.Aktiebolag);
  });

  it("classifies personal identity numbers", () => {
    const parsed = SwedishOrganizationIdentifierParser.tryParse("199908072391");

    expect(parsed!.type).toBe(SwedishOrganizationIdentifierType.SwedishPersonalIdentityNumber);
    expect(parsed!.organizationTypeHintCertain).toBe(
      SwedishOrganizationType.EnskildFirmaEllerPrivatperson,
    );
  });

  it("classifies private persons and sole proprietors from options or name", () => {
    const privatePerson = SwedishOrganizationIdentifierParser.tryParse("199908072391", {
      isPrivatePerson: true,
    })!;
    const soleProprietor = SwedishOrganizationIdentifierParser.tryParse("199908072391", {
      isPrivatePerson: false,
    })!;
    const inferredSoleProprietor = SwedishOrganizationIdentifierParser.tryParse("199908072391", {
      organizationName: "Anna Andersson EF",
    })!;

    expect(privatePerson.organizationTypeHintCertain).toBe(
      SwedishOrganizationType.EnskildFirmaEllerPrivatperson,
    );
    expect(privatePerson.organizationTypeHintBestGuess).toBe(SwedishOrganizationType.Privatperson);
    expect(soleProprietor.organizationTypeHintCertain).toBe(
      SwedishOrganizationType.EnskildFirmaEllerPrivatperson,
    );
    expect(soleProprietor.organizationTypeHintBestGuess).toBe(SwedishOrganizationType.EnskildFirma);
    expect(inferredSoleProprietor.organizationTypeHintBestGuess).toBe(
      SwedishOrganizationType.EnskildFirma,
    );
  });

  it("classifies coordination numbers", () => {
    const parsed = SwedishOrganizationIdentifierParser.tryParse("199908672398");

    expect(parsed!.type).toBe(SwedishOrganizationIdentifierType.SwedishCoordinationNumber);
    expect(parsed!.normalizedValue).toBe("199908672398");
    expect(parsed!.swedishOrganizationNumber!.isPerson).toBe(true);
  });

  it("parses VAT, DUNS and LEI identifiers", () => {
    expect(SwedishOrganizationIdentifierParser.tryParse("SE559246042101")!.type).toBe(
      SwedishOrganizationIdentifierType.EuVatNumber,
    );
    expect(SwedishOrganizationIdentifierParser.tryParse("123456789")!.type).toBe(
      SwedishOrganizationIdentifierType.DunsNumber,
    );
    expect(SwedishOrganizationIdentifierParser.tryParse("5493001KJTIIGC8Y1R12")!.type).toBe(
      SwedishOrganizationIdentifierType.LeiCode,
    );
  });

  it("returns null for empty, invalid, and too-long identifiers", () => {
    expect(SwedishOrganizationIdentifierParser.tryParse(null)).toBeNull();
    expect(SwedishOrganizationIdentifierParser.tryParse("")).toBeNull();
    expect(SwedishOrganizationIdentifierParser.tryParse(" ")).toBeNull();
    expect(SwedishOrganizationIdentifierParser.tryParse("invalid")).toBeNull();
    expect(SwedishOrganizationIdentifierParser.tryParse("!".repeat(31))).toBeNull();
  });

  it("parse throws for invalid identifiers", () => {
    expect(() => SwedishOrganizationIdentifierParser.parse("invalid")).toThrow(
      "Could not parse input as a known organization/identity number.",
    );
  });

  it("filters identifiers by country", () => {
    expect(
      SwedishOrganizationIdentifierParser.tryParseForCountry("559246-0421", "SE"),
    ).not.toBeNull();
    expect(SwedishOrganizationIdentifierParser.tryParseForCountry("559246-0421", "DE")).toBeNull();
    expect(
      SwedishOrganizationIdentifierParser.tryParseForCountry("DE123456789", "DE"),
    ).not.toBeNull();
    expect(SwedishOrganizationIdentifierParser.tryParseForCountry("123456789", "SE")).toBeNull();
  });

  it("parseForCountry returns typed identifiers or throws", () => {
    expect(
      SwedishOrganizationIdentifierParser.parseForCountry("559246-0421", "SE").normalizedValue,
    ).toBe("165592460421");
    expect(
      SwedishOrganizationIdentifierParser.parseForCountry("DE123456789", "DE").normalizedValue,
    ).toBe("DE123456789");
    expect(() => SwedishOrganizationIdentifierParser.parseForCountry("559246-0421", "DE")).toThrow(
      "Could not parse input as a known organization/identity number for country DE.",
    );
    expect(() => SwedishOrganizationIdentifierParser.parseForCountry("invalid", "SE")).toThrow();
  });

  it("tryParseForCountry rejects missing country and non-country-specific identifiers", () => {
    expect(SwedishOrganizationIdentifierParser.tryParseForCountry("559246-0421", null)).toBeNull();
    expect(SwedishOrganizationIdentifierParser.tryParseForCountry("559246-0421", "")).toBeNull();
    expect(
      SwedishOrganizationIdentifierParser.tryParseForCountry("5493001KJTIIGC8Y1R12", "SE"),
    ).toBeNull();
  });

  it("normalizes identifiers according to their concrete type", () => {
    expect(SwedishOrganizationIdentifierParser.tryParse("559246-0421")!.normalizedValue).toBe(
      "165592460421",
    );
    expect(SwedishOrganizationIdentifierParser.tryParse("SE559246042101")!.normalizedValue).toBe(
      "SE559246042101",
    );
    expect(SwedishOrganizationIdentifierParser.tryParse("123-456-789")!.normalizedValue).toBe(
      "123456789",
    );
    expect(
      SwedishOrganizationIdentifierParser.tryParse("5493001KJTIIGC8Y1R12")!.normalizedValue,
    ).toBe("5493001KJTIIGC8Y1R12");
  });
});
