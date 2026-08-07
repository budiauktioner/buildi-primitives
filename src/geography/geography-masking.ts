import { GeoCoordinate } from "./geo-coordinate.js";
import { Language } from "./language.js";
import { SwedishCounty } from "./swedish-county.js";
import { SwedishMunicipality } from "./swedish-municipality.js";

const MASK_CHAR = "*";

/** Mask a coordinate to ~11 km precision (1 decimal place visible). */
export function maskGeoCoordinate(coordinate: GeoCoordinate): string {
  return `${maskDecimals(coordinate.latitude.toFixed(4))}, ${maskDecimals(coordinate.longitude.toFixed(4))}`;
}

/** Mask a Swedish municipality, showing only the first character. */
export function maskSwedishMunicipality(m: SwedishMunicipality): string {
  return maskKeepFirst(m.displayName);
}

/** Mask a Swedish county, showing only the first character of the first word. */
export function maskSwedishCounty(c: SwedishCounty): string {
  const parts = c.displayName.split(" ");
  return parts
    .map((p, i) =>
      i === 0 && p.length > 1 ? p[0] + MASK_CHAR.repeat(p.length - 1) : MASK_CHAR.repeat(p.length),
    )
    .join(" ");
}

/** Mask a language name, showing only the first character. */
export function maskLanguage(l: Language): string {
  return maskKeepFirst(l.displayName);
}

function maskKeepFirst(name: string): string {
  if (name.length <= 1) return MASK_CHAR.repeat(name.length);
  return name[0] + MASK_CHAR.repeat(name.length - 1);
}

function maskDecimals(num: string): string {
  const dot = num.indexOf(".");
  if (dot < 0) return num;
  const head = num.slice(0, dot + 2);
  const tail = num.slice(dot + 2);
  return head + MASK_CHAR.repeat(tail.length);
}
