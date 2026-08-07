import { describe, expect, it } from "vitest";
import {
  SwedishBankAccountHolderName,
  BankAccountHolderType,
  maskSwedishBankAccountHolderName,
} from "../../src/banking/index.js";

describe("SwedishBankAccountHolderName.tryParse", () => {
  it("detects organization for AB suffix", () => {
    const r = SwedishBankAccountHolderName.tryParse("VOLVO AB")!;
    expect(r.holderType).toBe(BankAccountHolderType.Organization);
    expect(r.organizationName).not.toBeNull();
    expect(r.personName).toBeNull();
  });

  it("detects person for two-word name", () => {
    const r = SwedishBankAccountHolderName.tryParse("Anna Andersson")!;
    expect(r.holderType).toBe(BankAccountHolderType.Person);
    expect(r.personName).not.toBeNull();
    expect(r.organizationName).toBeNull();
  });

  it.each([null, "", " ", "X"])("returns null for %s", (input) => {
    expect(SwedishBankAccountHolderName.tryParse(input)).toBeNull();
  });
});

describe("SwedishBankAccountHolderName string conversions", () => {
  it("toString returns the value", () => {
    expect(SwedishBankAccountHolderName.parse("Anna Andersson").toString()).toBe("Anna Andersson");
  });
});

describe("maskSwedishBankAccountHolderName", () => {
  it("preserves first character of each word", () => {
    expect(
      maskSwedishBankAccountHolderName(SwedishBankAccountHolderName.parse("Anna Andersson")),
    ).toBe("A*** A********");
  });
});
