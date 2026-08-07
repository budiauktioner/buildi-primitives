import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { GeoCoordinate } from "./geo-coordinate.js";

const MAX_INPUT_LENGTH = 100;

/** A Swedish county (`län`), keyed by SCB's 2-digit county code. */
export class SwedishCounty {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "County",
    localizedName: "Län",
    emoji: "\u{1F3DB}\uFE0F",
    sources: Object.freeze([
      "https://www.scb.se/en/finding-statistics/regional-statistics/regional-divisions/counties-and-municipalities/",
      "https://www.scb.se/en/finding-statistics/regional-statistics/regional-divisions/counties-and-municipalities/counties-and-municipalities-in-numerical-order/",
    ]),
  });

  readonly code: string;
  readonly localizedName: string;
  readonly englishName: string;
  readonly coordinate: GeoCoordinate;

  private constructor(code: string, localized: string, english: string, coord: GeoCoordinate) {
    this.code = code;
    this.localizedName = localized;
    this.englishName = english;
    this.coordinate = coord;
  }

  get latitude(): number {
    return this.coordinate.latitude;
  }
  get longitude(): number {
    return this.coordinate.longitude;
  }

  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  static tryParse(input: string | null | undefined): SwedishCounty | null {
    if (input == null) return null;
    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) return null;

    const digits = keepDigits(trimmed);
    if (digits.length === 2 && BY_CODE.has(digits)) return BY_CODE.get(digits)!;

    return BY_NAME.get(trimmed.toLowerCase()) ?? null;
  }

  static parse(input: string): SwedishCounty {
    const r = SwedishCounty.tryParse(input);
    if (r === null) throw new Error("Invalid Swedish county.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishCounty.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishCounty.tryParse(input);
    if (r) return r.localizedName;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishCounty.tryParse(input);
    if (r) return r.code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const trimmed = input.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishCounty.normalize(input) === input;
  }

  /** All 21 Swedish counties. */
  static get all(): readonly SwedishCounty[] {
    return ALL_COUNTIES;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishCounty>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishCounty>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const county = SwedishCounty.tryParse(m[0]);
      if (!county) continue;
      out.push(
        new TextCandidate<SwedishCounty>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishCounty",
          category: TextCandidateCategory.Geography,
          normalizedForm: county.toNormalizedString(),
          formattedForm: county.toString(),
          maskedForm: county.localizedName,
          confidence: TextMatchConfidence.Low,
          value: county,
        }),
      );
    }
    return out;
  }

  /** Distance in kilometers between two counties (by county seat). */
  static distanceKilometers(a: SwedishCounty, b: SwedishCounty): number {
    return GeoCoordinate.distanceKilometers(a.coordinate, b.coordinate);
  }

  distanceKilometersTo(other: SwedishCounty | GeoCoordinate): number {
    const target = other instanceof SwedishCounty ? other.coordinate : other;
    return GeoCoordinate.distanceKilometers(this.coordinate, target);
  }

  toNormalizedString(): string {
    return this.code;
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
  toLocalString(): string {
    return this.localizedName;
  }

  equals(other: SwedishCounty | null | undefined): boolean {
    return other != null && this.code === other.code;
  }
  compareTo(other: SwedishCounty | null | undefined): number {
    if (other == null) return 1;
    return this.code < other.code ? -1 : this.code > other.code ? 1 : 0;
  }

  /** @internal */
  static _new(code: string, sv: string, en: string, c: GeoCoordinate): SwedishCounty {
    return new SwedishCounty(code, sv, en, c);
  }
}

interface CountyDef {
  readonly code: string;
  readonly sv: string;
  readonly en: string;
  readonly lat: number;
  readonly lon: number;
}

const COUNTY_DEFS: readonly CountyDef[] = [
  { code: "01", sv: "Stockholms län", en: "Stockholm County", lat: 59.3275, lon: 18.054719 },
  { code: "03", sv: "Uppsala län", en: "Uppsala County", lat: 59.866667, lon: 17.633333 },
  {
    code: "04",
    sv: "Södermanlands län",
    en: "Södermanland County",
    lat: 58.752778,
    lon: 17.008611,
  },
  { code: "05", sv: "Östergötlands län", en: "Östergötland County", lat: 58.4, lon: 15.616667 },
  { code: "06", sv: "Jönköpings län", en: "Jönköping County", lat: 57.783333, lon: 14.2 },
  { code: "07", sv: "Kronobergs län", en: "Kronoberg County", lat: 56.883333, lon: 14.8 },
  { code: "08", sv: "Kalmar län", en: "Kalmar County", lat: 56.666667, lon: 16.366667 },
  { code: "09", sv: "Gotlands län", en: "Gotland County", lat: 57.615278, lon: 18.280556 },
  { code: "10", sv: "Blekinge län", en: "Blekinge County", lat: 56.183333, lon: 15.65 },
  { code: "12", sv: "Skåne län", en: "Skåne County", lat: 55.565, lon: 13.018611 },
  { code: "13", sv: "Hallands län", en: "Halland County", lat: 56.666667, lon: 12.85 },
  {
    code: "14",
    sv: "Västra Götalands län",
    en: "Västra Götaland County",
    lat: 57.7,
    lon: 11.933333,
  },
  { code: "17", sv: "Värmlands län", en: "Värmland County", lat: 59.383333, lon: 13.533333 },
  { code: "18", sv: "Örebro län", en: "Örebro County", lat: 59.273889, lon: 15.213333 },
  { code: "19", sv: "Västmanlands län", en: "Västmanland County", lat: 59.616667, lon: 16.533333 },
  { code: "20", sv: "Dalarnas län", en: "Dalarna County", lat: 60.6, lon: 15.633333 },
  { code: "21", sv: "Gävleborgs län", en: "Gävleborg County", lat: 60.666667, lon: 17.166667 },
  {
    code: "22",
    sv: "Västernorrlands län",
    en: "Västernorrland County",
    lat: 62.633333,
    lon: 17.933333,
  },
  { code: "23", sv: "Jämtlands län", en: "Jämtland County", lat: 63.183333, lon: 14.666667 },
  { code: "24", sv: "Västerbottens län", en: "Västerbotten County", lat: 63.833333, lon: 20.25 },
  { code: "25", sv: "Norrbottens län", en: "Norrbotten County", lat: 65.584444, lon: 22.153889 },
];

const ALL_COUNTIES: readonly SwedishCounty[] = COUNTY_DEFS.map((d) =>
  SwedishCounty._new(d.code, d.sv, d.en, GeoCoordinate.create(d.lat, d.lon)),
);

const BY_CODE = new Map<string, SwedishCounty>();
const BY_NAME = new Map<string, SwedishCounty>();

for (const c of ALL_COUNTIES) {
  BY_CODE.set(c.code, c);
  BY_NAME.set(c.localizedName.toLowerCase(), c);
  BY_NAME.set(c.englishName.toLowerCase(), c);

  const sv = c.localizedName;
  if (sv.endsWith(" län")) {
    const baseSv = sv.slice(0, -4);
    if (!BY_NAME.has(baseSv.toLowerCase())) BY_NAME.set(baseSv.toLowerCase(), c);
    addGenitive(baseSv, c);
  }
  const en = c.englishName;
  if (en.endsWith(" County")) {
    const baseEn = en.slice(0, -7);
    if (!BY_NAME.has(baseEn.toLowerCase())) BY_NAME.set(baseEn.toLowerCase(), c);
    addGenitive(baseEn, c);
  }
}

function addGenitive(name: string, county: SwedishCounty): void {
  if (name.endsWith("s") || name.endsWith("S")) return;
  const key = (name + "s").toLowerCase();
  if (!BY_NAME.has(key)) BY_NAME.set(key, county);
}

const SCAN_PATTERN: RegExp = (() => {
  const names = [...BY_NAME.keys()]
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${names.join("|")})(?![\\p{L}\\p{N}_])`, "giu");
})();
