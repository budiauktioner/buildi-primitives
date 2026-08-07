import { describe, expect, it } from "vitest";
import { AddressCity } from "../../src/contact/address-city.js";

describe("AddressCity", () => {
  it("parses and capitalizes", () => {
    const c = AddressCity.parse("stockholm");
    expect(c.value).toBe("Stockholm");
  });

  it("preserves Swedish characters", () => {
    expect(AddressCity.parse("MALMÖ").value).toBe("Malmö");
  });

  it("trims and collapses whitespace", () => {
    expect(AddressCity.parse("  upp\u00a0sala  ").value).toBe("Upp Sala");
  });

  it("rejects empty / digits-only", () => {
    expect(AddressCity.tryParse("")).toBeNull();
    expect(AddressCity.tryParse("12345")).toBeNull();
  });

  it("equals + compareTo", () => {
    const a = AddressCity.parse("Lund");
    const b = AddressCity.parse("lund");
    expect(a.equals(b)).toBe(true);
    expect(AddressCity.parse("Borås").compareTo(AddressCity.parse("Lund"))).toBeLessThan(0);
  });

  it("isValid + isNormalized", () => {
    expect(AddressCity.isValid("Göteborg")).toBe(true);
    expect(AddressCity.isNormalized("Göteborg")).toBe(true);
    expect(AddressCity.isNormalized("göteborg")).toBe(false);
  });
});
