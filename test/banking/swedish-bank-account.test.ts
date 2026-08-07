import { describe, expect, it } from "vitest";
import {
  SwedishBank,
  SwedishBankAccount,
  maskSwedishBankAccount,
} from "../../src/banking/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("SwedishBankAccount.isValid", () => {
  it.each([
    "50011234567",
    "6789123456789",
    "70001234567",
    "81234123456",
    "33001234567890",
    "37821234567890",
    "11001234567",
    "95001234567890",
    "12001234567",
    "34001234567",
    "90201234567",
    "91501234567",
    "92501234567",
    "92701234567",
    "97501234567",
    "  7000  1234567  ",
    "81234-123456",
  ])("returns true for %s", (input) => {
    expect(SwedishBankAccount.isValid(input)).toBe(true);
  });

  it.each([
    "50010123456",
    "6789012345678",
    "70000123456",
    "81234012345",
    "33000123456789",
    "37820123456789",
    "11000123456",
    "95000123456789",
    "12000123456",
    "34000123456",
    "90200123456",
    "91500123456",
    "92500123456",
    "92700123456",
    "97500123456",
  ])("returns true for padded account after clearing %s", (input) => {
    expect(SwedishBankAccount.isValid(input)).toBe(true);
  });

  it.each([
    null,
    "",
    " ",
    "700012345678901",
    "11001234567890",
    "330012345678900",
    "378212345678900",
    "24001234567890",
    "90201234567890",
    "95001234567",
    "92701234567890",
    "99991234567",
    "400-012345",
    "915012345678",
    "927012345678",
    "8123412345",
    "95701234567",
    "5001123",
  ])("returns false for %s", (input) => {
    expect(SwedishBankAccount.isValid(input)).toBe(false);
  });
});

describe("SwedishBankAccount.tryParse", () => {
  it("returns clearing and account", () => {
    const r = SwedishBankAccount.tryParse("50011234567")!;
    expect(r.clearingNumber).toBe("5001");
    expect(r.accountNumber).toBe("1234567");
    expect(r.bank).toBe(SwedishBank.SEB);
    expect(r.bankName).toBe("SEB");
    expect(r.formatted).toBe("5001-1234567");
  });

  it("handles 5-digit Swedbank clearing", () => {
    const r = SwedishBankAccount.tryParse("81234123456")!;
    expect(r.clearingNumber).toBe("81234");
    expect(r.accountNumber).toBe("123456");
    expect(r.bank).toBe(SwedishBank.Swedbank);
    expect(r.formatted).toBe("81234-123456");
  });

  it.each([
    ["81234123456", "81234", "123456"],
    ["70001234567", "7000", "1234567"],
    ["  7000 1234567  ", "7000", "1234567"],
    ["81234-123456", "81234", "123456"],
    ["8105-9694719622-3", "81059", "6947196223"],
    ["33007109230511", "3300", "7109230511"],
    ["3300 590413-0035", "3300", "5904130035"],
  ])("returns clearing and account for %s", (input, clearing, account) => {
    const r = SwedishBankAccount.tryParse(input)!;
    expect(r.clearingNumber).toBe(clearing);
    expect(r.accountNumber).toBe(account);
  });

  it.each([null, "", " ", "9999-1234567", "9270-12345678", "400-012345"])(
    "returns null for invalid input %s",
    (input) => {
      expect(SwedishBankAccount.tryParse(input)).toBeNull();
    },
  );

  it.each([
    ["11001234567", "Nordea"],
    ["11501234567", "Nordea"],
    ["11991234567", "Nordea"],
    ["12001234567", "Danske Bank"],
    ["12951234567", "Danske Bank"],
    ["13991234567", "Danske Bank"],
    ["14001234567", "Nordea"],
    ["17491234567", "Nordea"],
    ["20991234567", "Nordea"],
    ["23001234567", "Ålandsbanken Abp (Finland) svensk filial"],
    ["23451234567", "Ålandsbanken Abp (Finland) svensk filial"],
    ["23991234567", "Ålandsbanken Abp (Finland) svensk filial"],
    ["24001234567", "Danske Bank"],
    ["24451234567", "Danske Bank"],
    ["24991234567", "Danske Bank"],
    ["30001234567", "Nordea"],
    ["31451234567", "Nordea"],
    ["32991234567", "Nordea"],
    ["33001234567890", "Nordea Personkonto"],
    ["33011234567", "Nordea"],
    ["33501234567", "Nordea"],
    ["33991234567", "Nordea"],
    ["34001234567", "Länsförsäkringar Bank"],
    ["34051234567", "Länsförsäkringar Bank"],
    ["34091234567", "Länsförsäkringar Bank"],
    ["34101234567", "Nordea"],
    ["35901234567", "Nordea"],
    ["37811234567", "Nordea"],
    ["37821234567890", "Nordea Personkonto"],
    ["37831234567", "Nordea"],
    ["43811234567", "Nordea"],
    ["49991234567", "Nordea"],
    ["50001234567", "SEB"],
    ["54951234567", "SEB"],
    ["59991234567", "SEB"],
    ["600012345678", "Handelsbanken"],
    ["649512345678", "Handelsbanken"],
    ["699912345678", "Handelsbanken"],
    ["90201234567", "Länsförsäkringar Bank"],
    ["90251234567", "Länsförsäkringar Bank"],
    ["90291234567", "Länsförsäkringar Bank"],
    ["90401234567", "Citibank Europe plc"],
    ["90451234567", "Citibank Europe plc"],
    ["90491234567", "Citibank Europe plc"],
    ["90601234567", "Länsförsäkringar Bank"],
    ["90651234567", "Länsförsäkringar Bank"],
    ["90691234567", "Länsförsäkringar Bank"],
    ["90701234567", "Multitude Bank"],
    ["90751234567", "Multitude Bank"],
    ["90791234567", "Multitude Bank"],
    ["91001234567", "Nordnet Bank"],
    ["91051234567", "Nordnet Bank"],
    ["91091234567", "Nordnet Bank"],
    ["91201234567", "SEB"],
    ["91221234567", "SEB"],
    ["91241234567", "SEB"],
    ["91301234567", "SEB"],
    ["91391234567", "SEB"],
    ["91491234567", "SEB"],
    ["91501234567", "Skandiabanken"],
    ["91601234567", "Skandiabanken"],
    ["91691234567", "Skandiabanken"],
    ["91701234567", "Ikano Bank"],
    ["91751234567", "Ikano Bank"],
    ["91791234567", "Ikano Bank"],
    ["91801234567", "Danske Bank"],
    ["91851234567", "Danske Bank"],
    ["91891234567", "Danske Bank"],
    ["91901234567", "DNB Sverige"],
    ["91951234567", "DNB Sverige"],
    ["91991234567", "DNB Sverige"],
    ["92301234567", "Marginalen Bank"],
    ["92351234567", "Marginalen Bank"],
    ["92391234567", "Marginalen Bank"],
    ["92501234567", "SBAB Bank"],
    ["92551234567", "SBAB Bank"],
    ["92591234567", "SBAB Bank"],
    ["92701234567", "ICA Banken"],
    ["92751234567", "ICA Banken"],
    ["92791234567", "ICA Banken"],
    ["92801234567", "Resurs Bank"],
    ["92851234567", "Resurs Bank"],
    ["92891234567", "Resurs Bank"],
    ["93001234567", "Swedbank"],
    ["93151234567", "Swedbank"],
    ["93291234567", "Swedbank"],
    ["93301234567", "Swedbank"],
    ["93391234567", "Swedbank"],
    ["93491234567", "Swedbank"],
    ["93901234567", "Landshypotek Bank"],
    ["93951234567", "Landshypotek Bank"],
    ["93991234567", "Landshypotek Bank"],
    ["94601234567", "Santander"],
    ["94651234567", "Santander"],
    ["94691234567", "Santander"],
    ["94701234567", "BNP Paribas S.A. Bankfilial Sverige"],
    ["94751234567", "BNP Paribas S.A. Bankfilial Sverige"],
    ["94791234567", "BNP Paribas S.A. Bankfilial Sverige"],
    ["95001234567890", "Nordea (Plusgirot)"],
    ["95251234567890", "Nordea (Plusgirot)"],
    ["95491234567890", "Nordea (Plusgirot)"],
    ["95501234567", "Avanza Bank"],
    ["95551234567", "Avanza Bank"],
    ["95691234567", "Avanza Bank"],
    ["95701234567890", "Sparbanken Syd"],
    ["95751234567890", "Sparbanken Syd"],
    ["95791234567890", "Sparbanken Syd"],
    ["95801234567", "AION Bank"],
    ["95851234567", "AION Bank"],
    ["95891234567", "AION Bank"],
    ["95901234567", "EP Bank"],
    ["95951234567", "EP Bank"],
    ["95991234567", "EP Bank"],
    ["96301234567", "Lån & Spar Bank"],
    ["96351234567", "Lån & Spar Bank"],
    ["96391234567", "Lån & Spar Bank"],
    ["96601234567", "Svea Bank"],
    ["96651234567", "Svea Bank"],
    ["96691234567", "Svea Bank"],
    ["96701234567", "JAK Medlemsbank"],
    ["96751234567", "JAK Medlemsbank"],
    ["96791234567", "JAK Medlemsbank"],
    ["96801234567", "Enity Bank Group"],
    ["96851234567", "Enity Bank Group"],
    ["96891234567", "Enity Bank Group"],
    ["97001234567", "Ekobanken"],
    ["97051234567", "Ekobanken"],
    ["97091234567", "Ekobanken"],
    ["97101234567", "Lunar Bank"],
    ["97151234567", "Lunar Bank"],
    ["97191234567", "Lunar Bank"],
    ["97501234567", "Northmill Bank"],
    ["97551234567", "Northmill Bank"],
    ["97591234567", "Northmill Bank"],
    ["97801234567", "Klarna Bank"],
    ["97851234567", "Klarna Bank"],
    ["97891234567", "Klarna Bank"],
    ["98801234567890", "Riksgälden"],
    ["98851234567890", "Riksgälden"],
    ["98891234567890", "Riksgälden"],
    ["99601234567890", "Nordea (Plusgirot)"],
    ["99651234567890", "Nordea (Plusgirot)"],
    ["99691234567890", "Nordea (Plusgirot)"],
  ])("maps %s to %s", (input, bankName) => {
    const r = SwedishBankAccount.tryParse(input)!;
    expect(r.bankName).toBe(bankName);
  });
});

describe("SwedishBankAccount string conversions", () => {
  it("toString returns formatted form", () => {
    expect(SwedishBankAccount.parse("50011234567").toString()).toBe("5001-1234567");
  });
  it("toNormalizedString concatenates clearing and account", () => {
    expect(SwedishBankAccount.parse("50011234567").toNormalizedString()).toBe("50011234567");
  });
  it("toDisplayString prefixes with Bankkonto", () => {
    expect(SwedishBankAccount.parse("50011234567").toDisplayString()).toBe(
      "Bankkonto 5001-1234567",
    );
  });
});

describe("SwedishBankAccount.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["1", false, ValidationErrorReason.InvalidLength],
    ["24001234567890", false, ValidationErrorReason.InvalidAccountLengthForBank],
    ["50011234567", true, null],
  ])("validates %s", (input, expected, reason) => {
    const r = SwedishBankAccount.validate(input as string | null);
    expect(r.isValid).toBe(expected);
    if (reason) expect(r.issues[0]!.reason).toBe(reason);
  });
});

describe("maskSwedishBankAccount", () => {
  it("preserves clearing number by default", () => {
    expect(maskSwedishBankAccount(SwedishBankAccount.parse("50011234567"))).toBe("5001-*******");
  });
  it("can mask clearing number", () => {
    expect(
      maskSwedishBankAccount(SwedishBankAccount.parse("50011234567"), {
        maskClearingNumber: true,
      }),
    ).toBe("****-*******");
  });
});

describe("SwedishBankAccount equality", () => {
  it("compares by clearing + account", () => {
    const a = SwedishBankAccount.parse("50011234567");
    const b = SwedishBankAccount.parse("50011234567");
    expect(a.equals(b)).toBe(true);
  });

  it("orders by normalized value", () => {
    const a = SwedishBankAccount.parse("50011234567");
    const b = SwedishBankAccount.parse("70001234567");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(null)).toBe(1);
  });
});
