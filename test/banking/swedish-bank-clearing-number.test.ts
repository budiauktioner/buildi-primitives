import { describe, expect, it } from "vitest";
import {
  SwedishBank,
  SwedishBankClearingNumber,
  maskSwedishBankClearingNumber,
} from "../../src/banking/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("SwedishBankClearingNumber.isValid", () => {
  it.each([
    "5001",
    "6789",
    "7000",
    "1100",
    "3300",
    "3782",
    "9270",
    "9550",
    "81234",
    "  5001  ",
    "5001-",
  ])("returns true for %s", (input) => {
    expect(SwedishBankClearingNumber.isValid(input)).toBe(true);
  });

  it.each([null, "", " ", "999", "9999", "00001", "41234", "123456"])(
    "returns false for %s",
    (input) => {
      expect(SwedishBankClearingNumber.isValid(input)).toBe(false);
    },
  );
});

describe("SwedishBankClearingNumber.tryParse", () => {
  it.each([
    ["5001", "5001", SwedishBank.SEB, "SEB"],
    ["6789", "6789", SwedishBank.Handelsbanken, "Handelsbanken"],
    ["7000", "7000", SwedishBank.Swedbank, "Swedbank"],
    ["1100", "1100", SwedishBank.Nordea, "Nordea"],
    ["3300", "3300", SwedishBank.NordeaPersonkonto, "Nordea Personkonto"],
    ["9270", "9270", SwedishBank.IcaBanken, "ICA Banken"],
    ["81234", "81234", SwedishBank.Swedbank, "Swedbank"],
  ])("resolves bank for %s", (input, digits, bank, name) => {
    const r = SwedishBankClearingNumber.tryParse(input)!;
    expect(r.digits).toBe(digits);
    expect(r.bank).toBe(bank);
    expect(r.bankName).toBe(name);
  });
});

describe("SwedishBankClearingNumber string conversions", () => {
  it.each([
    ["5001", "5001"],
    ["81234", "8123-4"],
    ["  5001  ", "5001"],
  ])("toString of %s -> %s", (input, expected) => {
    expect(SwedishBankClearingNumber.parse(input).toString()).toBe(expected);
  });

  it("toNormalizedString returns digits only", () => {
    expect(SwedishBankClearingNumber.parse("81234").toNormalizedString()).toBe("81234");
  });
});

describe("SwedishBankClearingNumber.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["999", false, ValidationErrorReason.InvalidLength],
    ["41234", false, ValidationErrorReason.InvalidSwedbankFormat],
    ["8123", false, ValidationErrorReason.InvalidSwedbankFormat],
    ["9999", false, ValidationErrorReason.UnknownClearingRange],
    ["5001", true, null],
  ])("validates %s", (input, expected, reason) => {
    const r = SwedishBankClearingNumber.validate(input as string | null);
    expect(r.isValid).toBe(expected);
    if (reason) expect(r.issues[0]!.reason).toBe(reason);
  });
});

describe("maskSwedishBankClearingNumber", () => {
  it("preserves first digit", () => {
    expect(maskSwedishBankClearingNumber(SwedishBankClearingNumber.parse("5001"))).toBe("5***");
    expect(maskSwedishBankClearingNumber(SwedishBankClearingNumber.parse("81234"))).toBe("8****");
  });
});

describe("SwedishBankClearingNumber equality", () => {
  it("compares by digits", () => {
    const a = SwedishBankClearingNumber.parse("5001");
    const b = SwedishBankClearingNumber.parse("5001");
    expect(a.equals(b)).toBe(true);
    expect(a.compareTo(SwedishBankClearingNumber.parse("6789"))).toBeLessThan(0);
  });
});
