import { describe, expect, it } from "vitest";
import { SwedishCoordinationNumber, maskCoordinationNumber } from "../../src/person/index.js";

const fixedClock = { now: () => new Date(Date.UTC(2025, 0, 1)) };

describe("SwedishCoordinationNumber", () => {
  it("parses valid coordination number", () => {
    const r = SwedishCoordinationNumber.tryParse("199903672385", { clock: fixedClock });
    expect(r).not.toBeNull();
    expect(r!.value).toBe("199903672385");
    expect(r!.realDay).toBe(7);
  });

  it("parses 10-digit and dashed forms", () => {
    expect(SwedishCoordinationNumber.tryParse("9903672385", { clock: fixedClock })).not.toBeNull();
    expect(SwedishCoordinationNumber.tryParse("990367-2385", { clock: fixedClock })).not.toBeNull();
  });

  it("rejects personal identity numbers", () => {
    expect(SwedishCoordinationNumber.tryParse("199908072391")).toBeNull();
  });

  it("rejects invalid checksum", () => {
    expect(SwedishCoordinationNumber.tryParse("199903672380")).toBeNull();
  });

  it("validate works", () => {
    expect(SwedishCoordinationNumber.validate("199903672385").isValid).toBe(true);
    expect(SwedishCoordinationNumber.validate("").isValid).toBe(false);
    expect(SwedishCoordinationNumber.validate("abc").isValid).toBe(false);
  });

  it("masks last 4 digits", () => {
    const r = SwedishCoordinationNumber.parse("199903672385", { clock: fixedClock });
    expect(maskCoordinationNumber(r)).toBe("990367-****");
  });
});
