import { describe, expect, it } from "vitest";
import { PersonFamilyName } from "../../src/person/index.js";

describe("PersonFamilyName", () => {
  it("parses simple family name", () => {
    expect(PersonFamilyName.tryParse("Andersson")!.value).toBe("Andersson");
  });

  it("normalizes uniform-case input", () => {
    expect(PersonFamilyName.tryParse("ANDERSSON")!.value).toBe("Andersson");
    expect(PersonFamilyName.tryParse("andersson")!.value).toBe("Andersson");
  });

  it("preserves mixed case", () => {
    expect(PersonFamilyName.tryParse("McDonald")!.value).toBe("McDonald");
    expect(PersonFamilyName.tryParse("von Trapp")!.value).toBe("von Trapp");
  });

  it("rejects invalid", () => {
    expect(PersonFamilyName.tryParse(null)).toBeNull();
    expect(PersonFamilyName.tryParse("")).toBeNull();
    expect(PersonFamilyName.tryParse("123")).toBeNull();
  });

  it("isNormalized true for normalized form", () => {
    expect(PersonFamilyName.isNormalized("Andersson")).toBe(true);
    expect(PersonFamilyName.isNormalized("andersson")).toBe(false);
  });

  it("accepts single-letter family name", () => {
    const r = PersonFamilyName.tryParse("B");
    expect(r).not.toBeNull();
    expect(r!.value).toBe("B");
    expect(PersonFamilyName.isValid("B")).toBe(true);
    expect(PersonFamilyName.normalize("b")).toBe("B");
  });
});
