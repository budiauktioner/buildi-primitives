import { describe, expect, it } from "vitest";
import { AddressZipCode } from "../../src/contact/address-zip-code.js";
import { Country } from "../../src/geography/index.js";

describe("AddressZipCode", () => {
  it("parses Swedish 5-digit codes", () => {
    const z = AddressZipCode.parse("11453");
    expect(z.value).toBe("11453");
    expect(z.formatted).toBe("114 53");
    expect(z.isSwedish).toBe(true);
  });

  it("formats already-spaced Swedish input", () => {
    expect(AddressZipCode.format("114 53")).toBe("114 53");
    expect(AddressZipCode.normalize("114 53")).toBe("11453");
  });

  it("rejects empty / too-long", () => {
    expect(AddressZipCode.tryParse("")).toBeNull();
    expect(AddressZipCode.tryParse("12345678901234567890123")).toBeNull();
  });

  it("parses Danish DK-9000 with country hint", () => {
    const z = AddressZipCode.parse("DK-9000", { country: Country.Denmark });
    expect(z.value).toBe("DK-9000");
    expect(z.country?.alpha2Code).toBe("DK");
    expect(z.isSwedish).toBe(false);
  });

  it("findCandidatesInText finds Swedish zips", () => {
    const text = "Send to 114 53 Stockholm or 75237 Uppsala";
    const cs = AddressZipCode.findCandidatesInText(text);
    expect(cs.length).toBe(2);
    expect(cs[0]!.value.value).toBe("11453");
  });

  it("equals + compareTo", () => {
    const a = AddressZipCode.parse("11453");
    const b = AddressZipCode.parse("114 53");
    expect(a.equals(b)).toBe(true);
    expect(AddressZipCode.parse("11000").compareTo(AddressZipCode.parse("11453"))).toBeLessThan(0);
  });
});
