import { describe, expect, it } from "vitest";
import { SwedishMunicipality } from "../../src/geography/index.js";

describe("SwedishMunicipality", () => {
  it("all returns 290 municipalities", () => {
    expect(SwedishMunicipality.all.length).toBe(290);
  });

  it.each([
    ["0180", "0180", "Stockholm"],
    ["1480", "1480", "Göteborg"],
    ["1280", "1280", "Malmö"],
    ["Stockholm", "0180", "Stockholm"],
    ["Göteborg", "1480", "Göteborg"],
    ["Gothenburg", "1480", "Göteborg"],
    ["Malmö", "1280", "Malmö"],
    ["uppsala", "0380", "Uppsala"],
  ])("tryParse(%s) -> %s/%s", (input, code, sv) => {
    const m = SwedishMunicipality.tryParse(input);
    expect(m?.code).toBe(code);
    expect(m?.localizedName).toBe(sv);
  });

  it.each([[null], [""], ["  "], ["XX"], ["123"], ["NotAMunicipality"]])(
    "tryParse rejects %s",
    (input) => {
      expect(SwedishMunicipality.tryParse(input as string | null)).toBeNull();
    },
  );

  it("normalize returns 4-digit code", () => {
    expect(SwedishMunicipality.normalize("Stockholm")).toBe("0180");
    expect(SwedishMunicipality.normalize("nope")).toBeNull();
  });

  it("each municipality is linked to a valid county", () => {
    for (const m of SwedishMunicipality.all) {
      expect(m.county.code).toBe(m.code.slice(0, 2));
    }
  });

  it("findNeighbors returns nearby municipalities sorted by distance", () => {
    const stockholm = SwedishMunicipality.parse("Stockholm");
    const neighbors = stockholm.findNeighbors(50);
    expect(neighbors.length).toBeGreaterThan(0);
    expect(neighbors[0]!.distanceKilometers).toBeLessThanOrEqual(
      neighbors[neighbors.length - 1]!.distanceKilometers,
    );
    expect(neighbors.every((n) => n.municipality !== stockholm)).toBe(true);
  });

  it("findCandidatesInText", () => {
    const text = "Resor mellan Stockholm och Göteborg via Malmö.";
    const found = SwedishMunicipality.findCandidatesInText(text);
    const codes = found.map((c) => c.value.code).sort();
    expect(codes).toContain("0180");
    expect(codes).toContain("1480");
    expect(codes).toContain("1280");
  });

  it("toEnglishString uses Gothenburg override for Göteborg", () => {
    expect(SwedishMunicipality.parse("1480").toEnglishString()).toBe("Gothenburg");
    expect(SwedishMunicipality.parse("1480").toLocalString()).toBe("Göteborg");
  });
});
