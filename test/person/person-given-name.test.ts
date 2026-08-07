import { describe, expect, it } from "vitest";
import { PersonGivenName } from "../../src/person/index.js";

describe("PersonGivenName", () => {
  it("parses single given name", () => {
    const r = PersonGivenName.tryParse("anna");
    expect(r).not.toBeNull();
    expect(r!.value).toBe("Anna");
    expect(r!.names).toEqual(["Anna"]);
    expect(r!.preferredName).toBeNull();
  });

  it("parses multiple given names", () => {
    const r = PersonGivenName.tryParse("anna maria");
    expect(r).not.toBeNull();
    expect(r!.value).toBe("Anna Maria");
    expect(r!.names).toEqual(["Anna", "Maria"]);
  });

  it("preserves mixed case", () => {
    const r = PersonGivenName.tryParse("McDonald");
    expect(r!.value).toBe("McDonald");
  });

  it("uppercases all-lower input", () => {
    expect(PersonGivenName.tryParse("ALEXANDER")!.value).toBe("Alexander");
  });

  it("rejects invalid inputs", () => {
    expect(PersonGivenName.tryParse(null)).toBeNull();
    expect(PersonGivenName.tryParse("")).toBeNull();
    expect(PersonGivenName.tryParse("   ")).toBeNull();
    expect(PersonGivenName.tryParse("123")).toBeNull();
  });

  it("supports preferredName option", () => {
    const r = PersonGivenName.tryParse("Anna Maria", { preferredName: "maria" });
    expect(r).not.toBeNull();
    expect(r!.preferredName).toBe("Maria");
  });

  it("rejects preferredName not in given names", () => {
    expect(PersonGivenName.tryParse("Anna Maria", { preferredName: "Lena" })).toBeNull();
  });

  it("withPreferredName returns new instance", () => {
    const r = PersonGivenName.parse("Anna Maria");
    const r2 = r.withPreferredName("Anna");
    expect(r.preferredName).toBeNull();
    expect(r2.preferredName).toBe("Anna");
  });

  it("isNormalized round trips", () => {
    expect(PersonGivenName.isNormalized("Anna Maria")).toBe(true);
    expect(PersonGivenName.isNormalized("anna maria")).toBe(false);
  });

  it.each([
    ["B", "B"],
    ["B N", "B N"],
    ["b n", "B N"],
    ["B N P", "B N P"],
    ["Elsa B", "Elsa B"],
    ["B Elsa", "B Elsa"],
  ])("accepts single-letter name part %s", (input, expected) => {
    const r = PersonGivenName.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.value).toBe(expected);
    expect(PersonGivenName.isValid(input)).toBe(true);
    expect(PersonGivenName.normalize(input)).toBe(expected);
  });
});
