import { describe, expect, it } from "vitest";
import { SwedishCounty } from "../../src/geography/index.js";

describe("SwedishCounty", () => {
  it.each([
    ["01", "01"],
    ["1", null], // single-digit not accepted
    ["12", "12"],
    ["Stockholms län", "01"],
    ["stockholm", "01"],
    ["Stockholm County", "01"],
    ["Skåne", "12"],
    ["skåne län", "12"],
    ["Västra Götalands län", "14"],
    ["Västra Götaland", "14"],
  ])("tryParse(%s) -> %s", (input, code) => {
    const c = SwedishCounty.tryParse(input);
    expect(c?.code ?? null).toBe(code);
  });

  it("parse throws for invalid", () => {
    expect(() => SwedishCounty.parse("nope")).toThrow();
  });

  it("normalize returns 2-digit code", () => {
    expect(SwedishCounty.normalize("Skåne")).toBe("12");
    expect(SwedishCounty.normalize("nope")).toBeNull();
  });

  it("all returns 21 counties", () => {
    expect(SwedishCounty.all.length).toBe(21);
  });

  it("findCandidatesInText finds counties", () => {
    const text = "På väg från Stockholm till Skåne via Halland.";
    const results = SwedishCounty.findCandidatesInText(text);
    const codes = results.map((r) => r.value.code).sort();
    expect(codes).toContain("01");
    expect(codes).toContain("12");
    expect(codes).toContain("13");
  });

  it("equals/compareTo", () => {
    const a = SwedishCounty.parse("01");
    const b = SwedishCounty.parse("Stockholms län");
    expect(a.equals(b)).toBe(true);
    expect(a.compareTo(SwedishCounty.parse("12"))).toBeLessThan(0);
  });
});
