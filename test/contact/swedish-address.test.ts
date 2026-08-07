import { describe, expect, it } from "vitest";
import { SwedishAddress } from "../../src/contact/swedish-address.js";
import { SwedishAddressZipCode } from "../../src/contact/swedish-address-zip-code.js";

describe("SwedishAddressZipCode", () => {
  it("parses 5-digit form", () => {
    const z = SwedishAddressZipCode.parse("11453");
    expect(z.value).toBe("11453");
    expect(z.formatted).toBe("114 53");
  });

  it("rejects non-Swedish", () => {
    expect(SwedishAddressZipCode.tryParse("DK-9000")).toBeNull();
    expect(SwedishAddressZipCode.tryParse("12")).toBeNull();
  });
});

describe("SwedishAddress", () => {
  it("parses single line", () => {
    const a = SwedishAddress.parse("Storgatan 12, 114 53 Stockholm");
    expect(a.zipCode.value).toBe("11453");
    expect(a.city.value).toBe("Stockholm");
    expect(a.country.alpha2Code).toBe("SE");
  });

  it("rejects non-Swedish countries", () => {
    expect(SwedishAddress.tryParse("Storgatan 12, 114 53 Stockholm, Tyskland")).toBeNull();
  });

  it("toString omits country", () => {
    const a = SwedishAddress.parse("Storgatan 12, 114 53 Stockholm");
    expect(a.toString()).toBe("Storgatan 12, 114 53 Stockholm");
  });
});
