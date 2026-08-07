import { describe, expect, it } from "vitest";
// Imported through the namespace barrel, like package consumers do, so every
// country-specific address type registers itself before the tests run.
import { Address, SwedishAddress } from "../../src/contact/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/index.js";

describe("Address", () => {
  it("parses single-line Swedish address with country", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm, Sverige");
    expect(a.street.street).toBe("Storgatan 12");
    expect(a.zipCode?.value).toBe("11453");
    expect(a.city?.value).toBe("Stockholm");
    expect(a.country?.alpha2Code).toBe("SE");
  });

  it("parses without country", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm");
    expect(a.country).toBeNull();
    expect(a.zipCode?.value).toBe("11453");
  });

  it("structured form", () => {
    const a = Address.tryParse({
      street: "Storgatan 12",
      zipCode: "11453",
      city: "Stockholm",
      country: "SE",
    });
    expect(a).not.toBeNull();
    expect(a!.country?.alpha2Code).toBe("SE");
  });

  it("toEnglishString uses English country name", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm, Tyskland");
    expect(a.toEnglishString()).toContain("Germany");
  });

  it("normalized form", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm, Sverige");
    expect(a.toNormalizedString()).toBe("Storgatan 12, 11453, Stockholm, SE");
  });

  it("rejects empty / too long", () => {
    expect(Address.tryParse("")).toBeNull();
    expect(Address.tryParse("x".repeat(2000))).toBeNull();
  });

  it("findCandidatesInText finds full Swedish address candidates", () => {
    const text = "Skicka brevet till Storgatan 12, 114 53 Stockholm senast fredag.";
    const candidates = Address.findCandidatesInText(text);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.typeName).toBe("Address");
    expect(candidates[0]?.category).toBe("Contact");
    expect(candidates[0]?.confidence).toBe(TextMatchConfidence.Medium);
    expect(candidates[0]?.value.toNormalizedString()).toBe("Storgatan 12, 11453, Stockholm");
    expect(candidates[0]?.maskedForm).toContain("Storgatan **");
    expect(candidates[0]?.startIndex).toBe(text.indexOf("Storgatan"));
  });

  it("findCandidatesInText also finds lower-confidence street-only candidates", () => {
    const text = "Möt oss vid Drottninggatan 1 innan lunch.";
    const candidates = Address.findCandidatesInText(text);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.confidence).toBe(TextMatchConfidence.Low);
    expect(candidates[0]?.value.street.street).toBe("Drottninggatan 1");
  });

  it("SwedishAddress findCandidatesInText wraps only Swedish zip and city candidates", () => {
    const text =
      "Svensk adress: Storgatan 12, 114 53 Stockholm. Tysk adress: Friedrichstraße 42, 10117 Berlin, DE.";

    const candidates = SwedishAddress.findCandidatesInText(text);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.typeName).toBe("SwedishAddress");
    expect(candidates[0]?.value.country.alpha2Code).toBe("SE");
    expect(candidates[0]?.value.zipCode.formatted).toBe("114 53");
  });

  it("asCountryAddress wraps a known country in its specific type", () => {
    const swedish = Address.parse("Storgatan 1, 114 55 Stockholm, SE").asCountryAddress();
    expect(swedish).not.toBeNull();
    expect(swedish?.country.alpha2Code).toBe("SE");

    const german = Address.parse("Hauptstraße 5, 10115 Berlin, DE").asCountryAddress();
    expect(german).not.toBeNull();
    expect(german?.country.alpha2Code).toBe("DE");
  });

  it("asCountryAddress returns null without a country", () => {
    expect(Address.parse("Storgatan 1, 114 55 Stockholm").asCountryAddress()).toBeNull();
  });

  it("supportedCountryAddressTypes includes Sweden and the country-specific types", () => {
    const codes = Address.supportedCountryAddressTypes.map((c) => c.alpha2Code);
    expect(codes).toContain("SE");
    expect(codes).toContain("DE");
    expect(codes).toContain("NO");
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("toDomesticMultilineString omits the country line", () => {
    const address = Address.parse("Storgatan 1, 114 55 Stockholm, SE");
    expect(address.toDomesticMultilineString()).toBe("Storgatan 1\n114 55 Stockholm");
  });

  it("toDomesticMultilineString keeps care-of on its own line", () => {
    const address = Address.parse("c/o Anna Andersson, Storgatan 1, 114 55 Stockholm, SE");
    expect(address.toDomesticMultilineString()).toBe(
      "c/o Anna Andersson\nStorgatan 1\n114 55 Stockholm",
    );
  });
});
