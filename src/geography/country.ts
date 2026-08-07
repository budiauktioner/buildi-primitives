import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { Currency } from "../finance/currency.js";
import { Continent } from "./continent.js";
import { CountryCapital } from "./country-capital.js";
import { GeoCoordinate } from "./geo-coordinate.js";
import { Language } from "./language.js";
import { COUNTRY_ROWS, type CountryRow } from "./country-data.js";
import { COUNTRY_COORDINATES } from "./country-coordinates.js";
import { getCountryCapital } from "./country-capitals.js";
import {
  COUNTRY_ALIASES,
  COUNTRY_CURRENCIES,
  COUNTRY_LANGUAGES,
  EEA_COUNTRIES,
  EU_COUNTRIES,
  NORDIC_COUNTRIES,
  PRIMARY_BY_CALLING_CODE,
  SCHENGEN_COUNTRIES,
  SEPA_COUNTRIES,
} from "./country-metadata.js";

const MAX_INPUT_LENGTH = 100;

/** A neighboring country with its distance from a reference point (kilometers). */
export interface CountryDistance {
  readonly country: Country;
  readonly distanceKilometers: number;
}

/**
 * A country identified by its English name, Swedish name, local name (endonym),
 * or ISO 3166-1 codes. Each country exposes its phone calling code, ccTLD,
 * continent, European classifications (EU, EEA, Schengen, Nordics, SEPA), and
 * currency metadata. Parsing accepts English/Swedish/local names, alpha-2 and
 * alpha-3 codes, and common aliases (USA, UK, Holland, etc.).
 */
export class Country {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Country",
    localizedName: "Land",
    emoji: "\u{1F30D}",
    sources: Object.freeze([
      "https://www.iso.org/iso-3166-country-codes.html",
      "https://en.wikipedia.org/wiki/ISO_3166-1",
      "https://www.itu.int/rec/T-REC-E.164/",
      "https://www.iana.org/domains/root/db",
      "https://www.wikidata.org/wiki/Property:P625",
      "https://www.wikidata.org/wiki/Property:P36",
      "https://www.wikidata.org/wiki/Property:P47",
    ]),
  });

  readonly alpha2Code: string;
  readonly alpha3Code: string;
  readonly numericCode: number;
  readonly englishName: string;
  readonly localizedName: string;
  readonly nativeName: string;
  readonly callingCode: string;
  readonly topLevelDomain: string;
  readonly continent: Continent;
  readonly currencyCodes: readonly string[];
  readonly languageCodes: readonly string[];

  private constructor(row: CountryRow) {
    this.alpha2Code = row.alpha2;
    this.alpha3Code = row.alpha3;
    this.numericCode = row.numeric;
    this.englishName = row.en;
    this.localizedName = row.sv;
    this.nativeName = row.native;
    this.callingCode = row.callingCode;
    this.topLevelDomain = row.tld;
    this.continent = row.continent;
    this.currencyCodes = COUNTRY_CURRENCIES[row.alpha2] ?? [];
    this.languageCodes = COUNTRY_LANGUAGES[row.alpha2] ?? [];
  }

  /** The canonical value of this country: its ISO 3166-1 alpha-2 code. */
  get value(): string {
    return this.alpha2Code;
  }

  /** Display name in the current culture (Swedish or English). */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Culture-independent display form. Always the English name. */
  get formatted(): string {
    return this.englishName;
  }

  /** Geographic coordinate of the country (centroid, from Wikidata P625). */
  get coordinate(): GeoCoordinate {
    const c = COUNTRY_COORDINATES[this.alpha2Code];
    if (!c) throw new Error(`No coordinate for country ${this.alpha2Code}.`);
    return GeoCoordinate.create(c[0], c[1]);
  }

  /** Approximate latitude (WGS 84) of the country centroid. */
  get latitude(): number {
    return this.coordinate.latitude;
  }

  /** Approximate longitude (WGS 84) of the country centroid. */
  get longitude(): number {
    return this.coordinate.longitude;
  }

  /** Capital city, or `null` for entries without a capital (e.g. Antarctica). */
  get capital(): CountryCapital | null {
    return getCountryCapital(this.alpha2Code);
  }

  get isInEuropeanUnion(): boolean {
    return EU_COUNTRIES.has(this.alpha2Code);
  }
  get isInEea(): boolean {
    return EEA_COUNTRIES.has(this.alpha2Code);
  }
  get isInSchengen(): boolean {
    return SCHENGEN_COUNTRIES.has(this.alpha2Code);
  }
  get isInNordics(): boolean {
    return NORDIC_COUNTRIES.has(this.alpha2Code);
  }
  get isInSepa(): boolean {
    return SEPA_COUNTRIES.has(this.alpha2Code);
  }

  /** True when the euro is among the country's legal tenders. */
  get usesEuro(): boolean {
    return this.currencyCodes.includes("EUR");
  }

  /** Primary ISO 4217 currency code, or `null` when unknown. */
  get currencyCode(): string | null {
    return this.currencyCodes[0] ?? null;
  }

  /**
   * Primary legal-tender currency, or `null` when unknown. Countries with
   * several legal tenders (Cuba, Panama, Namibia) return the first; use
   * {@link currencies} for the full list.
   */
  get currency(): Currency | null {
    const code = this.currencyCode;
    return code == null ? null : Currency.tryParse(code);
  }

  /** All recognized currencies for this country, in priority order. */
  get currencies(): readonly Currency[] {
    return Object.freeze(
      this.currencyCodes
        .map((code) => Currency.tryParse(code))
        .filter((c): c is Currency => c !== null),
    );
  }

  /**
   * Primary official language, or `null` when unknown. Countries with several
   * official languages (Belgium, Switzerland) return the most widely spoken;
   * use {@link officialLanguages} for the full list.
   */
  get primaryLanguage(): Language | null {
    const code = this.languageCodes[0];
    return code == null ? null : Language.tryParse(code);
  }

  /** All official languages of the country, in priority order. */
  get officialLanguages(): readonly Language[] {
    return Object.freeze(
      this.languageCodes
        .map((code) => Language.tryParse(code))
        .filter((l): l is Language => l !== null),
    );
  }

  static tryParse(input: string | null | undefined): Country | null {
    if (input == null) return null;
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length === 0 || sanitized.length > MAX_INPUT_LENGTH) return null;

    const direct = lookupCi(sanitized);
    if (direct) return direct;

    if (sanitized.length > 4 && sanitized.slice(0, 4).toLowerCase() === "the ") {
      const without = sanitized.slice(4);
      const stripped = lookupCi(without);
      if (stripped) return stripped;
    }
    return null;
  }

  static parse(input: string): Country {
    const r = Country.tryParse(input);
    if (r === null) throw new Error("Unknown country.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Country.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Country.tryParse(input);
    if (r) return r.displayName;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Country.tryParse(input);
    if (r) return r.alpha2Code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const trimmed = input.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Country.normalize(input) === input;
  }

  /** Look up a country by its phone calling code. Primary owner wins for shared codes. */
  static tryFindByCallingCode(callingCode: string | null | undefined): Country | null {
    if (callingCode == null) return null;
    const trimmed = callingCode.trim();
    if (trimmed.length === 0) return null;
    return BY_CALLING_CODE.get(trimmed) ?? null;
  }

  /** All known countries. */
  static get all(): readonly Country[] {
    return ALL_COUNTRIES;
  }

  /**
   * Returns countries within `radiusKm` of this country, ordered by distance.
   */
  findNeighbors(radiusKm: number): readonly CountryDistance[] {
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new RangeError("radiusKm must be a positive finite number.");
    }
    return Country.findNeighbors(this.coordinate, radiusKm).filter((d) => d.country !== this);
  }

  /** Returns countries within `radiusKm` of `coordinate`, ordered by distance. */
  static findNeighbors(coordinate: GeoCoordinate, radiusKm: number): readonly CountryDistance[] {
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new RangeError("radiusKm must be a positive finite number.");
    }
    const out: CountryDistance[] = [];
    for (const c of ALL_COUNTRIES) {
      const dist = GeoCoordinate.distanceKilometers(coordinate, c.coordinate);
      if (dist <= radiusKm) out.push({ country: c, distanceKilometers: dist });
    }
    out.sort((a, b) => a.distanceKilometers - b.distanceKilometers);
    return out;
  }

  /**
   * Scans unstructured text for country names (4+ chars, word-bounded). Low confidence
   * because country names can occur in non-geographic contexts.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<Country>[] {
    if (!text) return [];
    const out: TextCandidate<Country>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const country = Country.tryParse(m[0]);
      if (!country) continue;
      out.push(
        new TextCandidate<Country>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "Country",
          category: TextCandidateCategory.Geography,
          normalizedForm: country.toNormalizedString(),
          formattedForm: country.toString(),
          maskedForm: country.localizedName,
          confidence: TextMatchConfidence.Low,
          value: country,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.alpha2Code;
  }
  toString(): string {
    return this.displayName;
  }
  toDisplayString(): string {
    return this.displayName;
  }
  toEnglishString(): string {
    return this.englishName;
  }
  toNativeString(): string {
    return this.nativeName;
  }

  equals(other: Country | null | undefined): boolean {
    return other != null && this.alpha2Code === other.alpha2Code;
  }
  compareTo(other: Country | null | undefined): number {
    if (other == null) return 1;
    return this.alpha2Code < other.alpha2Code ? -1 : this.alpha2Code > other.alpha2Code ? 1 : 0;
  }

  static get Sweden(): Country {
    return getByAlpha2("SE");
  }
  static get Norway(): Country {
    return getByAlpha2("NO");
  }
  static get Finland(): Country {
    return getByAlpha2("FI");
  }
  static get Denmark(): Country {
    return getByAlpha2("DK");
  }
  static get Iceland(): Country {
    return getByAlpha2("IS");
  }
  static get Germany(): Country {
    return getByAlpha2("DE");
  }
  static get Poland(): Country {
    return getByAlpha2("PL");
  }
  static get Estonia(): Country {
    return getByAlpha2("EE");
  }
  static get Lithuania(): Country {
    return getByAlpha2("LT");
  }
  static get Latvia(): Country {
    return getByAlpha2("LV");
  }
  static get Romania(): Country {
    return getByAlpha2("RO");
  }
  static get Bulgaria(): Country {
    return getByAlpha2("BG");
  }
  static get CzechRepublic(): Country {
    return getByAlpha2("CZ");
  }
  static get Spain(): Country {
    return getByAlpha2("ES");
  }
  static get Netherlands(): Country {
    return getByAlpha2("NL");
  }
  static get Greece(): Country {
    return getByAlpha2("GR");
  }
  static get Italy(): Country {
    return getByAlpha2("IT");
  }
  static get Slovenia(): Country {
    return getByAlpha2("SI");
  }
  static get Croatia(): Country {
    return getByAlpha2("HR");
  }
  static get Portugal(): Country {
    return getByAlpha2("PT");
  }
  static get Hungary(): Country {
    return getByAlpha2("HU");
  }
  static get France(): Country {
    return getByAlpha2("FR");
  }
  static get Slovakia(): Country {
    return getByAlpha2("SK");
  }
  static get Belgium(): Country {
    return getByAlpha2("BE");
  }
  static get UnitedKingdom(): Country {
    return getByAlpha2("GB");
  }
  static get Austria(): Country {
    return getByAlpha2("AT");
  }
  static get Cyprus(): Country {
    return getByAlpha2("CY");
  }
  static get Switzerland(): Country {
    return getByAlpha2("CH");
  }
  static get Ireland(): Country {
    return getByAlpha2("IE");
  }
  static get Luxembourg(): Country {
    return getByAlpha2("LU");
  }
  static get Malta(): Country {
    return getByAlpha2("MT");
  }
  static get Liechtenstein(): Country {
    return getByAlpha2("LI");
  }

  /** @internal */
  static _fromRow(row: CountryRow): Country {
    return new Country(row);
  }
}

const ALL_COUNTRIES: readonly Country[] = COUNTRY_ROWS.map((r) => Country._fromRow(r));

const BY_ALPHA2 = new Map<string, Country>();
const BY_NAME = new Map<string, Country>();
const BY_CALLING_CODE = new Map<string, Country>();

for (const c of ALL_COUNTRIES) {
  BY_ALPHA2.set(c.alpha2Code.toUpperCase(), c);
  BY_NAME.set(c.alpha2Code.toUpperCase(), c);
  BY_NAME.set(c.alpha3Code.toUpperCase(), c);
  BY_NAME.set(c.englishName.toLowerCase(), c);
  if (!BY_NAME.has(c.localizedName.toLowerCase())) BY_NAME.set(c.localizedName.toLowerCase(), c);
  if (
    c.nativeName.toLowerCase() !== c.englishName.toLowerCase() &&
    !BY_NAME.has(c.nativeName.toLowerCase())
  ) {
    BY_NAME.set(c.nativeName.toLowerCase(), c);
  }
  if (!BY_CALLING_CODE.has(c.callingCode)) BY_CALLING_CODE.set(c.callingCode, c);
}

for (const [aliasOrCode, alpha2] of Object.entries(COUNTRY_ALIASES)) {
  const target = BY_ALPHA2.get(alpha2.toUpperCase());
  if (target) BY_NAME.set(aliasOrCode.toLowerCase(), target);
}

for (const [code, alpha2] of Object.entries(PRIMARY_BY_CALLING_CODE)) {
  const target = BY_ALPHA2.get(alpha2.toUpperCase());
  if (target) BY_CALLING_CODE.set(code, target);
}

const SCAN_PATTERN: RegExp = (() => {
  const names = [...BY_NAME.keys()]
    .filter((n) => n.length >= 4)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${names.join("|")})(?![\\p{L}\\p{N}_])`, "giu");
})();

function getByAlpha2(code: string): Country {
  const c = BY_ALPHA2.get(code.toUpperCase());
  if (!c) throw new Error(`Unknown country code ${code}.`);
  return c;
}

function lookupCi(input: string): Country | null {
  const upper = input.toUpperCase();
  const a2 = BY_ALPHA2.get(upper);
  if (a2) return a2;
  const lower = input.toLowerCase();
  return BY_NAME.get(lower) ?? BY_NAME.get(upper) ?? null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
