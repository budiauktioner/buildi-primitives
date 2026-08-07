import { describe, expect, it } from "vitest";
import {
  SwedishBankgiroNumber,
  maskSwedishBankgiroNumber,
  getBankgirotUrl,
} from "../../src/banking/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("SwedishBankgiroNumber.isValid", () => {
  it.each(["235-9321", "5805-6201", "5110-8348", "5117-7913", "900-1223"])(
    "returns true for %s",
    (input) => {
      expect(SwedishBankgiroNumber.isValid(input)).toBe(true);
    },
  );

  it.each([null, "", " ", "1234-5678", "5805-6202", "12-345"])("returns false for %s", (input) => {
    expect(SwedishBankgiroNumber.isValid(input)).toBe(false);
  });
});

describe("SwedishBankgiroNumber.tryParse", () => {
  it.each([
    ["235-9321", "2359321", "235-9321"],
    ["5805-6201", "58056201", "5805-6201"],
    ["58056201", "58056201", "5805-6201"],
    [" 5805 6201 ", "58056201", "5805-6201"],
  ])("parses %s", (input, expectedDigits, expectedFormatted) => {
    const r = SwedishBankgiroNumber.tryParse(input)!;
    expect(r.digits).toBe(expectedDigits);
    expect(r.formatted).toBe(expectedFormatted);
  });

  it.each([null, "", "abc", "1234-5678"])("returns null for %s", (input) => {
    expect(SwedishBankgiroNumber.tryParse(input)).toBeNull();
  });
});

describe("SwedishBankgiroNumber.parse", () => {
  it("returns the parsed value", () => {
    expect(SwedishBankgiroNumber.parse("5805-6201").formatted).toBe("5805-6201");
  });
  it("throws on invalid", () => {
    expect(() => SwedishBankgiroNumber.parse("1234-5678")).toThrow();
  });
});

describe("SwedishBankgiroNumber string conversions", () => {
  it("toString returns formatted", () => {
    expect(SwedishBankgiroNumber.parse("5805-6201").toString()).toBe("5805-6201");
  });
  it("toDisplayString prefixes with Bankgiro", () => {
    expect(SwedishBankgiroNumber.parse("5805-6201").toDisplayString()).toBe("Bankgiro 5805-6201");
  });
  it("toShortDisplayString prefixes with BG", () => {
    expect(SwedishBankgiroNumber.parse("5805-6201").toShortDisplayString()).toBe("BG 5805-6201");
  });
});

describe("SwedishBankgiroNumber equality and ordering", () => {
  it("equals same value", () => {
    expect(
      SwedishBankgiroNumber.parse("5805-6201").equals(SwedishBankgiroNumber.parse("58056201")),
    ).toBe(true);
  });
});

describe("SwedishBankgiroNumber.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["1234", false, ValidationErrorReason.InvalidLength],
    ["1234-5678", false, ValidationErrorReason.InvalidCheckDigit],
    ["5805-6201", true, null],
  ])("validates %s", (input, expected, reason) => {
    const r = SwedishBankgiroNumber.validate(input as string | null);
    expect(r.isValid).toBe(expected);
    if (reason) expect(r.issues[0]!.reason).toBe(reason);
  });
});

describe("maskSwedishBankgiroNumber", () => {
  it("default shows last digits", () => {
    expect(maskSwedishBankgiroNumber(SwedishBankgiroNumber.parse("5805-6201"))).toBe("****-6201");
  });
  it("can show first digits", () => {
    expect(
      maskSwedishBankgiroNumber(SwedishBankgiroNumber.parse("5805-6201"), {
        showLastDigits: false,
      }),
    ).toBe("5805-****");
  });
});

describe("getBankgirotUrl", () => {
  it("returns Bankgirot search URL", () => {
    expect(getBankgirotUrl(SwedishBankgiroNumber.parse("235-9321"))).toBe(
      "https://www.bankgirot.se/sok-bankgironummer/?bgnr=235-9321",
    );
  });
});

describe("SwedishBankgiroNumber.findCandidatesInText", () => {
  it("finds bankgiro in text", () => {
    const cands = SwedishBankgiroNumber.findCandidatesInText("Pay to bankgiro 5805-6201 today.");
    expect(cands.length).toBe(1);
    expect(cands[0]!.value.formatted).toBe("5805-6201");
  });
});
