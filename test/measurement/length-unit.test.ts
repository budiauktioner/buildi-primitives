import { describe, expect, it } from "vitest";
import { LengthUnit } from "../../src/measurement/index.js";
import vectors from "./length-dotnet-vectors.json" with { type: "json" };

describe("LengthUnit.tryParse against .NET vectors", () => {
  it.each(vectors.unitLookup as unknown as (string | null)[][])(
    "resolves %j to %s",
    (input, expected) => {
      expect(LengthUnit.tryParse(input)?.symbol ?? null).toBe(expected);
    },
  );
});

describe("LengthUnit", () => {
  it("exposes every unit through all", () => {
    expect(LengthUnit.all).toHaveLength(13);
    expect(LengthUnit.all.map((u) => u.symbol)).toEqual([
      "nm",
      "µm",
      "mm",
      "cm",
      "dm",
      "m",
      "km",
      "in",
      "ft",
      "yd",
      "mi",
      "nmi",
      "mil",
    ]);
  });

  it("uses meter as the base unit", () => {
    expect(LengthUnit.baseUnit).toBe(LengthUnit.Meter);
    expect(LengthUnit.baseUnit.toBaseUnitFactor.toString()).toBe("1");
  });

  it("restricts the natural scale to metric units", () => {
    expect(LengthUnit.naturalScale.map((u) => u.symbol)).toEqual(["mm", "cm", "m", "km"]);
  });

  it.each([null, undefined, "", "   ", "parsec"])("rejects %j", (input) => {
    expect(LengthUnit.tryParse(input)).toBeNull();
  });

  it("throws from parse for an unknown unit", () => {
    expect(() => LengthUnit.parse("parsec")).toThrow("Unknown length unit.");
  });

  it("keeps nm as nanometer while uppercase NM is nautical mile", () => {
    expect(LengthUnit.tryParse("nm")).toBe(LengthUnit.Nanometer);
    expect(LengthUnit.tryParse("NM")).toBe(LengthUnit.NauticalMile);
  });

  it("renders as its symbol", () => {
    expect(String(LengthUnit.Kilometer)).toBe("km");
  });

  it("carries the .NET type metadata", () => {
    expect(LengthUnit.typeInfo.englishName).toBe("Length Unit");
    expect(LengthUnit.typeInfo.localizedName).toBe("Längdenhet");
  });
});
