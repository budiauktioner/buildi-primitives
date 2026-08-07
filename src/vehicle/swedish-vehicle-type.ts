import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface SwedishVehicleTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface SwedishVehicleTypeDef {
  readonly value: string;
  readonly code: string;
  readonly englishName: string;
  readonly localizedName: string;
}

/** Swedish vehicle type classification (`fordonsslag`) as used by Transportstyrelsen. */
export class SwedishVehicleType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Vehicle Type",
    localizedName: "Fordonsslag",
    emoji: "🚙",
    sources: Object.freeze(["https://www.transportstyrelsen.se/"]),
  });

  readonly value: string;
  readonly code: string;
  readonly englishName: string;
  readonly localizedName: string;

  private constructor(def: SwedishVehicleTypeDef) {
    this.value = def.value;
    this.code = def.code;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
  }

  static readonly PassengerCar = new SwedishVehicleType({
    value: "PB",
    code: "PB",
    englishName: "Passenger car",
    localizedName: "Personbil",
  });

  static readonly Truck = new SwedishVehicleType({
    value: "LB",
    code: "LB",
    englishName: "Truck",
    localizedName: "Lastbil",
  });

  static readonly Bus = new SwedishVehicleType({
    value: "BU",
    code: "BU",
    englishName: "Bus",
    localizedName: "Buss",
  });

  static readonly Motorcycle = new SwedishVehicleType({
    value: "MC",
    code: "MC",
    englishName: "Motorcycle",
    localizedName: "Motorcykel",
  });

  static readonly MopedClassI = new SwedishVehicleType({
    value: "MR",
    code: "MR",
    englishName: "Moped class I",
    localizedName: "Moped klass I",
  });

  static readonly MopedClassII = new SwedishVehicleType({
    value: "EU-M",
    code: "EU-M",
    englishName: "Moped class II",
    localizedName: "EU-moped",
  });

  static readonly Trailer = new SwedishVehicleType({
    value: "SL",
    code: "SL",
    englishName: "Trailer",
    localizedName: "Släpvagn",
  });

  static readonly SemiTrailer = new SwedishVehicleType({
    value: "SA",
    code: "SA",
    englishName: "Semi-trailer",
    localizedName: "Påhängsvagn",
  });

  static readonly Caravan = new SwedishVehicleType({
    value: "HV",
    code: "HV",
    englishName: "Caravan",
    localizedName: "Husvagn",
  });

  static readonly Motorhome = new SwedishVehicleType({
    value: "HB",
    code: "HB",
    englishName: "Motorhome",
    localizedName: "Husbil",
  });

  static readonly AllTerrainVehicle = new SwedishVehicleType({
    value: "TK",
    code: "TK",
    englishName: "All-terrain vehicle",
    localizedName: "Terrängvagn",
  });

  static readonly Snowmobile = new SwedishVehicleType({
    value: "TM",
    code: "TM",
    englishName: "Snowmobile",
    localizedName: "Terrängskoter",
  });

  static readonly Atv = new SwedishVehicleType({
    value: "TH",
    code: "TH",
    englishName: "ATV",
    localizedName: "Terränghjuling",
  });

  static readonly ATractor = new SwedishVehicleType({
    value: "AT",
    code: "AT",
    englishName: "A-tractor",
    localizedName: "A-traktor",
  });

  static readonly PowerVehicleI = new SwedishVehicleType({
    value: "EP",
    code: "EP",
    englishName: "Power vehicle cl. I",
    localizedName: "Motorredskap klass I",
  });

  static readonly PowerVehicleII = new SwedishVehicleType({
    value: "MRK2",
    code: "MRK2",
    englishName: "Power vehicle cl. II",
    localizedName: "Motorredskap klass II",
  });

  static readonly LightTruck = new SwedishVehicleType({
    value: "LL",
    code: "LL",
    englishName: "Light truck",
    localizedName: "Lätt lastbil",
  });

  /** All 17 values, in canonical order. */
  static get all(): readonly SwedishVehicleType[] {
    return ALL;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): SwedishVehicleType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): SwedishVehicleType {
    const result = SwedishVehicleType.tryParse(input);
    if (result === null) throw new Error(`Invalid vehicle type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishVehicleType.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: SwedishVehicleTypeFormatOptions,
  ): string | null {
    const r = SwedishVehicleType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: SwedishVehicleTypeFormatOptions,
  ): string | null {
    const r = SwedishVehicleType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishVehicleType.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  equals(other: SwedishVehicleType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
}

const ALL: readonly SwedishVehicleType[] = [
  SwedishVehicleType.PassengerCar,
  SwedishVehicleType.Truck,
  SwedishVehicleType.Bus,
  SwedishVehicleType.Motorcycle,
  SwedishVehicleType.MopedClassI,
  SwedishVehicleType.MopedClassII,
  SwedishVehicleType.Trailer,
  SwedishVehicleType.SemiTrailer,
  SwedishVehicleType.Caravan,
  SwedishVehicleType.Motorhome,
  SwedishVehicleType.AllTerrainVehicle,
  SwedishVehicleType.Snowmobile,
  SwedishVehicleType.Atv,
  SwedishVehicleType.ATractor,
  SwedishVehicleType.PowerVehicleI,
  SwedishVehicleType.PowerVehicleII,
  SwedishVehicleType.LightTruck,
];

function fallback(
  input: string | null | undefined,
  options?: SwedishVehicleTypeFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /\s+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded
    .replaceAll("å", "a")
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("é", "e");
  folded = folded.replaceAll("_", " ");
  folded = folded.replace(KEY_PATTERN, " ");
  return folded;
}

const ALIASES: readonly (readonly [SwedishVehicleType, readonly string[]])[] = [
  [SwedishVehicleType.PassengerCar, ["bil", "car", "passenger car", "pb", "personbil"]],
  [SwedishVehicleType.Truck, ["lastbil", "lb", "lorry", "truck", "tung lastbil"]],
  [SwedishVehicleType.Bus, ["bu", "bus", "buss", "coach", "linjebuss", "turistbuss"]],
  [SwedishVehicleType.Motorcycle, ["mc", "motorbike", "motorcycle", "motorcykel"]],
  [
    SwedishVehicleType.MopedClassI,
    [
      "eu-moped klass i",
      "moped 1",
      "moped class i",
      "moped i",
      "moped klass 1",
      "moped klass i",
      "mr",
    ],
  ],
  [
    SwedishVehicleType.MopedClassII,
    [
      "eu moped",
      "eu-m",
      "eu-moped",
      "eum",
      "moped 2",
      "moped class ii",
      "moped ii",
      "moped klass 2",
      "moped klass ii",
    ],
  ],
  [SwedishVehicleType.Trailer, ["sl", "slap", "slapvagn", "trailer"]],
  [SwedishVehicleType.SemiTrailer, ["pahangsvagn", "sa", "semi-trailer", "semitrailer"]],
  [SwedishVehicleType.Caravan, ["campingvagn", "caravan", "husvagn", "hv"]],
  [SwedishVehicleType.Motorhome, ["camper", "campingbil", "hb", "husbil", "motorhome"]],
  [SwedishVehicleType.AllTerrainVehicle, ["all-terrain vehicle", "terrangvagn", "tk"]],
  [SwedishVehicleType.Snowmobile, ["skoter", "snoskoter", "snowmobile", "terrangskoter", "tm"]],
  [SwedishVehicleType.Atv, ["atv", "fyrhjuling", "quad", "quadbike", "terranghjuling", "th"]],
  [
    SwedishVehicleType.ATractor,
    ["a tractor", "a-tractor", "a-traktor", "at", "atraktor", "epa", "epa-traktor"],
  ],
  [
    SwedishVehicleType.PowerVehicleI,
    ["ep", "motorredskap i", "motorredskap klass 1", "motorredskap klass i", "power vehicle cl. i"],
  ],
  [
    SwedishVehicleType.PowerVehicleII,
    [
      "motorredskap ii",
      "motorredskap klass 2",
      "motorredskap klass ii",
      "mrk2",
      "power vehicle cl. ii",
    ],
  ],
  [SwedishVehicleType.LightTruck, ["latt lastbil", "light truck", "ll", "skapbil"]],
];

const LOOKUP = new Map<string, SwedishVehicleType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
