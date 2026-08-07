import { describe, expect, it } from "vitest";
import { PhoneNumber, PhoneNumberTestData } from "../../src/contact/index.js";

describe("PhoneNumberTestData", () => {
  it.each([
    ["mobile", PhoneNumberTestData.mobile, 95],
    ["landlineGothenburg", PhoneNumberTestData.landlineGothenburg, 100],
    ["landlineMalmo", PhoneNumberTestData.landlineMalmo, 100],
    ["landlineStockholm", PhoneNumberTestData.landlineStockholm, 100],
    ["landlineKiruna", PhoneNumberTestData.landlineKiruna, 100],
  ])("%s covers the full reserved range", (_name, range, expectedCount) => {
    expect(range).toHaveLength(expectedCount);
  });

  it("all contains every reserved number", () => {
    expect(PhoneNumberTestData.all).toHaveLength(495);
    expect(new Set(PhoneNumberTestData.all).size).toBe(495);
  });

  it("exposes the documented range boundaries", () => {
    expect(PhoneNumberTestData.mobile[0]).toBe("0701740605");
    expect(PhoneNumberTestData.mobile.at(-1)).toBe("0701740699");
    expect(PhoneNumberTestData.landlineStockholm[0]).toBe("0846500400");
    expect(PhoneNumberTestData.landlineKiruna.at(-1)).toBe("0980319299");
  });

  it("every reserved number parses and is recognized as a test number", () => {
    for (const raw of PhoneNumberTestData.all) {
      const parsed = PhoneNumber.tryParse(raw);
      expect(parsed, `expected ${raw} to parse`).not.toBeNull();
      expect(parsed?.isSwedishTestPhoneNumber, `expected ${raw} to be a test number`).toBe(true);
    }
  });
});
