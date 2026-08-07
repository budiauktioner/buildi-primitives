import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface BodyTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface BodyTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/**
 * A passenger or commercial vehicle body type (`karosstyp`), e.g. `Sedan`, `Hatchback`,
 * `Stationwagon`, `SUV`, `Pickup`, `Truck`, `LightTruck`, `Trailer`, `Motorhome`, `Tractor`,
 * `Dumper`, `Tipper`, `OffRoad`.
 */
export class BodyType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Body Type",
    localizedName: "Karosstyp",
    emoji: "🚘",
    sources: Object.freeze([
      "https://www.transportstyrelsen.se/",
      "https://en.wikipedia.org/wiki/Car_body_style",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: BodyTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly Sedan = new BodyType({
    value: "Sedan",
    englishName: "Sedan",
    localizedName: "Sedan",
    rank: 16,
  });

  static readonly Hatchback = new BodyType({
    value: "Hatchback",
    englishName: "Hatchback",
    localizedName: "Halvkombi",
    rank: 5,
  });

  static readonly Stationwagon = new BodyType({
    value: "Stationwagon",
    englishName: "Station wagon",
    localizedName: "Kombi",
    rank: 17,
  });

  static readonly Suv = new BodyType({
    value: "SUV",
    englishName: "SUV",
    localizedName: "Suvkombi",
    rank: 15,
  });

  static readonly Crossover = new BodyType({
    value: "Crossover",
    englishName: "Crossover",
    localizedName: "Crossover",
    rank: 3,
  });

  static readonly Coupe = new BodyType({
    value: "Coupe",
    englishName: "Coupé",
    localizedName: "Coupé",
    rank: 2,
  });

  static readonly Convertible = new BodyType({
    value: "Convertible",
    englishName: "Convertible",
    localizedName: "Cabriolet",
    rank: 1,
  });

  static readonly Roadster = new BodyType({
    value: "Roadster",
    englishName: "Roadster",
    localizedName: "Roadster",
    rank: 14,
  });

  static readonly Mpv = new BodyType({
    value: "MPV",
    englishName: "MPV",
    localizedName: "Familjebuss",
    rank: 8,
  });

  static readonly Minivan = new BodyType({
    value: "Minivan",
    englishName: "Minivan",
    localizedName: "Minivan",
    rank: 10,
  });

  static readonly Van = new BodyType({
    value: "Van",
    englishName: "Van",
    localizedName: "Skåpbil",
    rank: 23,
  });

  static readonly Pickup = new BodyType({
    value: "Pickup",
    englishName: "Pickup",
    localizedName: "Pickup",
    rank: 13,
  });

  static readonly Truck = new BodyType({
    value: "Truck",
    englishName: "Truck",
    localizedName: "Lastbil",
    rank: 22,
  });

  static readonly LightTruck = new BodyType({
    value: "Light truck",
    englishName: "Light truck",
    localizedName: "Lätt lastbil",
    rank: 6,
  });

  static readonly Bus = new BodyType({
    value: "Bus",
    englishName: "Bus",
    localizedName: "Buss",
    rank: 0,
  });

  static readonly Microcar = new BodyType({
    value: "Microcar",
    englishName: "Microcar",
    localizedName: "Mikrobil",
    rank: 9,
  });

  static readonly Limousine = new BodyType({
    value: "Limousine",
    englishName: "Limousine",
    localizedName: "Limousin",
    rank: 7,
  });

  static readonly Targa = new BodyType({
    value: "Targa",
    englishName: "Targa",
    localizedName: "Targa",
    rank: 18,
  });

  static readonly Trailer = new BodyType({
    value: "Trailer",
    englishName: "Trailer",
    localizedName: "Släp",
    rank: 21,
  });

  static readonly Motorhome = new BodyType({
    value: "Motorhome",
    englishName: "Motorhome",
    localizedName: "Husbil",
    rank: 11,
  });

  static readonly Tractor = new BodyType({
    value: "Tractor",
    englishName: "Tractor",
    localizedName: "Traktor",
    rank: 20,
  });

  static readonly Tipper = new BodyType({
    value: "Tipper",
    englishName: "Tipper",
    localizedName: "Tippbil",
    rank: 19,
  });

  static readonly Dumper = new BodyType({
    value: "Dumper",
    englishName: "Dumper",
    localizedName: "Dumper",
    rank: 4,
  });

  static readonly OffRoad = new BodyType({
    value: "Off-road",
    englishName: "Off-road vehicle",
    localizedName: "Terrängbil",
    rank: 12,
  });

  /** All 24 values, in canonical order. */
  static get all(): readonly BodyType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): BodyType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): BodyType {
    const result = BodyType.tryParse(input);
    if (result === null) throw new Error(`Invalid body type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return BodyType.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: BodyTypeFormatOptions): string | null {
    const r = BodyType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: BodyTypeFormatOptions,
  ): string | null {
    const r = BodyType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && BodyType.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
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

  equals(other: BodyType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: BodyType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly BodyType[] = [
  BodyType.Sedan,
  BodyType.Hatchback,
  BodyType.Stationwagon,
  BodyType.Suv,
  BodyType.Crossover,
  BodyType.Coupe,
  BodyType.Convertible,
  BodyType.Roadster,
  BodyType.Mpv,
  BodyType.Minivan,
  BodyType.Van,
  BodyType.Pickup,
  BodyType.Truck,
  BodyType.LightTruck,
  BodyType.Bus,
  BodyType.Microcar,
  BodyType.Limousine,
  BodyType.Targa,
  BodyType.Trailer,
  BodyType.Motorhome,
  BodyType.Tractor,
  BodyType.Tipper,
  BodyType.Dumper,
  BodyType.OffRoad,
];

function fallback(
  input: string | null | undefined,
  options?: BodyTypeFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_/()]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded
    .replaceAll("å", "a")
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("é", "e");
  folded = folded.replace(KEY_PATTERN, "");
  return folded;
}

const ALIASES: readonly (readonly [BodyType, readonly string[]])[] = [
  [BodyType.Sedan, ["saloon", "sedan"]],
  [BodyType.Hatchback, ["3dorrars", "5dorrars", "halvkombi", "hatch", "hatchback"]],
  [BodyType.Stationwagon, ["estate", "herrgardsvagn", "kombi", "stationwagon", "wagon"]],
  [BodyType.Suv, ["sportutilityvehicle", "stadsjeep", "suv", "suvkombi"]],
  [BodyType.Crossover, ["crossover", "crossoversuv", "cuv"]],
  [BodyType.Coupe, ["2doorcoupe", "coupe"]],
  [BodyType.Convertible, ["cabrio", "cabriolet", "convertible", "drophead", "softtop"]],
  [BodyType.Roadster, ["roadster", "spider", "spyder"]],
  [BodyType.Mpv, ["familjebuss", "mpv", "multipurposevehicle", "peoplecarrier"]],
  [BodyType.Minivan, ["minivan", "mpvminivan"]],
  [BodyType.Van, ["cargovan", "skapbil", "transportbil", "van"]],
  [BodyType.Pickup, ["flatbedpickup", "pickup", "pickupbil"]],
  [BodyType.Truck, ["heavytruck", "hgv", "lastbil", "lorry", "truck", "tunglastbil"]],
  [BodyType.LightTruck, ["lattlastbil", "lcv", "lightcommercialvehicle", "lighttruck", "n1"]],
  [BodyType.Bus, ["bus", "buss", "coach", "minibus", "minibuss"]],
  [BodyType.Microcar, ["microcar", "mikrobil", "mopedbil", "quadricycle"]],
  [BodyType.Limousine, ["limo", "limousin", "limousine", "stretch"]],
  [BodyType.Targa, ["targa", "targatop"]],
  [BodyType.Trailer, ["pahangsvagn", "semitrailer", "slap", "slapkarra", "slapvagn", "trailer"]],
  [BodyType.Motorhome, ["camper", "campervan", "husbil", "motorhome", "recreationalvehicle", "rv"]],
  [BodyType.Tractor, ["farmtractor", "jordbrukstraktor", "lantbrukstraktor", "tractor", "traktor"]],
  [BodyType.Tipper, ["dumptruck", "tippbil", "tipper", "tippertruck", "tipplastbil"]],
  [
    BodyType.Dumper,
    ["adt", "articulateddumper", "articulateddumptruck", "bergsdumper", "dumper", "ramstyrddumper"],
  ],
  [
    BodyType.OffRoad,
    ["offroad", "offroader", "offroadvehicle", "orv", "terrangbil", "terrangfordon"],
  ],
];

const LOOKUP = new Map<string, BodyType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
