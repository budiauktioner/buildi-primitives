import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { SwedishDrivingLicenseVehicleGroup } from "./swedish-driving-license-vehicle-group.js";

/** Options shared by the string-in, string-out helpers. */
export interface SwedishDrivingLicenseCategoryFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface SwedishDrivingLicenseCategoryDef {
  readonly code: string;
  readonly localizedName: string;
  readonly englishName: string;
  readonly description: string;
  readonly minimumAge: number;
  readonly vehicleGroup: SwedishDrivingLicenseVehicleGroup;
  readonly isTrailerCategory: boolean;
  readonly validityYears: number;
  readonly value: string;
  readonly rank: number;
}

/** Broad vehicle group associated with a {@link SwedishDrivingLicenseCategory}. */
export class SwedishDrivingLicenseCategory {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Driving License Category",
    localizedName: "Körkortsbehörighet",
    emoji: "🪪",
    sources: Object.freeze([
      "https://www.transportstyrelsen.se/en/road/driving-licences/im-going-to-take-my-driving-licence/driving-licence-categories/",
      "https://en.wikipedia.org/wiki/Driving_licence_in_Sweden",
    ]),
  });

  readonly code: string;
  readonly localizedName: string;
  readonly englishName: string;
  readonly description: string;
  readonly minimumAge: number;
  readonly vehicleGroup: SwedishDrivingLicenseVehicleGroup;
  readonly isTrailerCategory: boolean;
  readonly validityYears: number;
  readonly value: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: SwedishDrivingLicenseCategoryDef) {
    this.code = def.code;
    this.localizedName = def.localizedName;
    this.englishName = def.englishName;
    this.description = def.description;
    this.minimumAge = def.minimumAge;
    this.vehicleGroup = def.vehicleGroup;
    this.isTrailerCategory = def.isTrailerCategory;
    this.validityYears = def.validityYears;
    this.value = def.value;
    this.rank = def.rank;
  }

  static readonly AM = new SwedishDrivingLicenseCategory({
    code: "AM",
    localizedName: "Moped klass I",
    englishName: "Class I moped",
    description:
      "Class I moped (EU moped), class II moped, tractor type a, class II construction equipment",
    minimumAge: 15,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Moped,
    isTrailerCategory: false,
    validityYears: 10,
    value: "AM",
    rank: 3,
  });

  static readonly A1 = new SwedishDrivingLicenseCategory({
    code: "A1",
    localizedName: "Lätt motorcykel",
    englishName: "Light motorcycle",
    description:
      "Two-wheeled motorcycle max 125 cm³ and 11 kW, or three-wheeled motorcycle max 15 kW",
    minimumAge: 16,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Motorcycle,
    isTrailerCategory: false,
    validityYears: 10,
    value: "A1",
    rank: 1,
  });

  static readonly A2 = new SwedishDrivingLicenseCategory({
    code: "A2",
    localizedName: "Mellanstor motorcykel",
    englishName: "Medium motorcycle",
    description:
      "Two-wheeled motorcycle max 35 kW and 0.2 kW/kg, or three-wheeled motorcycle max 15 kW",
    minimumAge: 18,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Motorcycle,
    isTrailerCategory: false,
    validityYears: 10,
    value: "A2",
    rank: 2,
  });

  static readonly A = new SwedishDrivingLicenseCategory({
    code: "A",
    localizedName: "Tung motorcykel",
    englishName: "Heavy motorcycle",
    description: "Two- and three-wheeled heavy motorcycles of any power",
    minimumAge: 24,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Motorcycle,
    isTrailerCategory: false,
    validityYears: 10,
    value: "A",
    rank: 0,
  });

  static readonly B = new SwedishDrivingLicenseCategory({
    code: "B",
    localizedName: "Personbil och lätt lastbil",
    englishName: "Car and light lorry",
    description:
      "Passenger car or light lorry max 3,500 kg with a light trailer, off-road vehicles, three- and four-wheeled motorcycles",
    minimumAge: 18,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Car,
    isTrailerCategory: false,
    validityYears: 10,
    value: "B",
    rank: 4,
  });

  static readonly B96 = new SwedishDrivingLicenseCategory({
    code: "B96",
    localizedName: "Personbil utökad",
    englishName: "Car extended",
    description:
      "Vehicle combinations where the combined car and trailer mass exceeds 3,500 kg but not 4,250 kg",
    minimumAge: 18,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Car,
    isTrailerCategory: false,
    validityYears: 10,
    value: "B96",
    rank: 5,
  });

  static readonly BE = new SwedishDrivingLicenseCategory({
    code: "BE",
    localizedName: "Personbil med tungt släp",
    englishName: "Car with heavy trailer",
    description: "Car or light lorry with one or more trailers, combined mass may exceed 3,500 kg",
    minimumAge: 18,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Car,
    isTrailerCategory: true,
    validityYears: 10,
    value: "BE",
    rank: 6,
  });

  static readonly C1 = new SwedishDrivingLicenseCategory({
    code: "C1",
    localizedName: "Medeltung lastbil",
    englishName: "Medium heavy lorry",
    description:
      "Heavy lorry max 7,500 kg or car over 3,500 kg but not exceeding 7,500 kg, with a light trailer",
    minimumAge: 18,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Truck,
    isTrailerCategory: false,
    validityYears: 5,
    value: "C1",
    rank: 8,
  });

  static readonly C1E = new SwedishDrivingLicenseCategory({
    code: "C1E",
    localizedName: "Medeltung lastbil med tungt släp",
    englishName: "Medium heavy lorry with heavy trailer",
    description: "C1 or B vehicle with one or more trailers, combined mass max 12,000 kg",
    minimumAge: 18,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Truck,
    isTrailerCategory: true,
    validityYears: 5,
    value: "C1E",
    rank: 9,
  });

  static readonly C = new SwedishDrivingLicenseCategory({
    code: "C",
    localizedName: "Tung lastbil",
    englishName: "Heavy lorry",
    description: "Heavy lorry over 3,500 kg with a light trailer max 750 kg",
    minimumAge: 21,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Truck,
    isTrailerCategory: false,
    validityYears: 5,
    value: "C",
    rank: 7,
  });

  static readonly CE = new SwedishDrivingLicenseCategory({
    code: "CE",
    localizedName: "Tung lastbil med tungt släp",
    englishName: "Heavy lorry with heavy trailer",
    description: "Heavy lorry with one or more trailers of any weight",
    minimumAge: 21,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Truck,
    isTrailerCategory: true,
    validityYears: 5,
    value: "CE",
    rank: 10,
  });

  static readonly D1 = new SwedishDrivingLicenseCategory({
    code: "D1",
    localizedName: "Mellanstor buss",
    englishName: "Medium bus",
    description:
      "Bus max 16 passengers (plus driver), max 8 metres, with a light trailer max 750 kg",
    minimumAge: 21,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Bus,
    isTrailerCategory: false,
    validityYears: 5,
    value: "D1",
    rank: 12,
  });

  static readonly D1E = new SwedishDrivingLicenseCategory({
    code: "D1E",
    localizedName: "Mellanstor buss med tungt släp",
    englishName: "Medium bus with heavy trailer",
    description: "D1 bus with one or more trailers of any weight",
    minimumAge: 21,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Bus,
    isTrailerCategory: true,
    validityYears: 5,
    value: "D1E",
    rank: 13,
  });

  static readonly D = new SwedishDrivingLicenseCategory({
    code: "D",
    localizedName: "Buss",
    englishName: "Bus",
    description: "Bus of any length and passenger capacity, with a light trailer max 750 kg",
    minimumAge: 24,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Bus,
    isTrailerCategory: false,
    validityYears: 5,
    value: "D",
    rank: 11,
  });

  static readonly DE = new SwedishDrivingLicenseCategory({
    code: "DE",
    localizedName: "Buss med tungt släp",
    englishName: "Bus with heavy trailer",
    description: "Bus with one or more trailers of any weight",
    minimumAge: 24,
    vehicleGroup: SwedishDrivingLicenseVehicleGroup.Bus,
    isTrailerCategory: true,
    validityYears: 5,
    value: "DE",
    rank: 14,
  });

  /** All 15 values, in canonical order. */
  static get all(): readonly SwedishDrivingLicenseCategory[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): SwedishDrivingLicenseCategory | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): SwedishDrivingLicenseCategory {
    const result = SwedishDrivingLicenseCategory.tryParse(input);
    if (result === null) throw new Error(`Invalid driving license category.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishDrivingLicenseCategory.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: SwedishDrivingLicenseCategoryFormatOptions,
  ): string | null {
    const r = SwedishDrivingLicenseCategory.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames
        ? `${r.code} \u2014 ${r.localizedName}`
        : `${r.code} \u2014 ${r.englishName}`;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: SwedishDrivingLicenseCategoryFormatOptions,
  ): string | null {
    const r = SwedishDrivingLicenseCategory.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishDrivingLicenseCategory.normalize(input) === input;
  }

  /** Finds driving license category mentions in unstructured text. */
  static findCandidatesInText(
    text: string,
  ): readonly TextCandidate<SwedishDrivingLicenseCategory>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishDrivingLicenseCategory>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const value = SwedishDrivingLicenseCategory.tryParse(m[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<SwedishDrivingLicenseCategory>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishDrivingLicenseCategory",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: value.code,
          confidence: TextMatchConfidence.Low,
          value,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? `${this.code} \u2014 ${this.localizedName}`
      : `${this.code} \u2014 ${this.englishName}`;
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

  equals(other: SwedishDrivingLicenseCategory | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: SwedishDrivingLicenseCategory | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly SwedishDrivingLicenseCategory[] = [
  SwedishDrivingLicenseCategory.AM,
  SwedishDrivingLicenseCategory.A1,
  SwedishDrivingLicenseCategory.A2,
  SwedishDrivingLicenseCategory.A,
  SwedishDrivingLicenseCategory.B,
  SwedishDrivingLicenseCategory.B96,
  SwedishDrivingLicenseCategory.BE,
  SwedishDrivingLicenseCategory.C1,
  SwedishDrivingLicenseCategory.C1E,
  SwedishDrivingLicenseCategory.C,
  SwedishDrivingLicenseCategory.CE,
  SwedishDrivingLicenseCategory.D1,
  SwedishDrivingLicenseCategory.D1E,
  SwedishDrivingLicenseCategory.D,
  SwedishDrivingLicenseCategory.DE,
];

function fallback(
  input: string | null | undefined,
  options?: SwedishDrivingLicenseCategoryFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /\s+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("ö", "o").replaceAll("ä", "a");
  folded = folded.replace(KEY_PATTERN, " ");
  return folded;
}

const ALIASES: readonly (readonly [SwedishDrivingLicenseCategory, readonly string[]])[] = [
  [
    SwedishDrivingLicenseCategory.AM,
    ["am", "class i moped", "eu moped", "eu-moped", "moped", "moped klass i"],
  ],
  [SwedishDrivingLicenseCategory.A1, ["a1", "latt motorcykel", "light motorcycle"]],
  [SwedishDrivingLicenseCategory.A2, ["a2", "medium motorcycle", "mellanstor motorcykel"]],
  [
    SwedishDrivingLicenseCategory.A,
    ["a", "heavy motorcycle", "mc", "motorcykel", "tung motorcykel"],
  ],
  [
    SwedishDrivingLicenseCategory.B,
    ["b", "bil", "car and light lorry", "personbil", "personbil och latt lastbil"],
  ],
  [
    SwedishDrivingLicenseCategory.B96,
    ["b extended", "b utokad", "b96", "car extended", "personbil utokad"],
  ],
  [
    SwedishDrivingLicenseCategory.BE,
    ["be", "bil med tungt slap", "car with heavy trailer", "personbil med tungt slap"],
  ],
  [SwedishDrivingLicenseCategory.C1, ["c1", "medeltung lastbil", "medium heavy lorry"]],
  [
    SwedishDrivingLicenseCategory.C1E,
    ["c1e", "medeltung lastbil med tungt slap", "medium heavy lorry with heavy trailer"],
  ],
  [SwedishDrivingLicenseCategory.C, ["c", "heavy lorry", "lastbil", "tung lastbil"]],
  [
    SwedishDrivingLicenseCategory.CE,
    ["ce", "heavy lorry with heavy trailer", "tung lastbil med tungt slap"],
  ],
  [SwedishDrivingLicenseCategory.D1, ["d1", "medium bus", "mellanstor buss"]],
  [
    SwedishDrivingLicenseCategory.D1E,
    ["d1e", "medium bus with heavy trailer", "mellanstor buss med tungt slap"],
  ],
  [SwedishDrivingLicenseCategory.D, ["bus", "buss", "d"]],
  [SwedishDrivingLicenseCategory.DE, ["bus with heavy trailer", "buss med tungt slap", "de"]],
];

const LOOKUP = new Map<string, SwedishDrivingLicenseCategory>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}

const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])(?:AM|A[12]?|B(?:96|E)?|C[1]?E?|D[1]?E?)(?![\p{L}\p{N}_])/gu;
