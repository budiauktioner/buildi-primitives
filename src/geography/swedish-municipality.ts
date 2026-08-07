import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { GeoCoordinate } from "./geo-coordinate.js";
import { SwedishCounty } from "./swedish-county.js";
import { MUNICIPALITY_ROWS } from "./swedish-municipality-data.js";

const MAX_INPUT_LENGTH = 100;
const MIN_SCAN_NAME_LENGTH = 4;

export interface MunicipalityDistance {
  readonly municipality: SwedishMunicipality;
  readonly distanceKilometers: number;
}

/** A Swedish municipality (`kommun`), keyed by SCB's 4-digit municipality code. */
export class SwedishMunicipality {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Municipality",
    localizedName: "Kommun",
    emoji: "\u{1F3D8}\uFE0F",
    sources: Object.freeze([
      "https://www.scb.se/en/finding-statistics/regional-statistics/regional-divisions/counties-and-municipalities/counties-and-municipalities-in-numerical-order/",
    ]),
  });

  readonly code: string;
  readonly localizedName: string;
  readonly englishName: string;
  readonly county: SwedishCounty;
  readonly coordinate: GeoCoordinate;

  private constructor(
    code: string,
    localized: string,
    english: string,
    county: SwedishCounty,
    coord: GeoCoordinate,
  ) {
    this.code = code;
    this.localizedName = localized;
    this.englishName = english;
    this.county = county;
    this.coordinate = coord;
  }

  get countyCode(): string {
    return this.county.code;
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

  static tryParse(input: string | null | undefined): SwedishMunicipality | null {
    if (input == null) return null;
    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) return null;

    const digits = keepDigits(trimmed);
    if (digits.length === 4 && BY_CODE.has(digits)) return BY_CODE.get(digits)!;

    return BY_NAME.get(trimmed.toLowerCase()) ?? null;
  }

  static parse(input: string): SwedishMunicipality {
    const r = SwedishMunicipality.tryParse(input);
    if (r === null) throw new Error("Invalid Swedish municipality.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishMunicipality.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishMunicipality.tryParse(input);
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
    const r = SwedishMunicipality.tryParse(input);
    if (r) return r.code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const trimmed = input.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishMunicipality.normalize(input) === input;
  }

  /** All 290 Swedish municipalities, ordered by code. */
  static get all(): readonly SwedishMunicipality[] {
    return ALL_MUNICIPALITIES;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishMunicipality>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishMunicipality>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const municipality = SwedishMunicipality.tryParse(m[0]);
      if (!municipality) continue;
      out.push(
        new TextCandidate<SwedishMunicipality>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishMunicipality",
          category: TextCandidateCategory.Geography,
          normalizedForm: municipality.toNormalizedString(),
          formattedForm: municipality.toString(),
          maskedForm: municipality.localizedName,
          confidence: TextMatchConfidence.Low,
          value: municipality,
        }),
      );
    }
    return out;
  }

  static distanceKilometers(a: SwedishMunicipality, b: SwedishMunicipality): number {
    return GeoCoordinate.distanceKilometers(a.coordinate, b.coordinate);
  }

  distanceKilometersTo(other: SwedishMunicipality | GeoCoordinate): number {
    const target = other instanceof SwedishMunicipality ? other.coordinate : other;
    return GeoCoordinate.distanceKilometers(this.coordinate, target);
  }

  findNeighbors(radiusKm: number): readonly MunicipalityDistance[] {
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new RangeError("radiusKm must be a positive finite number.");
    }
    const out: MunicipalityDistance[] = [];
    for (const m of ALL_MUNICIPALITIES) {
      if (m === this) continue;
      const dist = GeoCoordinate.distanceKilometers(this.coordinate, m.coordinate);
      if (dist <= radiusKm) out.push({ municipality: m, distanceKilometers: dist });
    }
    out.sort((a, b) => a.distanceKilometers - b.distanceKilometers);
    return out;
  }

  static findNeighbors(
    coordinate: GeoCoordinate,
    radiusKm: number,
  ): readonly MunicipalityDistance[] {
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new RangeError("radiusKm must be a positive finite number.");
    }
    const out: MunicipalityDistance[] = [];
    for (const m of ALL_MUNICIPALITIES) {
      const dist = GeoCoordinate.distanceKilometers(coordinate, m.coordinate);
      if (dist <= radiusKm) out.push({ municipality: m, distanceKilometers: dist });
    }
    out.sort((a, b) => a.distanceKilometers - b.distanceKilometers);
    return out;
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

  equals(other: SwedishMunicipality | null | undefined): boolean {
    return other != null && this.code === other.code;
  }
  compareTo(other: SwedishMunicipality | null | undefined): number {
    if (other == null) return 1;
    return this.code < other.code ? -1 : this.code > other.code ? 1 : 0;
  }

  /** @internal */
  static _new(
    code: string,
    sv: string,
    en: string,
    county: SwedishCounty,
    coord: GeoCoordinate,
  ): SwedishMunicipality {
    return new SwedishMunicipality(code, sv, en, county, coord);
  }
}

const ALL_MUNICIPALITIES: readonly SwedishMunicipality[] = MUNICIPALITY_ROWS.map((r) => {
  const county = SwedishCounty.parse(r.code.slice(0, 2));
  const coord = GeoCoordinate.create(r.lat, r.lon);
  return SwedishMunicipality._new(r.code, r.name, r.englishName ?? r.name, county, coord);
})
  .slice()
  .sort((a, b) => a.code.localeCompare(b.code));

const BY_CODE = new Map<string, SwedishMunicipality>();
const BY_NAME = new Map<string, SwedishMunicipality>();

for (const m of ALL_MUNICIPALITIES) {
  BY_CODE.set(m.code, m);
  BY_NAME.set(m.localizedName.toLowerCase(), m);
  if (m.englishName.toLowerCase() !== m.localizedName.toLowerCase()) {
    BY_NAME.set(m.englishName.toLowerCase(), m);
  }
  addGenitive(m.localizedName, m);
  if (m.englishName.toLowerCase() !== m.localizedName.toLowerCase()) {
    addGenitive(m.englishName, m);
  }
}

function addGenitive(name: string, m: SwedishMunicipality): void {
  if (name.endsWith("s") || name.endsWith("S")) return;
  const key = (name + "s").toLowerCase();
  if (!BY_NAME.has(key)) BY_NAME.set(key, m);
}

const SCAN_PATTERN: RegExp = (() => {
  const names = [...BY_NAME.keys()]
    .filter((n) => n.length >= MIN_SCAN_NAME_LENGTH)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Unicode-aware word boundaries: \b in JS is ASCII-only even with /u, so
  // we use look-around on Unicode letters/digits to mimic .NET's \b behaviour.
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${names.join("|")})(?![\\p{L}\\p{N}_])`, "giu");
})();
