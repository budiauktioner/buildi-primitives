import { describe, expect, it } from "vitest";
import { SwedishBankingNumberParser, SwedishBankingNumberType } from "../../src/banking/index.js";

describe("SwedishBankingNumberParser.tryParse", () => {
  it("parses IBAN", () => {
    const r = SwedishBankingNumberParser.tryParse("SE45 5000 0000 0583 9825 7466")!;
    expect(r.type).toBe(SwedishBankingNumberType.Iban);
    expect(r.iban).not.toBeNull();
  });

  it("parses BIC", () => {
    const r = SwedishBankingNumberParser.tryParse("NDEASESS")!;
    expect(r.type).toBe(SwedishBankingNumberType.Bic);
    expect(r.bic).not.toBeNull();
  });

  it("parses Bankgiro", () => {
    const r = SwedishBankingNumberParser.tryParse("5805-6201")!;
    expect(r.type).toBe(SwedishBankingNumberType.SwedishBankgiroNumber);
    expect(r.swedishBankgiroNumber).not.toBeNull();
  });

  it("parses Plusgiro", () => {
    const r = SwedishBankingNumberParser.tryParse("4131300-8")!;
    expect(r.type).toBe(SwedishBankingNumberType.SwedishPostgiroNumber);
    expect(r.swedishPostgiroNumber).not.toBeNull();
  });

  it("parses Bank account", () => {
    const r = SwedishBankingNumberParser.tryParse("50011234567")!;
    expect(r.type).toBe(SwedishBankingNumberType.SwedishBankAccount);
    expect(r.swedishBankAccount).not.toBeNull();
  });

  it("respects Bankgiro prefix", () => {
    const r = SwedishBankingNumberParser.tryParse("Bankgiro 5805-6201")!;
    expect(r.type).toBe(SwedishBankingNumberType.SwedishBankgiroNumber);
  });

  it("respects BG prefix", () => {
    const r = SwedishBankingNumberParser.tryParse("BG 5805-6201")!;
    expect(r.type).toBe(SwedishBankingNumberType.SwedishBankgiroNumber);
  });

  it("respects Plusgiro prefix", () => {
    const r = SwedishBankingNumberParser.tryParse("Plusgiro 4131300-8")!;
    expect(r.type).toBe(SwedishBankingNumberType.SwedishPostgiroNumber);
  });

  it.each([null, "", " ", "abc", "1"])("returns null for %s", (input) => {
    expect(SwedishBankingNumberParser.tryParse(input)).toBeNull();
  });
});

describe("SwedishBankingNumberParser.parse", () => {
  it("throws for invalid input", () => {
    expect(() => SwedishBankingNumberParser.parse("not-a-banking-number")).toThrow();
  });
});
