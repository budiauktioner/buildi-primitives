import { SwedishCounty } from "./swedish-county.js";
import { SwedishMunicipality } from "./swedish-municipality.js";

/** Swedish Wikipedia URL for a Swedish municipality. */
export function getMunicipalityWikipediaUrl(m: SwedishMunicipality): string {
  return `https://sv.wikipedia.org/wiki/${encodeURIComponent(`${m.localizedName} kommun`)}`;
}

/** Swedish Wikipedia URL for a Swedish county. */
export function getCountyWikipediaUrl(c: SwedishCounty): string {
  return `https://sv.wikipedia.org/wiki/${encodeURIComponent(c.localizedName)}`;
}
