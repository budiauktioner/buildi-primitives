import { describe, expect, it } from "vitest";
import {
  SwedishPersonalIdentityNumber,
  maskPersonalIdentityNumber,
} from "../../src/person/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

const fixedClock = { now: () => new Date(Date.UTC(2025, 0, 1)) };

describe("SwedishPersonalIdentityNumber", () => {
  it.each([["199908072391"], ["19990807-2391"], ["990807-2391"], ["9908072391"]])(
    "parses valid PIN %s",
    (input) => {
      const r = SwedishPersonalIdentityNumber.tryParse(input, { clock: fixedClock });
      expect(r).not.toBeNull();
      expect(r!.value).toBe("199908072391");
    },
  );

  it("formats as 10-digit with dash", () => {
    const r = SwedishPersonalIdentityNumber.parse("199908072391", { clock: fixedClock });
    expect(r.formatted).toBe("990807-2391");
  });

  it("rejects coordination numbers", () => {
    expect(SwedishPersonalIdentityNumber.tryParse("19990867-2391")).toBeNull();
  });

  it("rejects invalid checksum", () => {
    expect(SwedishPersonalIdentityNumber.tryParse("199908072390")).toBeNull();
  });

  it("rejects invalid inputs", () => {
    expect(SwedishPersonalIdentityNumber.tryParse(null)).toBeNull();
    expect(SwedishPersonalIdentityNumber.tryParse("")).toBeNull();
    expect(SwedishPersonalIdentityNumber.tryParse("abc")).toBeNull();
  });

  it("hint properties available", () => {
    const r = SwedishPersonalIdentityNumber.parse("199908072391", { clock: fixedClock });
    expect(r.dateOfBirthHint.getUTCFullYear()).toBe(1999);
    expect(r.dateOfBirthHint.getUTCMonth()).toBe(7);
    expect(r.dateOfBirthHint.getUTCDate()).toBe(7);
    expect(r.genderHint).toBe("male");
  });

  it("validate returns proper errors", () => {
    expect(SwedishPersonalIdentityNumber.validate(null).isValid).toBe(false);
    expect(SwedishPersonalIdentityNumber.validate("").issues[0]!.reason).toBe(
      ValidationErrorReason.InputIsEmpty,
    );
    expect(SwedishPersonalIdentityNumber.validate("abc").issues[0]!.reason).toBe(
      ValidationErrorReason.InvalidFormat,
    );
    expect(SwedishPersonalIdentityNumber.validate("199908072391").isValid).toBe(true);
  });

  it("masks last 4 digits", () => {
    const r = SwedishPersonalIdentityNumber.parse("199908072391", { clock: fixedClock });
    expect(maskPersonalIdentityNumber(r)).toBe("990807-****");
  });

  it("findCandidatesInText finds PINs", () => {
    const text = "My PIN is 990807-2391 and so is 19990807-2391.";
    const c = SwedishPersonalIdentityNumber.findCandidatesInText(text);
    expect(c.length).toBe(2);
  });
});
