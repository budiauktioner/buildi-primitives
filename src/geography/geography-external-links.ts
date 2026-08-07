import { SwedishCounty } from "./swedish-county.js";
import { SwedishMunicipality } from "./swedish-municipality.js";

const SCB_URL =
  "https://www.scb.se/hitta-statistik/regional-statistik-och-kartor/regionala-indelningar/lan-och-kommuner/";

export function getCountyScbUrl(_county: SwedishCounty): string {
  return SCB_URL;
}
export function getCountyWikipediaUrl(county: SwedishCounty): string {
  return `https://sv.wikipedia.org/wiki/${encodeURIComponent(county.localizedName.replace(/ /g, "_"))}`;
}
export function getCountyGoogleMapsUrl(county: SwedishCounty): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(county.localizedName)}`;
}
export function getMunicipalityScbUrl(_m: SwedishMunicipality): string {
  return SCB_URL;
}
export function getMunicipalityWikipediaUrl(m: SwedishMunicipality): string {
  return `https://sv.wikipedia.org/wiki/${encodeURIComponent(
    `${m.localizedName}s kommun`.replace(/ /g, "_"),
  )}`;
}
export function getMunicipalityGoogleMapsUrl(m: SwedishMunicipality): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${m.localizedName} kommun`,
  )}`;
}
