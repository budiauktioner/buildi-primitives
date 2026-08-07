import { describe, expect, it } from "vitest";
import {
  getBingMapsUrl,
  getGoogleMapsUrl,
  getHittaUrl,
} from "../../src/contact/contact-external-links.js";
import { getGoogleMapsUrlForAddress, getTelUri } from "../../src/contact/contact-lookup.js";
import { Address } from "../../src/contact/address.js";
import { PhoneNumber } from "../../src/contact/phone-number.js";

describe("contact lookup / external links", () => {
  it("getTelUri", () => {
    const p = PhoneNumber.parse("+46701740633");
    expect(getTelUri(p)).toBe("tel:0046701740633");
  });

  it("getGoogleMapsUrl (URL)", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm");
    const u = getGoogleMapsUrl(a);
    expect(u.hostname).toBe("www.google.com");
    expect(u.searchParams.get("api")).toBe("1");
    expect(u.searchParams.get("query")).toContain("Storgatan");
  });

  it("getBingMapsUrl", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm");
    expect(getBingMapsUrl(a).hostname).toBe("www.bing.com");
  });

  it("getHittaUrl", () => {
    const p = PhoneNumber.parse("+46701740633");
    const u = getHittaUrl(p);
    expect(u.hostname).toBe("www.hitta.se");
  });

  it("getGoogleMapsUrlForAddress (string)", () => {
    const a = Address.parse("Storgatan 12, 114 53 Stockholm");
    expect(getGoogleMapsUrlForAddress(a)).toContain("Storgatan");
  });
});
