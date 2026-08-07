import { describe, expect, it } from "vitest";
import { SwedishSwishNumber, maskSwedishSwishNumber } from "../../src/banking/index.js";

describe("SwedishSwishNumber.isValid", () => {
  it.each(["1236652895", "9020033", "0701234567", "+46701234567", "070-123 45 67"])(
    "returns true for %s",
    (input) => {
      expect(SwedishSwishNumber.isValid(input)).toBe(true);
    },
  );

  it.each([null, "", " ", "abc", "12345", "1239876543210"])("returns false for %s", (input) => {
    expect(SwedishSwishNumber.isValid(input)).toBe(false);
  });
});

describe("SwedishSwishNumber.tryParse", () => {
  it("parses Swish 123 number", () => {
    const r = SwedishSwishNumber.tryParse("1236652895")!;
    expect(r.value).toBe("1236652895");
    expect(r.isSwish123).toBe(true);
    expect(r.isMobileNumber).toBe(false);
    expect(r.is90Number).toBe(false);
    expect(r.formatted).toBe("123-665 28 95");
  });

  it("parses 90-number short form (expanded)", () => {
    const r = SwedishSwishNumber.tryParse("9020033")!;
    expect(r.value).toBe("1239020033");
    expect(r.is90Number).toBe(true);
    expect(r.isSwish123).toBe(true);
    expect(r.formatted).toBe("902 00 33");
  });

  it("parses Swedish mobile number", () => {
    const r = SwedishSwishNumber.tryParse("0701234567")!;
    expect(r.isMobileNumber).toBe(true);
    expect(r.isSwish123).toBe(false);
    expect(r.phoneNumber).not.toBeNull();
  });
});

describe("maskSwedishSwishNumber", () => {
  it("masks Swish 123", () => {
    expect(maskSwedishSwishNumber(SwedishSwishNumber.parse("1236652895"))).toBe("123-*** ** **");
  });
  it("masks 90-number", () => {
    expect(maskSwedishSwishNumber(SwedishSwishNumber.parse("9020033"))).toBe("9** ** **");
  });
});

describe("SwedishSwishNumber.findCandidatesInText", () => {
  it("finds Swish 123 in text", () => {
    const cands = SwedishSwishNumber.findCandidatesInText("Donate via 123-665 28 95 to charity.");
    expect(cands.length).toBe(1);
  });
});
