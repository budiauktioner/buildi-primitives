import { describe, expect, it } from "vitest";
import { AddressStreet } from "../../src/contact/address-street.js";

describe("AddressStreet", () => {
  it("parses simple street with number", () => {
    const s = AddressStreet.parse("Storgatan 12");
    expect(s.street).toBe("Storgatan 12");
    expect(s.streetName).toBe("Storgatan");
    expect(s.streetNumber).toBe("12");
  });

  it("uppercases trailing house-number letter", () => {
    const s = AddressStreet.parse("Storgatan 12a");
    expect(s.street).toBe("Storgatan 12A");
    expect(s.streetNumber).toBe("12A");
  });

  it("extracts c/o", () => {
    const s = AddressStreet.parse("c/o Anna Svensson, Storgatan 12");
    expect(s.careOf).toBe("Anna Svensson");
    expect(s.street).toBe("Storgatan 12");
  });

  it("extracts apartment", () => {
    const s = AddressStreet.parse("Storgatan 12, lgh 1201");
    expect(s.apartmentNumber).toBe("1201");
    expect(s.street).toBe("Storgatan 12");
  });

  it("recognizes post box", () => {
    const s = AddressStreet.parse("Box 12345");
    expect(s.isPostBox).toBe(true);
    expect(s.postBox).toBe("12345");
    expect(s.street).toBe("Box 12345");
  });

  it("strips trailing zip+city when supplied", () => {
    const s = AddressStreet.tryParse("Storgatan 12 114 53 STOCKHOLM", {
      city: "Stockholm",
      zipCode: "114 53",
    });
    expect(s?.street).toBe("Storgatan 12");
  });

  it("rejects empty / too long", () => {
    expect(AddressStreet.tryParse("")).toBeNull();
    expect(AddressStreet.tryParse("x".repeat(300))).toBeNull();
  });

  it("sentence-cases all-uppercase input", () => {
    const s = AddressStreet.parse("STORGATAN 12");
    expect(s.street).toBe("Storgatan 12");
  });
});
