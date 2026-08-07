import { describe, expect, it } from "vitest";
import { Bic, maskBic } from "../../src/banking/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("Bic.isValid", () => {
  it.each([
    "NDEASESS",
    "NDEASESSXXX",
    "DEUTDEFF500",
    "ESSESESS",
    "SWEDSESS",
    "HANDSESS",
    "ndeasess",
    "NDEA SE SS",
    "NDEA-SE-SS",
  ])("returns true for %s", (input) => {
    expect(Bic.isValid(input)).toBe(true);
  });

  it.each([null, "", " ", "BAD", "1234SESS", "NDEAZZSS", "NDEASESSWAYTOOLONG"])(
    "returns false for %s",
    (input) => {
      expect(Bic.isValid(input)).toBe(false);
    },
  );
});

describe("Bic.tryParse", () => {
  it("returns components for 8-char BIC", () => {
    const b = Bic.tryParse("NDEASESS")!;
    expect(b.code).toBe("NDEASESS");
    expect(b.institutionCode).toBe("NDEA");
    expect(b.countryCode).toBe("SE");
    expect(b.locationCode).toBe("SS");
    expect(b.branchCode).toBeNull();
    expect(b.isPrimaryOffice).toBe(true);
  });

  it("returns components for 11-char BIC", () => {
    const b = Bic.tryParse("DEUTDEFF500")!;
    expect(b.code).toBe("DEUTDEFF500");
    expect(b.branchCode).toBe("500");
    expect(b.isPrimaryOffice).toBe(false);
  });

  it("uppercases input", () => {
    const b = Bic.tryParse("ndeasess")!;
    expect(b.code).toBe("NDEASESS");
  });

  it("strips spaces and hyphens", () => {
    expect(Bic.tryParse("NDEA SE SS")!.code).toBe("NDEASESS");
    expect(Bic.tryParse("NDEA-SE-SS")!.code).toBe("NDEASESS");
  });
});

describe("Bic.parse", () => {
  it("returns the parsed BIC", () => {
    expect(Bic.parse("NDEASESS").code).toBe("NDEASESS");
  });
  it("throws for invalid input", () => {
    expect(() => Bic.parse("INVALID")).toThrow();
  });
});

describe("Bic equality and ordering", () => {
  it("equals same code", () => {
    expect(Bic.parse("NDEASESS").equals(Bic.parse("ndeasess"))).toBe(true);
  });
  it("orders alphabetically", () => {
    const a = Bic.parse("HANDSESS");
    const b = Bic.parse("NDEASESS");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(null)).toBe(1);
  });
});

describe("Bic.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["", false, ValidationErrorReason.InputIsEmpty],
    ["NDEAZZSS", false, ValidationErrorReason.UnknownCountryCode],
    ["123", false, ValidationErrorReason.InvalidFormat],
    ["NDEASESS", true, null],
  ])("validates %s", (input, expectedIsValid, expectedReason) => {
    const r = Bic.validate(input as string | null);
    expect(r.isValid).toBe(expectedIsValid);
    if (expectedReason) {
      expect(r.issues[0]!.reason).toBe(expectedReason);
    }
  });
});

describe("maskBic", () => {
  it("preserves the country code", () => {
    expect(maskBic(Bic.parse("NDEASESS"))).toBe("****SE**");
    expect(maskBic(Bic.parse("DEUTDEFF500"))).toBe("****DE*****");
  });
});

describe("Bic.findCandidatesInText", () => {
  it("finds BIC in text", () => {
    const cands = Bic.findCandidatesInText("Send to NDEASESS today.");
    expect(cands.length).toBe(1);
    expect(cands[0]!.value.code).toBe("NDEASESS");
  });

  it("ignores lowercase candidates", () => {
    const cands = Bic.findCandidatesInText("Send to ndeasess today.");
    expect(cands.length).toBe(0);
  });
});
