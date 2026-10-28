import { describe, expect, it } from "vitest";
import { PhoneNumber } from "../../src/contact/phone-number.js";
import { PhoneCallingCode } from "../../src/contact/phone-calling-code.js";
import { PhoneNumberTestData } from "../../src/contact/phone-number-test-data.js";
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

  it.each([
    ["0701740635", "070-174 06 35"],
    ["+46701740635", "070-174 06 35"],
    ["0313900642", "031-390 06 42"],
    ["0406280473", "040-628 04 73"],
    ["0846500456", "08-465 004 56"],
    ["0980319247", "0980-31 92 47"],
    ["08012345", "08-01 23 45"],
    ["080123456", "08-012 34 56"],
    ["031012345", "031-01 23 45"],
    ["018012345", "018-01 23 45"],
    ["098001234", "0980-012 34"],
    ["0901120000", "090-112 00 00"],
    ["0900012345", "0900-01 23 45"],
    ["0100123456", "010-012 34 56"],
    ["0778123456", "077-812 34 56"],
  ])("formats Swedish %s with the destination code from the numbering plan", (input, expected) => {
    const p = PhoneNumber.parse(input);
    expect(p.formatted).toBe(expected);
    expect(p.toLocalString()).toBe(expected);
    expect(PhoneNumber.format(input)).toBe(expected);
  });

  it.each([
    ["0701740635", "+46 70 174 06 35"],
    ["0846500456", "+46 8 465 004 56"],
    ["0313900642", "+46 31 390 06 42"],
    ["0980319247", "+46 980 31 92 47"],
  ])("formats Swedish %s internationally for another default calling code", (input, expected) => {
    const p = PhoneNumber.parse(input);
    expect(p.toLocalString(PhoneCallingCode.Norway)).toBe(expected);
    expect(PhoneNumber.format(p.toE164String(), { defaultCallingCode: "47" })).toBe(expected);
  });

  it.each([
    ...PhoneNumberTestData.mobile.map((n) => [n, `070-174 06 ${n.slice(-2)}`]),
    ...PhoneNumberTestData.landlineGothenburg.map((n) => [n, `031-390 06 ${n.slice(-2)}`]),
    ...PhoneNumberTestData.landlineMalmo.map((n) => [n, `040-628 04 ${n.slice(-2)}`]),
    ...PhoneNumberTestData.landlineStockholm.map((n) => [n, `08-465 004 ${n.slice(-2)}`]),
    ...PhoneNumberTestData.landlineKiruna.map((n) => [n, `0980-31 92 ${n.slice(-2)}`]),
  ])("formats PTS-reserved number %s as %s", (input, expected) => {
    expect(PhoneNumber.parse(input!).formatted).toBe(expected);
  });
});
