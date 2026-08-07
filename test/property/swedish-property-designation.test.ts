import { describe, expect, it } from "vitest";
import {
  SwedishPropertyDesignation,
  maskSwedishPropertyDesignation,
} from "../../src/property/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/index.js";

describe("SwedishPropertyDesignation.tryParse", () => {
  it.each([
    ["Stockholm Soder 75:2", "Stockholm Soder", "75:2", 75, 2],
    ["Gavle Olsbacka 11:1", "Gavle Olsbacka", "11:1", 11, 1],
    ["  stockholm  soder   75 : 2  ", "Stockholm Soder", "75:2", 75, 2],
    ["Vasteras Staden 1:75", "Vasteras Staden", "1:75", 1, 75],
  ])(
    "extracts components from %s",
    (
      input: string,
      expectedName: string,
      expectedRegister: string,
      expectedBlock: number,
      expectedUnit: number,
    ) => {
      const r = SwedishPropertyDesignation.tryParse(input);
      expect(r).not.toBeNull();
      expect(r!.designationName).toBe(expectedName);
      expect(r!.registerNumber).toBe(expectedRegister);
      expect(r!.blockNumber).toBe(expectedBlock);
      expect(r!.unitNumber).toBe(expectedUnit);
      expect(r!.value).toBe(`${expectedName} ${expectedRegister}`);
    },
  );

  it("handles Swedish characters", () => {
    const r = SwedishPropertyDesignation.tryParse("Uppsala Fjärdingen 22:1");
    expect(r).not.toBeNull();
    expect(r!.designationName).toBe("Uppsala Fjärdingen");
    expect(r!.value).toBe("Uppsala Fjärdingen 22:1");
  });

  it.each([
    null,
    "",
    " ",
    "75:2",
    "Stockholm Soder",
    "Stockholm Soder 75",
    "Stockholm Soder 75-2",
    "Stockholm Soder 0:2",
    "Stockholm Soder 75:0",
    "Stockholm / Soder 75:2",
  ])("isValid false for %s", (input) => {
    expect(SwedishPropertyDesignation.isValid(input)).toBe(false);
  });
});

describe("SwedishPropertyDesignation.parse", () => {
  it("throws for invalid", () => {
    expect(() => SwedishPropertyDesignation.parse("Stockholm Soder")).toThrow();
  });

  it("succeeds for valid", () => {
    expect(SwedishPropertyDesignation.parse("Gavle Olsbacka 11:1").value).toBe(
      "Gavle Olsbacka 11:1",
    );
  });
});

describe("SwedishPropertyDesignation format / normalize", () => {
  it("format normalizes whitespace and capitalization", () => {
    expect(SwedishPropertyDesignation.format(" stockholm soder 75 : 2 ")).toBe(
      "Stockholm Soder 75:2",
    );
  });

  it("normalize same as format", () => {
    expect(SwedishPropertyDesignation.normalize(" stockholm soder 75 : 2 ")).toBe(
      "Stockholm Soder 75:2",
    );
  });

  it("format returns null for whitespace only", () => {
    expect(SwedishPropertyDesignation.format(" ")).toBeNull();
  });

  it("format with fallback returns trimmed input for invalid", () => {
    expect(
      SwedishPropertyDesignation.format("  not a designation  ", {
        fallbackToTrimmedInputWhenInvalid: true,
      }),
    ).toBe("not a designation");
  });
});

describe("SwedishPropertyDesignation toString / equality / ordering", () => {
  it("toString returns the value", () => {
    const d = SwedishPropertyDesignation.parse("Gavle Olsbacka 11:1");
    expect(d.toString()).toBe("Gavle Olsbacka 11:1");
    expect(d.toNormalizedString()).toBe("Gavle Olsbacka 11:1");
  });

  it("same value is equal", () => {
    const a = SwedishPropertyDesignation.parse("Stockholm Soder 75:2");
    const b = SwedishPropertyDesignation.parse("Stockholm Soder 75:2");
    expect(a.equals(b)).toBe(true);
  });

  it("different values not equal", () => {
    const a = SwedishPropertyDesignation.parse("Stockholm Soder 75:2");
    const b = SwedishPropertyDesignation.parse("Gavle Olsbacka 11:1");
    expect(a.equals(b)).toBe(false);
  });

  it("equals null returns false", () => {
    expect(SwedishPropertyDesignation.parse("Stockholm Soder 75:2").equals(null)).toBe(false);
  });

  it("compareTo orders correctly", () => {
    const a = SwedishPropertyDesignation.parse("Gavle Olsbacka 11:1");
    const b = SwedishPropertyDesignation.parse("Stockholm Soder 75:2");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(a)).toBe(0);
  });

  it("compareTo null returns positive", () => {
    expect(SwedishPropertyDesignation.parse("Stockholm Soder 75:2").compareTo(null)).toBe(1);
  });
});

describe("maskSwedishPropertyDesignation", () => {
  it("masks the register number", () => {
    expect(
      maskSwedishPropertyDesignation(SwedishPropertyDesignation.parse("Stockholm Söder 75:2")),
    ).toBe("Stockholm Söder **:*");
  });
});

describe("SwedishPropertyDesignation.findCandidatesInText", () => {
  it("finds designations in text", () => {
    const text = "Vi har sålt Uppsala Fjärdingen 22:1 till en kund.";
    const r = SwedishPropertyDesignation.findCandidatesInText(text);
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0]!.confidence).toBe(TextMatchConfidence.Medium);
    expect(r[0]!.value.value).toContain("22:1");
  });

  it("returns empty for text without designations", () => {
    expect(
      SwedishPropertyDesignation.findCandidatesInText("Inget fastighetsnummer här."),
    ).toHaveLength(0);
  });

  it("returns empty for empty input", () => {
    expect(SwedishPropertyDesignation.findCandidatesInText("")).toHaveLength(0);
  });
});
