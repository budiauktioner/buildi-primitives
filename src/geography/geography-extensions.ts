import { SwedishCounty } from "./swedish-county.js";
import { SwedishMunicipality } from "./swedish-municipality.js";
import { COUNTY_ADJACENCY, MUNICIPALITY_ADJACENCY } from "./adjacency-data.js";
import { Continent } from "./continent.js";
import { Country } from "./country.js";

/** Returns all municipalities belonging to `county`, ordered by code. */
export function getMunicipalities(county: SwedishCounty): readonly SwedishMunicipality[] {
  return SwedishMunicipality.all
    .filter((m) => m.countyCode === county.code)
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** Returns all municipalities sharing a land border with `municipality`. */
export function getAdjacentMunicipalities(
  municipality: SwedishMunicipality,
): readonly SwedishMunicipality[] {
  const codes = MUNICIPALITY_ADJACENCY[municipality.code];
  if (!codes) return [];
  const out: SwedishMunicipality[] = [];
  for (const c of codes) {
    const m = SwedishMunicipality.tryParse(c);
    if (m) out.push(m);
  }
  return out;
}

/** Returns all counties sharing a land border with `county`. */
export function getAdjacentCounties(county: SwedishCounty): readonly SwedishCounty[] {
  const codes = COUNTY_ADJACENCY[county.code];
  if (!codes) return [];
  const out: SwedishCounty[] = [];
  for (const c of codes) {
    const cn = SwedishCounty.tryParse(c);
    if (cn) out.push(cn);
  }
  return out;
}

/** Returns all countries sharing a land border with `country`. */
export function getBorderingCountries(country: Country): readonly Country[] {
  const codes = COUNTRY_BORDERS[country.alpha2Code];
  if (!codes) return [];
  return codes.map((code) => Country.parse(code));
}

/** Returns all countries on `continent`, ordered by English name. */
export function getCountries(continent: Continent): readonly Country[] {
  return Country.all
    .filter((country) => country.continent.equals(continent))
    .slice()
    .sort((a, b) => a.englishName.localeCompare(b.englishName));
}

const COUNTRY_BORDERS: Record<string, readonly string[]> = {
  AT: ["CH", "CZ", "DE", "HU", "IT", "LI", "SI", "SK"],
  BE: ["DE", "FR", "LU", "NL"],
  CA: ["US"],
  CH: ["AT", "FR", "DE", "IT", "LI"],
  CZ: ["AT", "DE", "PL", "SK"],
  DE: ["AT", "BE", "CH", "CZ", "DK", "FR", "LU", "NL", "PL"],
  DK: ["DE"],
  ES: ["AD", "FR", "GI", "MA", "PT"],
  FI: ["NO", "RU", "SE"],
  FR: ["AD", "BE", "DE", "IT", "LU", "MC", "ES", "CH"],
  LU: ["BE", "DE", "FR"],
  NL: ["BE", "DE"],
  NO: ["FI", "RU", "SE"],
  PL: ["BY", "CZ", "DE", "LT", "RU", "SK", "UA"],
  RU: ["AZ", "BY", "CN", "EE", "FI", "GE", "KZ", "KP", "LV", "LT", "MN", "NO", "PL", "UA"],
  SE: ["FI", "NO"],
  US: ["CA", "CU", "MX"],
};
