import { describe, expect, it } from "vitest";
import { PhoneCallingCode } from "../../src/contact/phone-calling-code.js";

describe("PhoneCallingCode", () => {
  it("parses + prefixed", () => {
    const c = PhoneCallingCode.parse("+46");
    expect(c.value).toBe("46");
    expect(c.countryCode).toBe("SE");
    expect(c.toString()).toBe("+46");
  });

  it("parses 00 prefix", () => {
    expect(PhoneCallingCode.parse("0046").value).toBe("46");
  });

  it("parses bare digits", () => {
    expect(PhoneCallingCode.parse("358").value).toBe("358");
  });

  it.each([
    ["Sweden", "46", "SE"],
    ["Norway", "47", "NO"],
    ["Finland", "358", "FI"],
    ["Denmark", "45", "DK"],
    ["Germany", "49", "DE"],
    ["Poland", "48", "PL"],
    ["Estonia", "372", "EE"],
    ["Lithuania", "370", "LT"],
    ["Romania", "40", "RO"],
    ["Bulgaria", "359", "BG"],
    ["Latvia", "371", "LV"],
    ["CzechRepublic", "420", "CZ"],
    ["Spain", "34", "ES"],
    ["Netherlands", "31", "NL"],
    ["Greece", "30", "GR"],
    ["Italy", "39", "IT"],
    ["Slovenia", "386", "SI"],
    ["Croatia", "385", "HR"],
    ["Portugal", "351", "PT"],
    ["Hungary", "36", "HU"],
    ["France", "33", "FR"],
    ["Slovakia", "421", "SK"],
    ["Belgium", "32", "BE"],
    ["UnitedKingdom", "44", "GB"],
    ["Austria", "43", "AT"],
    ["Cyprus", "357", "CY"],
    ["Iceland", "354", "IS"],
    ["Switzerland", "41", "CH"],
    ["Ireland", "353", "IE"],
    ["Luxembourg", "352", "LU"],
    ["Malta", "356", "MT"],
    ["Liechtenstein", "423", "LI"],
    ["UnitedStates", "1", "US"],
    ["Russia", "7", "RU"],
  ])("exposes %s as a named constant", (name, digits, countryCode) => {
    const code = (PhoneCallingCode as unknown as Record<string, PhoneCallingCode>)[name]!;
    expect(code.value).toBe(digits);
    expect(code.countryCode).toBe(countryCode);
  });

  it("rejects unknown codes", () => {
    expect(PhoneCallingCode.tryParse("+999")).toBeNull();
    expect(PhoneCallingCode.tryParse("nope")).toBeNull();
  });

  it("static instances", () => {
    expect(PhoneCallingCode.Sweden.value).toBe("46");
    expect(PhoneCallingCode.UnitedStates.value).toBe("1");
  });

  it("isNormalized", () => {
    expect(PhoneCallingCode.isNormalized("46")).toBe(true);
    expect(PhoneCallingCode.isNormalized("+46")).toBe(false);
  });
});
