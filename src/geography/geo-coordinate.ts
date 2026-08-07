import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

export interface GeoCoordinateFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * A geographic coordinate pair (latitude, longitude) in the WGS 84 reference
 * system (`geografisk koordinat`). Parsing accepts decimal degrees, degrees
 * with cardinal directions, DMS, and DDM formats. Swedish cardinal letters Ö
 * (east) and V (west) are accepted alongside E and W.
 */
export class GeoCoordinate {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Geographic Coordinate",
    localizedName: "Geografisk koordinat",
    emoji: "\u{1F4CD}",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Geographic_coordinate_system",
      "https://epsg.io/4326",
    ]),
  });

  readonly latitude: number;
  readonly longitude: number;

  private constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  /** @internal */
  static _unsafe(latitude: number, longitude: number): GeoCoordinate {
    return new GeoCoordinate(latitude, longitude);
  }

  get latitudeDirection(): "N" | "S" {
    return this.latitude >= 0 ? "N" : "S";
  }

  get longitudeDirection(): "E" | "W" {
    return this.longitude >= 0 ? "E" : "W";
  }

  /** Creates a coordinate from explicit latitude and longitude values. */
  static create(latitude: number, longitude: number): GeoCoordinate {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new RangeError("Latitude must be between -90 and 90.");
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new RangeError("Longitude must be between -180 and 180.");
    }
    return GeoCoordinate._unsafe(latitude, longitude);
  }

  static tryParse(input: string | null | undefined): GeoCoordinate | null {
    if (input == null || input.trim() === "") return null;
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length === 0 || sanitized.length > 200) return null;

    let m: RegExpMatchArray | null;

    m = sanitized.match(DECIMAL_DEGREES);
    if (m) return tryDecimal(m.groups!.lat!, m.groups!.lon!);

    m = sanitized.match(SPACE_SEPARATED);
    if (m) return tryDecimal(m.groups!.lat!, m.groups!.lon!);

    m = sanitized.match(DECIMAL_CARDINAL_SUFFIX);
    if (m) {
      return tryDecimalCardinal(
        m.groups!.lat!,
        m.groups!.latDir!,
        m.groups!.lon!,
        m.groups!.lonDir!,
      );
    }

    m = sanitized.match(CARDINAL_PREFIX);
    if (m) {
      return tryDecimalCardinal(
        m.groups!.lat!,
        m.groups!.latDir!,
        m.groups!.lon!,
        m.groups!.lonDir!,
      );
    }

    m = sanitized.match(DMS);
    if (m) return tryDms(m.groups!);

    m = sanitized.match(DDM);
    if (m) return tryDdm(m.groups!);

    return null;
  }

  static parse(input: string): GeoCoordinate {
    const r = GeoCoordinate.tryParse(input);
    if (r === null) throw new Error("Invalid geographic coordinate.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return GeoCoordinate.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: GeoCoordinateFormatOptions,
  ): string | null {
    const r = GeoCoordinate.tryParse(input);
    if (r) return r.toString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: GeoCoordinateFormatOptions,
  ): string | null {
    const r = GeoCoordinate.tryParse(input);
    if (r) return r.toNormalizedString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const trimmed = input.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && GeoCoordinate.normalize(input) === input;
  }

  toNormalizedString(): string {
    return `${formatNumber(this.latitude)}, ${formatNumber(this.longitude)}`;
  }

  toString(): string {
    return `${formatNumber(Math.abs(this.latitude))}°${this.latitudeDirection}, ${formatNumber(Math.abs(this.longitude))}°${this.longitudeDirection}`;
  }

  /** Returns the coordinate in degrees, minutes, and seconds, e.g. `59°19'45.5"N, 18°4'7"E`. */
  toDmsString(): string {
    const [latDeg, latMin, latSec] = toDmsParts(Math.abs(this.latitude));
    const [lonDeg, lonMin, lonSec] = toDmsParts(Math.abs(this.longitude));
    return `${latDeg}°${latMin}'${formatSeconds(latSec)}"${this.latitudeDirection}, ${lonDeg}°${lonMin}'${formatSeconds(lonSec)}"${this.longitudeDirection}`;
  }

  /** Distance in kilometers (Haversine) between two coordinates. */
  static distanceKilometers(a: GeoCoordinate, b: GeoCoordinate): number {
    return haversineKm(a, b);
  }

  /** Returns true if coordinates `a` and `b` are within `radiusKm` kilometers of each other. */
  static isWithinKilometers(a: GeoCoordinate, b: GeoCoordinate, radiusKm: number): boolean {
    return GeoCoordinate.distanceKilometers(a, b) <= radiusKm;
  }

  /** Distance in kilometers from this coordinate to `other`. */
  distanceKilometersTo(other: GeoCoordinate): number {
    return haversineKm(this, other);
  }

  /**
   * Returns true if `other` is within `radiusKm` kilometers of this
   * coordinate (inclusive).
   */
  isWithinKilometers(other: GeoCoordinate, radiusKm: number): boolean {
    return this.distanceKilometersTo(other) <= radiusKm;
  }

  equals(other: GeoCoordinate | null | undefined): boolean {
    return other != null && this.latitude === other.latitude && this.longitude === other.longitude;
  }
}

// --- Regexes ---

const DECIMAL_DEGREES =
  /^\s*\(?\s*(?<lat>[+-]?\d+(?:\.\d+)?)\s*[,;]\s*(?<lon>[+-]?\d+(?:\.\d+)?)\s*\)?\s*$/;

const SPACE_SEPARATED =
  /^\s*\(?\s*(?<lat>[+-]?\d+(?:\.\d+)?)\s+(?<lon>[+-]?\d+(?:\.\d+)?)\s*\)?\s*$/;

const DECIMAL_CARDINAL_SUFFIX =
  /^\s*\(?\s*(?<lat>\d+(?:\.\d+)?)\s*°?\s*(?<latDir>[NSns])\s*[,;\s]\s*(?<lon>\d+(?:\.\d+)?)\s*°?\s*(?<lonDir>[EWewÖöVv])\s*\)?\s*$/u;

const CARDINAL_PREFIX =
  /^\s*\(?\s*(?<latDir>[NSns])\s*(?<lat>\d+(?:\.\d+)?)\s*°?\s*[,;\s]\s*(?<lonDir>[EWewÖöVv])\s*(?<lon>\d+(?:\.\d+)?)\s*°?\s*\)?\s*$/u;

const DMS =
  /^\s*\(?\s*(?<latDeg>\d+)\s*°\s*(?<latMin>\d+)\s*[′']\s*(?<latSec>\d+(?:\.\d+)?)\s*[″"]\s*(?<latDir>[NSns])\s*[,;\s]\s*(?<lonDeg>\d+)\s*°\s*(?<lonMin>\d+)\s*[′']\s*(?<lonSec>\d+(?:\.\d+)?)\s*[″"]\s*(?<lonDir>[EWewÖöVv])\s*\)?\s*$/u;

const DDM =
  /^\s*\(?\s*(?<latDeg>\d+)\s*°\s*(?<latDecMin>\d+(?:\.\d+)?)\s*[′']\s*(?<latDir>[NSns])\s*[,;\s]\s*(?<lonDeg>\d+)\s*°\s*(?<lonDecMin>\d+(?:\.\d+)?)\s*[′']\s*(?<lonDir>[EWewÖöVv])\s*\)?\s*$/u;

// --- Helpers ---

function tryDecimal(latStr: string, lonStr: string): GeoCoordinate | null {
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!isInRange(lat, lon)) return null;
  return GeoCoordinate._unsafe(lat, lon);
}

function tryDecimalCardinal(
  latStr: string,
  latDir: string,
  lonStr: string,
  lonDir: string,
): GeoCoordinate | null {
  const lat = applyLatDirection(parseFloat(latStr), latDir);
  const lon = applyLonDirection(parseFloat(lonStr), lonDir);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!isInRange(lat, lon)) return null;
  return GeoCoordinate._unsafe(lat, lon);
}

function tryDms(g: { [key: string]: string }): GeoCoordinate | null {
  const latDeg = parseFloat(g.latDeg!);
  const latMin = parseFloat(g.latMin!);
  const latSec = parseFloat(g.latSec!);
  const lonDeg = parseFloat(g.lonDeg!);
  const lonMin = parseFloat(g.lonMin!);
  const lonSec = parseFloat(g.lonSec!);
  if (latMin >= 60 || latSec >= 60 || lonMin >= 60 || lonSec >= 60) return null;
  let lat = round8(latDeg + latMin / 60 + latSec / 3600);
  let lon = round8(lonDeg + lonMin / 60 + lonSec / 3600);
  lat = applyLatDirection(lat, g.latDir!);
  lon = applyLonDirection(lon, g.lonDir!);
  if (!isInRange(lat, lon)) return null;
  return GeoCoordinate._unsafe(lat, lon);
}

function tryDdm(g: { [key: string]: string }): GeoCoordinate | null {
  const latDeg = parseFloat(g.latDeg!);
  const latDecMin = parseFloat(g.latDecMin!);
  const lonDeg = parseFloat(g.lonDeg!);
  const lonDecMin = parseFloat(g.lonDecMin!);
  if (latDecMin >= 60 || lonDecMin >= 60) return null;
  let lat = round8(latDeg + latDecMin / 60);
  let lon = round8(lonDeg + lonDecMin / 60);
  lat = applyLatDirection(lat, g.latDir!);
  lon = applyLonDirection(lon, g.lonDir!);
  if (!isInRange(lat, lon)) return null;
  return GeoCoordinate._unsafe(lat, lon);
}

function applyLatDirection(lat: number, dir: string): number {
  return dir.toUpperCase() === "S" ? -lat : lat;
}

function applyLonDirection(lon: number, dir: string): number {
  const u = dir.toUpperCase();
  return u === "W" || u === "V" ? -lon : lon;
}

function isInRange(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function round8(v: number): number {
  return Math.round(v * 1e8) / 1e8;
}

function toDmsParts(dd: number): [number, number, number] {
  const degrees = Math.trunc(dd);
  const fracMinutes = (dd - degrees) * 60;
  const minutes = Math.trunc(fracMinutes);
  const seconds = Math.round((fracMinutes - minutes) * 600) / 10;
  return [degrees, minutes, seconds];
}

function formatNumber(value: number): string {
  // Match C# "G" format on a double: minimal representation, no trailing zeros.
  // For our use cases this matches `value.toString()` in JS.
  return value.toString();
}

function formatSeconds(seconds: number): string {
  // Match C# "0.#" format: drop trailing zero after the decimal point.
  if (Number.isInteger(seconds)) return seconds.toString();
  return seconds.toString().replace(/(\.\d*?)0+$/, "$1");
}

function haversineKm(a: GeoCoordinate, b: GeoCoordinate): number {
  const R = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
