import { describe, expect, it } from "vitest";
import { GeoCoordinate } from "../../src/geography/index.js";

describe("GeoCoordinate", () => {
  it.each([
    ["59.3293, 18.0686", 59.3293, 18.0686],
    ["59.3293 18.0686", 59.3293, 18.0686],
    ["59.3293;18.0686", 59.3293, 18.0686],
    ["59.3293°N, 18.0686°E", 59.3293, 18.0686],
    ["S 33.8688, E 151.2093", -33.8688, 151.2093],
    ["59.3293°N 18.0686°Ö", 59.3293, 18.0686],
    ["59.3293°N 18.0686°V", 59.3293, -18.0686],
  ])("tryParse(%s) returns expected decimal degrees", (input, lat, lon) => {
    const coord = GeoCoordinate.tryParse(input);
    expect(coord?.latitude).toBeCloseTo(lat, 6);
    expect(coord?.longitude).toBeCloseTo(lon, 6);
  });

  it("parses DMS and DDM coordinate formats", () => {
    const dms = GeoCoordinate.parse(`59°19'45.5"N, 18°4'7"E`);
    expect(dms.latitude).toBeCloseTo(59.32930556, 6);
    expect(dms.longitude).toBeCloseTo(18.06861111, 6);

    const ddm = GeoCoordinate.parse(`59°19.758'N, 18°4.116'E`);
    expect(ddm.latitude).toBeCloseTo(59.3293, 4);
    expect(ddm.longitude).toBeCloseTo(18.0686, 4);
  });

  it.each([[null], [""], [" "], ["not a coordinate"], ["91, 18"], ["59, 181"]])(
    "rejects invalid input %s",
    (input) => {
      expect(GeoCoordinate.tryParse(input as string | null)).toBeNull();
      expect(GeoCoordinate.isValid(input as string | null)).toBe(false);
    },
  );

  it("rejects invalid DMS minute and second values", () => {
    expect(GeoCoordinate.tryParse(`59°60'0"N, 18°0'0"E`)).toBeNull();
    expect(GeoCoordinate.tryParse(`59°0'60"N, 18°0'0"E`)).toBeNull();
  });

  it("parse and create throw for invalid inputs", () => {
    expect(() => GeoCoordinate.parse("not a coordinate")).toThrow("Invalid geographic coordinate.");
    expect(() => GeoCoordinate.create(91, 18)).toThrow(RangeError);
    expect(() => GeoCoordinate.create(59, 181)).toThrow(RangeError);
  });

  it("format, normalize, and normalized checks match .NET semantics", () => {
    expect(GeoCoordinate.format("59.3293, 18.0686")).toBe("59.3293°N, 18.0686°E");
    expect(GeoCoordinate.normalize("59.3293°N, 18.0686°E")).toBe("59.3293, 18.0686");
    expect(GeoCoordinate.isNormalized("59.3293, 18.0686")).toBe(true);
    expect(GeoCoordinate.isNormalized("59.3293°N, 18.0686°E")).toBe(false);
    expect(GeoCoordinate.format(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "invalid",
    );
    expect(GeoCoordinate.normalize(" invalid ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "invalid",
    );
  });

  it("instance string helpers expose decimal, cardinal, and DMS forms", () => {
    const coord = GeoCoordinate.create(59.3293, 18.0686);
    expect(coord.toNormalizedString()).toBe("59.3293, 18.0686");
    expect(coord.toString()).toBe("59.3293°N, 18.0686°E");
    expect(coord.toDmsString()).toBe(`59°19'45.5"N, 18°4'7"E`);
    expect(coord.latitudeDirection).toBe("N");
    expect(coord.longitudeDirection).toBe("E");
    expect(GeoCoordinate.create(-33.8688, -151.2093).latitudeDirection).toBe("S");
    expect(GeoCoordinate.create(-33.8688, -151.2093).longitudeDirection).toBe("W");
  });

  it("distance and within-radius helpers use kilometers", () => {
    const stockholm = GeoCoordinate.create(59.3293, 18.0686);
    const gothenburg = GeoCoordinate.create(57.7089, 11.9746);
    const distance = GeoCoordinate.distanceKilometers(stockholm, gothenburg);

    expect(distance).toBeGreaterThan(390);
    expect(distance).toBeLessThan(410);
    expect(stockholm.distanceKilometersTo(gothenburg)).toBeCloseTo(distance, 8);
    expect(stockholm.distanceKilometersTo(stockholm)).toBe(0);
    expect(stockholm.isWithinKilometers(gothenburg, 410)).toBe(true);
    expect(stockholm.isWithinKilometers(gothenburg, 390)).toBe(false);
    expect(GeoCoordinate.isWithinKilometers(stockholm, gothenburg, 410)).toBe(true);
  });

  it("supports boundary values, semicolon separators, case-insensitive directions, and equality", () => {
    expect(GeoCoordinate.parse("90, 180").toNormalizedString()).toBe("90, 180");
    expect(GeoCoordinate.parse("-90; -180").toNormalizedString()).toBe("-90, -180");
    expect(GeoCoordinate.parse("59.3293°n, 18.0686°e").toNormalizedString()).toBe(
      "59.3293, 18.0686",
    );

    const a = GeoCoordinate.create(59.3293, 18.0686);
    const b = GeoCoordinate.parse("59.3293, 18.0686");
    const c = GeoCoordinate.create(57.7089, 11.9746);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(null)).toBe(false);
  });
});
