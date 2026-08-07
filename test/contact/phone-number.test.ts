import { describe, expect, it } from "vitest";
import { PhoneNumber } from "../../src/contact/phone-number.js";
import { PhoneCallingCode } from "../../src/contact/phone-calling-code.js";
import { Country } from "../../src/geography/index.js";

describe("PhoneNumber", () => {
  it("parses Swedish local mobile", () => {
    const p = PhoneNumber.parse("070-174 06 33");
    expect(p.digits).toBe("0046701740633");
    expect(p.toE164String()).toBe("+46701740633");
    expect(p.isSwedish).toBe(true);
    expect(p.isMobile).toBe(true);
  });

  it("parses + international", () => {
    const p = PhoneNumber.parse("+46 70 174 06 33");
    expect(p.toE164String()).toBe("+46701740633");
  });

  it("parses 00 international", () => {
    const p = PhoneNumber.parse("0046701740633");
    expect(p.toE164String()).toBe("+46701740633");
  });

  it("formats UK number with default Sweden", () => {
    const p = PhoneNumber.parse("+44 20 7946 0958");
    expect(p.isSwedish).toBe(false);
    expect(p.country?.alpha2Code).toBe("GB");
    expect(p.toE164String()).toBe("+442079460958");
  });

  it("respects defaultCallingCode for local digits", () => {
    const p = PhoneNumber.parse("0123456789", PhoneCallingCode.Norway);
    expect(p.toE164String()).toBe("+47123456789");
  });

  it("Country form selects calling code", () => {
    const p = PhoneNumber.parse("0123456789", Country.Norway);
    expect(p.toE164String()).toBe("+47123456789");
  });

  it("rejects garbage", () => {
    expect(PhoneNumber.tryParse("abc")).toBeNull();
    expect(PhoneNumber.tryParse("")).toBeNull();
  });

  it("findCandidatesInText finds international form", () => {
    const text = "Call +46701740633 anytime.";
    const cs = PhoneNumber.findCandidatesInText(text);
    expect(cs.length).toBe(1);
    expect(cs[0]!.value.toE164String()).toBe("+46701740633");
  });

  it("normalize 'O' as zero typo", () => {
    expect(PhoneNumber.normalize("+46 7O1 740 633")).toBe("0046701740633");
  });
});
