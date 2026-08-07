import { describe, expect, it } from "vitest";
import { PersonFullName, PersonGivenName, PersonFamilyName } from "../../src/person/index.js";

describe("PersonFullName", () => {
  it("parses simple full name", () => {
    const r = PersonFullName.tryParse("anna maria andersson");
    expect(r).not.toBeNull();
    expect(r!.value).toBe("Anna Maria Andersson");
    expect(r!.givenName.value).toBe("Anna Maria");
    expect(r!.familyName.value).toBe("Andersson");
  });

  it("requires at least 2 tokens", () => {
    expect(PersonFullName.tryParse("Anna")).toBeNull();
  });

  it("rejects invalid", () => {
    expect(PersonFullName.tryParse(null)).toBeNull();
    expect(PersonFullName.tryParse("")).toBeNull();
  });

  it("create from parts", () => {
    const g = PersonGivenName.parse("Anna");
    const f = PersonFamilyName.parse("Andersson");
    const fn = PersonFullName.create(g, f);
    expect(fn.value).toBe("Anna Andersson");
  });

  it("supports preferredName", () => {
    const r = PersonFullName.tryParse("Anna Maria Andersson", { preferredName: "Maria" });
    expect(r!.preferredName).toBe("Maria");
  });

  it("withPreferredName", () => {
    const r = PersonFullName.parse("Anna Maria Andersson");
    expect(r.withPreferredName("Maria").preferredName).toBe("Maria");
  });
});
