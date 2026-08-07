import { describe, expect, it } from "vitest";
import { PersonAge } from "../../src/person/index.js";

describe("PersonAge", () => {
  it("parses bare years", () => {
    const a = PersonAge.tryParse("25");
    expect(a!.years).toBe(25);
    expect(a!.totalMonths).toBe(25 * 12);
    expect(a!.totalDays).toBe(25 * 365);
  });

  it("parses years with Swedish unit", () => {
    expect(PersonAge.tryParse("25 år")!.years).toBe(25);
    expect(PersonAge.tryParse("25 years")!.years).toBe(25);
  });

  it("parses months", () => {
    const a = PersonAge.tryParse("8 månader");
    expect(a!.years).toBe(0);
    expect(a!.totalMonths).toBe(8);
  });

  it("parses days", () => {
    const a = PersonAge.tryParse("300 dagar");
    expect(a!.totalDays).toBe(300);
    expect(a!.years).toBe(0);
  });

  it("parses fractional years", () => {
    const a = PersonAge.tryParse("0.5 år");
    expect(a).not.toBeNull();
    expect(a!.years).toBe(0);
    expect(a!.totalDays).toBe(Math.trunc(0.5 * 365));
  });

  it("rejects invalid", () => {
    expect(PersonAge.tryParse("abc")).toBeNull();
    expect(PersonAge.tryParse("")).toBeNull();
    expect(PersonAge.tryParse(null)).toBeNull();
    expect(PersonAge.tryParse("-5")).toBeNull();
    expect(PersonAge.tryParse("201")).toBeNull();
    expect(PersonAge.tryParse("12 weeks")).toBeNull();
  });

  it("parse throws for invalid inputs", () => {
    expect(() => PersonAge.parse("abc")).toThrow("Invalid person age.");
    expect(() => PersonAge.parse("-5")).toThrow("Invalid person age.");
  });

  it("factory methods expose expected properties", () => {
    expect(PersonAge.fromYears(25)).toMatchObject({
      years: 25,
      totalMonths: 300,
      totalDays: 9125,
    });
    expect(PersonAge.fromYears(0)).toMatchObject({ years: 0, totalMonths: 0, totalDays: 0 });
    expect(PersonAge.fromMonths(12)).toMatchObject({ years: 1, totalMonths: 12 });
    expect(PersonAge.fromDays(365)).toMatchObject({ years: 1, totalDays: 365 });
    expect(PersonAge.fromDays(364)).toMatchObject({ years: 0, totalDays: 364 });
  });

  it("factory methods reject out-of-range values", () => {
    expect(() => PersonAge.fromYears(-1)).toThrow(RangeError);
    expect(() => PersonAge.fromYears(201)).toThrow(RangeError);
    expect(() => PersonAge.fromMonths(-1)).toThrow(RangeError);
    expect(() => PersonAge.fromMonths(2401)).toThrow(RangeError);
    expect(() => PersonAge.fromDays(-1)).toThrow(RangeError);
    expect(() => PersonAge.fromDays(73001)).toThrow(RangeError);
  });

  it("toString uses Swedish", () => {
    expect(PersonAge.fromYears(25).toString()).toBe("25 år");
    expect(PersonAge.fromMonths(8).toString()).toBe("8 månader");
  });

  it("legal age flags", () => {
    expect(PersonAge.fromYears(18).isOfSwedishLegalAge).toBe(true);
    expect(PersonAge.fromYears(17).isOfSwedishLegalAge).toBe(false);
    expect(PersonAge.fromYears(15).isSwedishCriminallyResponsible).toBe(true);
    expect(PersonAge.fromYears(65).isOfSwedishRetirementAge).toBe(true);
  });

  it("fromBirthDate works with reference date", () => {
    const birth = new Date(Date.UTC(2000, 0, 15));
    const ref = new Date(Date.UTC(2025, 0, 15));
    const a = PersonAge.fromBirthDate(birth, { referenceDate: ref });
    expect(a.years).toBe(25);
  });

  it("fromBirthDate handles before-birthday", () => {
    const birth = new Date(Date.UTC(2000, 5, 15));
    const ref = new Date(Date.UTC(2025, 5, 14));
    const a = PersonAge.fromBirthDate(birth, { referenceDate: ref });
    expect(a.years).toBe(24);
  });

  it("fromBirthDate handles same day, infants, future dates and leap birthdays", () => {
    const sameDay = PersonAge.fromBirthDate(new Date(Date.UTC(2025, 0, 15)), {
      referenceDate: new Date(Date.UTC(2025, 0, 15)),
    });
    expect(sameDay.years).toBe(0);
    expect(sameDay.totalDays).toBe(0);

    const infant = PersonAge.fromBirthDate(new Date(Date.UTC(2024, 11, 15)), {
      referenceDate: new Date(Date.UTC(2025, 0, 15)),
    });
    expect(infant.years).toBe(0);
    expect(infant.totalDays).toBe(31);

    const leap = PersonAge.fromBirthDate(new Date(Date.UTC(2000, 1, 29)), {
      referenceDate: new Date(Date.UTC(2025, 1, 28)),
    });
    expect(leap.years).toBe(24);

    expect(() =>
      PersonAge.fromBirthDate(new Date(Date.UTC(2026, 0, 1)), {
        referenceDate: new Date(Date.UTC(2025, 0, 1)),
      }),
    ).toThrow(RangeError);
  });

  it.each([
    ["25", "25 år"],
    ["25 år", "25 år"],
    ["8 månader", "8 månader"],
    ["300 dagar", "10 månader"],
    [null, null],
    ["abc", null],
  ])("format(%s) returns %s", (input, expected) => {
    expect(PersonAge.format(input as string | null)).toBe(expected);
  });

  it("format and normalize can fall back to trimmed invalid input", () => {
    expect(PersonAge.format(" abc ", { fallbackToTrimmedInputWhenInvalid: true })).toBe("abc");
    expect(PersonAge.normalize(" abc ", { fallbackToTrimmedInputWhenInvalid: true })).toBe("abc");
  });

  it.each([
    ["25", "25"],
    ["25 år", "25"],
    ["8 månader", "0"],
    ["300 dagar", "0"],
    [null, null],
    ["abc", null],
  ])("normalize(%s) returns %s", (input, expected) => {
    expect(PersonAge.normalize(input as string | null)).toBe(expected);
  });

  it.each([
    ["25", true],
    ["25 år", false],
    ["8 månader", false],
    [null, false],
  ])("isNormalized(%s) returns %s", (input, expected) => {
    expect(PersonAge.isNormalized(input as string | null)).toBe(expected);
  });

  it("normalized and formatted instance strings match .NET semantics", () => {
    expect(PersonAge.fromYears(25).toNormalizedString()).toBe("25");
    expect(PersonAge.fromYears(25).toString()).toBe("25 år");
    expect(PersonAge.fromMonths(8).toNormalizedString()).toBe("0");
    expect(PersonAge.fromMonths(8).toString()).toBe("8 månader");
  });

  it("equality and compareTo use total days", () => {
    expect(PersonAge.fromYears(1).equals(PersonAge.fromDays(365))).toBe(true);
    expect(PersonAge.fromYears(1).equals(PersonAge.fromDays(364))).toBe(false);
    expect(PersonAge.fromDays(1).compareTo(PersonAge.fromDays(2))).toBeLessThan(0);
    expect(PersonAge.fromDays(2).compareTo(PersonAge.fromDays(1))).toBeGreaterThan(0);
    expect(PersonAge.fromDays(1).compareTo(null)).toBe(1);
  });
});
