import { describe, expect, it } from "vitest";
import {
  maskAddress,
  maskAddressCity,
  maskAddressStreet,
  maskAddressZipCode,
  maskPhoneNumberDetailed,
  maskSwedishAddress,
  maskSwedishAddressZipCode,
} from "../../src/contact/contact-masking.js";
import { Address } from "../../src/contact/address.js";
import { AddressCity } from "../../src/contact/address-city.js";
import { AddressStreet } from "../../src/contact/address-street.js";
import { AddressZipCode } from "../../src/contact/address-zip-code.js";
import { PhoneNumber } from "../../src/contact/phone-number.js";
import { SwedishAddress } from "../../src/contact/swedish-address.js";
import { SwedishAddressZipCode } from "../../src/contact/swedish-address-zip-code.js";

describe("contact masking", () => {
  it("masks zip code", () => {
    expect(maskAddressZipCode(AddressZipCode.parse("11453"))).toBe("*** **");
  });

  it("masks Swedish zip code", () => {
    expect(maskSwedishAddressZipCode(SwedishAddressZipCode.parse("11453"))).toBe("*** **");
  });

  it("masks city", () => {
    expect(maskAddressCity(AddressCity.parse("Stockholm"))).toBe("S********");
  });

  it("masks street with number", () => {
    expect(maskAddressStreet(AddressStreet.parse("Storgatan 12"))).toBe("Storgatan **");
  });

  it("masks address (Swedish)", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm, Sverige");
    expect(maskAddress(a)).toBe("Storgatan **, *** ** Stockholm, Sverige");
  });

  it("masks Swedish address (omits country)", () => {
    const a = SwedishAddress.parse("Storgatan 12, 114 53 Stockholm");
    expect(maskSwedishAddress(a)).toBe("Storgatan **, *** ** Stockholm, Sverige");
  });

  it("masks Swedish phone keeping last 2 digits", () => {
    const p = PhoneNumber.parse("070-174 06 33");
    const masked = maskPhoneNumberDetailed(p);
    expect(masked.endsWith("33")).toBe(true);
    expect(masked).toContain("*");
  });

  it("masks international phone keeping last 2 digits", () => {
    const p = PhoneNumber.parse("+44 20 7946 0958");
    const masked = maskPhoneNumberDetailed(p);
    expect(masked.startsWith("+44")).toBe(true);
    expect(masked.endsWith("58")).toBe(true);
  });
});
