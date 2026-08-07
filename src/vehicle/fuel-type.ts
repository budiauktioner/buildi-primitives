import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface FuelTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface FuelTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly code: string;
  readonly rank: number;
}

/**
 * A vehicle fuel or energy type (`drivmedel`) with canonical English identifier, Swedish
 * display name, and Transportstyrelsen code.
 */
export class FuelType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Fuel Type",
    localizedName: "Drivmedel",
    emoji: "⛽",
    sources: Object.freeze([
      "https://www.transportstyrelsen.se/",
      "https://www.energimyndigheten.se/",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly code: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: FuelTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.code = def.code;
    this.rank = def.rank;
  }

  static readonly Petrol = new FuelType({
    value: "Petrol",
    englishName: "Petrol",
    localizedName: "Bensin",
    code: "BE",
    rank: 0,
  });

  static readonly Diesel = new FuelType({
    value: "Diesel",
    englishName: "Diesel",
    localizedName: "Diesel",
    code: "DI",
    rank: 1,
  });

  static readonly Electric = new FuelType({
    value: "Electric",
    englishName: "Electric",
    localizedName: "El",
    code: "EL",
    rank: 2,
  });

  static readonly Ethanol = new FuelType({
    value: "Ethanol",
    englishName: "Ethanol",
    localizedName: "Etanol",
    code: "ET",
    rank: 3,
  });

  static readonly NaturalGas = new FuelType({
    value: "Natural gas",
    englishName: "Natural gas",
    localizedName: "Naturgas",
    code: "CNG",
    rank: 4,
  });

  static readonly Lpg = new FuelType({
    value: "LPG",
    englishName: "LPG",
    localizedName: "Gasol",
    code: "LPG",
    rank: 5,
  });

  static readonly Hybrid = new FuelType({
    value: "Hybrid",
    englishName: "Hybrid",
    localizedName: "Elhybrid",
    code: "HEV",
    rank: 6,
  });

  static readonly MildHybrid = new FuelType({
    value: "Mild hybrid",
    englishName: "Mild hybrid",
    localizedName: "Mildhybrid",
    code: "MHEV",
    rank: 7,
  });

  static readonly PlugInHybrid = new FuelType({
    value: "Plug-in hybrid",
    englishName: "Plug-in hybrid",
    localizedName: "Laddhybrid",
    code: "PHEV",
    rank: 8,
  });

  static readonly Hydrogen = new FuelType({
    value: "Hydrogen",
    englishName: "Hydrogen",
    localizedName: "Vätgas",
    code: "H2",
    rank: 9,
  });

  static readonly Biodiesel = new FuelType({
    value: "Biodiesel",
    englishName: "Biodiesel",
    localizedName: "Biodiesel",
    code: "BIO",
    rank: 10,
  });

  static readonly Methane = new FuelType({
    value: "Methane",
    englishName: "Methane",
    localizedName: "Metangas",
    code: "MET",
    rank: 11,
  });

  static readonly Methanol = new FuelType({
    value: "Methanol",
    englishName: "Methanol",
    localizedName: "Metanol",
    code: "M85",
    rank: 12,
  });

  static readonly Hvo = new FuelType({
    value: "HVO",
    englishName: "HVO",
    localizedName: "HVO",
    code: "HVO",
    rank: 13,
  });

  static readonly Kerosene = new FuelType({
    value: "Kerosene",
    englishName: "Kerosene",
    localizedName: "Fotogen",
    code: "FO",
    rank: 14,
  });

  static readonly Other = new FuelType({
    value: "Other",
    englishName: "Other",
    localizedName: "Annat",
    code: "ÖVR",
    rank: 15,
  });

  /** All 16 values, in canonical order. */
  static get all(): readonly FuelType[] {
    return ALL;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): FuelType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): FuelType {
    const result = FuelType.tryParse(input);
    if (result === null) throw new Error(`Invalid fuel type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return FuelType.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: FuelTypeFormatOptions): string | null {
    const r = FuelType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: FuelTypeFormatOptions,
  ): string | null {
    const r = FuelType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && FuelType.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  equals(other: FuelType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: FuelType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly FuelType[] = [
  FuelType.Petrol,
  FuelType.Diesel,
  FuelType.Electric,
  FuelType.Ethanol,
  FuelType.NaturalGas,
  FuelType.Lpg,
  FuelType.Hybrid,
  FuelType.MildHybrid,
  FuelType.PlugInHybrid,
  FuelType.Hydrogen,
  FuelType.Biodiesel,
  FuelType.Methane,
  FuelType.Methanol,
  FuelType.Hvo,
  FuelType.Kerosene,
  FuelType.Other,
];

function fallback(
  input: string | null | undefined,
  options?: FuelTypeFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-/]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replace(KEY_PATTERN, " ");
  return folded.trim();
}

const ALIASES: readonly (readonly [FuelType, readonly string[]])[] = [
  [
    FuelType.Petrol,
    ["95", "98", "be", "bensin", "blyfri", "blyfri bensin", "gas", "gasoline", "petrol"],
  ],
  [FuelType.Diesel, ["di", "diesel", "dieselbränsle", "dieselolja"]],
  [
    FuelType.Electric,
    ["battery electric", "bev", "el", "elbil", "electric", "elektrisk", "elmotor"],
  ],
  [FuelType.Ethanol, ["e85", "et", "etanol", "ethanol", "ffv", "flex fuel", "flexifuel"]],
  [
    FuelType.NaturalGas,
    [
      "cng",
      "compressed natural gas",
      "fordonsgas",
      "komprimerad naturgas",
      "natural gas",
      "naturgas",
      "ngv",
    ],
  ],
  [
    FuelType.Lpg,
    ["autogas", "flytande gas", "gasol", "liquefied petroleum gas", "lpg", "motorgas", "propan"],
  ],
  [
    FuelType.Hybrid,
    ["bensin el", "elhybrid", "fhev", "full hybrid", "hev", "hybrid", "hybrid electric"],
  ],
  [FuelType.MildHybrid, ["48v", "48v hybrid", "mhev", "mild hybrid", "mildhybrid"]],
  [FuelType.PlugInHybrid, ["laddbar hybrid", "laddhybrid", "phev", "plug in", "plug in hybrid"]],
  [
    FuelType.Hydrogen,
    ["bränslecell", "fcev", "fuel cell", "h2", "hydrogen", "vätgas", "vätgasbil"],
  ],
  [FuelType.Biodiesel, ["b100", "bio", "biodiesel", "fame", "rme"]],
  [
    FuelType.Methane,
    ["biogas", "biometan", "cbg", "flytande biogas", "lbg", "met", "metan", "metangas", "methane"],
  ],
  [FuelType.Methanol, ["m85", "metanol", "methanol"]],
  [FuelType.Hvo, ["förnybar diesel", "hvo", "hvo100", "hydrotreated vegetable oil"]],
  [FuelType.Kerosene, ["fo", "fotogen", "kerosene", "paraffin"]],
  [FuelType.Other, ["annat", "other", "övr", "övrig", "övrigt"]],
];

const LOOKUP = new Map<string, FuelType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
