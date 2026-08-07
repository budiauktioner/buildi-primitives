import { describe, expect, it } from "vitest";
import { Iban, maskIban } from "../../src/banking/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("Iban.isValid", () => {
  it.each([
    "NL91 ABNA 0417 1643 00",
    "nl91abna0417164300",
    "DE89 3704 0044 0532 0130 00",
    "GB82 WEST 1234 5698 7654 32",
    "FR14 2004 1010 0505 0001 3M02 606",
    "SE45 5000 0000 0583 9825 7466",
    "IT60 X054 2811 1010 0000 0123 456",
    "AT61 1904 3002 3457 3201",
    "BE68 5390 0754 7034",
    "DK50 0040 0440 1162 43",
    "NO93 8601 1117 947",
  ])("returns true for %s", (input) => {
    expect(Iban.isValid(input)).toBe(true);
  });

  it.each([
    null,
    "",
    " ",
    "NL12A",
    "US64SVBKUS6S3300958879",
    "ZZ12ABCD1234567890123456789",
    "NL91ABNA04171643000",
    "NL00 ABNA 0417 1643 00",
  ])("returns false for %s", (input) => {
    expect(Iban.isValid(input)).toBe(false);
  });
});

describe("Iban.tryParse", () => {
  it("returns components for valid IBAN", () => {
    const iban = Iban.tryParse(" nl91 abna 0417 1643 00 ");
    expect(iban).not.toBeNull();
    expect(iban!.countryCode).toBe("NL");
    expect(iban!.value).toBe("NL91ABNA0417164300");
    expect(iban!.formatted).toBe("NL91 ABNA 0417 1643 00");
  });

  it.each([
    null,
    "",
    " ",
    "US64SVBKUS6S3300958879",
    "NL00 ABNA 0417 1643 00",
    "NL91ABNA04171643000",
  ])("returns null for invalid input %s", (input) => {
    expect(Iban.tryParse(input)).toBeNull();
  });

  it.each([
    [" nl91 abna 0417 1643 00 ", "NL91 ABNA 0417 1643 00"],
    ["de89370400440532013000", "DE89 3704 0044 0532 0130 00"],
    ["GB82-WEST-1234-5698-7654-32", "GB82 WEST 1234 5698 7654 32"],
    ["se4550000000058398257466", "SE45 5000 0000 0583 9825 7466"],
  ])("formats %s as %s", (input, expected) => {
    expect(Iban.tryParse(input)!.formatted).toBe(expected);
  });

  it("respects country code constraint", () => {
    expect(Iban.tryParse("SE45 5000 0000 0583 9825 7466", "SE")).not.toBeNull();
    expect(Iban.tryParse("SE45 5000 0000 0583 9825 7466", "DE")).toBeNull();
  });
});

describe("Iban.parse", () => {
  it("returns formatted value", () => {
    expect(Iban.parse("NL91ABNA0417164300").formatted).toBe("NL91 ABNA 0417 1643 00");
  });
  it.each(["US64SVBKUS6S3300958879", "NL00 ABNA 0417 1643 00", "NL91ABNA04171643000"])(
    "throws for invalid input %s",
    (input) => {
      expect(() => Iban.parse(input)).toThrow();
    },
  );
});

describe("Iban string conversions", () => {
  it("toString returns formatted form", () => {
    expect(Iban.parse("se4550000000058398257466").toString()).toBe("SE45 5000 0000 0583 9825 7466");
  });
  it("toDisplayString prefixes with IBAN", () => {
    expect(Iban.parse("se4550000000058398257466").toDisplayString()).toBe(
      "IBAN SE45 5000 0000 0583 9825 7466",
    );
  });
  it("toShortDisplayString prefixes with IBAN", () => {
    expect(Iban.parse("se4550000000058398257466").toShortDisplayString()).toBe(
      "IBAN SE45 5000 0000 0583 9825 7466",
    );
  });
  it("toNormalizedString returns digits only", () => {
    expect(Iban.parse("nl91abna0417164300").toNormalizedString()).toBe("NL91ABNA0417164300");
  });
});

describe("Iban equality and ordering", () => {
  it("treats same values as equal", () => {
    const a = Iban.parse("nl91abna0417164300");
    const b = Iban.parse("NL91 ABNA 0417 1643 00");
    expect(a.equals(b)).toBe(true);
  });

  it("orders by normalized value", () => {
    const a = Iban.parse("DE89370400440532013000");
    const b = Iban.parse("SE4550000000058398257466");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(null)).toBe(1);
  });
});

describe("Iban.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["", false, ValidationErrorReason.InputIsEmpty],
    [" ", false, ValidationErrorReason.InputIsEmpty],
    ["SE45", false, ValidationErrorReason.InvalidLength],
    ["XX4550000000058398257466", false, ValidationErrorReason.UnknownCountryCode],
    ["SE4450000000058398257466", false, ValidationErrorReason.InvalidCheckDigit],
    ["SE4550000000058398257466", true, null],
  ])("validates %s", (input, expectedIsValid, expectedReason) => {
    const r = Iban.validate(input as string | null);
    expect(r.isValid).toBe(expectedIsValid);
    if (expectedReason) {
      expect(r.issues).toHaveLength(1);
      expect(r.issues[0]!.reason).toBe(expectedReason);
    } else {
      expect(r.issues).toHaveLength(0);
    }
  });

  it("issues contain both language descriptions", () => {
    const r = Iban.validate("SE45");
    expect(r.issues[0]!.englishDescription.length).toBeGreaterThan(0);
    expect(r.issues[0]!.localizedDescription.length).toBeGreaterThan(0);
  });
});

describe("Iban.findCandidatesInText and masking", () => {
  it("finds candidates in text", () => {
    const text = "Pay to NL91 ABNA 0417 1643 00 today.";
    const cands = Iban.findCandidatesInText(text);
    expect(cands.length).toBe(1);
    expect(cands[0]!.value.value).toBe("NL91ABNA0417164300");
  });

  it("maskIban preserves country code and check digits", () => {
    const iban = Iban.parse("SE4550000000058398257466");
    expect(maskIban(iban)).toBe("SE45 **** **** **** **** ****");
  });
});
