import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface PowerSourceFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface PowerSourceDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly isElectric: boolean;
  readonly isCombustion: boolean;
  readonly requiresFuel: boolean;
  readonly rank: number;
}

/**
 * Power source (`strömkälla` / `drivkälla`) of a device, machine, or appliance, e.g.
 * `Electric`, `Battery`, `Diesel`, `Petrol`, `Hybrid`, `Manual`.
 */
export class PowerSource {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Power Source",
    localizedName: "Strömkälla",
    emoji: "🔌",
    sources: Object.freeze([
      "https://schema.org/PowerSupplySpecification",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly isElectric: boolean;
  readonly isCombustion: boolean;
  readonly requiresFuel: boolean;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: PowerSourceDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.isElectric = def.isElectric;
    this.isCombustion = def.isCombustion;
    this.requiresFuel = def.requiresFuel;
    this.rank = def.rank;
  }

  static readonly Electric = new PowerSource({
    value: "Electric",
    englishName: "Mains electric",
    localizedName: "El",
    isElectric: true,
    isCombustion: false,
    requiresFuel: false,
    rank: 0,
  });

  static readonly Battery = new PowerSource({
    value: "Battery",
    englishName: "Battery-powered",
    localizedName: "Batteri",
    isElectric: true,
    isCombustion: false,
    requiresFuel: false,
    rank: 1,
  });

  static readonly Solar = new PowerSource({
    value: "Solar",
    englishName: "Solar-powered",
    localizedName: "Solenergi",
    isElectric: true,
    isCombustion: false,
    requiresFuel: false,
    rank: 2,
  });

  static readonly Hybrid = new PowerSource({
    value: "Hybrid",
    englishName: "Hybrid",
    localizedName: "Hybrid",
    isElectric: true,
    isCombustion: true,
    requiresFuel: true,
    rank: 3,
  });

  static readonly Petrol = new PowerSource({
    value: "Petrol",
    englishName: "Petrol",
    localizedName: "Bensin",
    isElectric: false,
    isCombustion: true,
    requiresFuel: true,
    rank: 4,
  });

  static readonly Diesel = new PowerSource({
    value: "Diesel",
    englishName: "Diesel",
    localizedName: "Diesel",
    isElectric: false,
    isCombustion: true,
    requiresFuel: true,
    rank: 5,
  });

  static readonly Hydrogen = new PowerSource({
    value: "Hydrogen",
    englishName: "Hydrogen",
    localizedName: "Vätgas",
    isElectric: true,
    isCombustion: false,
    requiresFuel: true,
    rank: 6,
  });

  static readonly Pneumatic = new PowerSource({
    value: "Pneumatic",
    englishName: "Pneumatic (air)",
    localizedName: "Pneumatisk",
    isElectric: false,
    isCombustion: false,
    requiresFuel: false,
    rank: 7,
  });

  static readonly Hydraulic = new PowerSource({
    value: "Hydraulic",
    englishName: "Hydraulic",
    localizedName: "Hydraulisk",
    isElectric: false,
    isCombustion: false,
    requiresFuel: false,
    rank: 8,
  });

  static readonly Manual = new PowerSource({
    value: "Manual",
    englishName: "Manual",
    localizedName: "Manuell",
    isElectric: false,
    isCombustion: false,
    requiresFuel: false,
    rank: 9,
  });

  /** All 10 values, in canonical order. */
  static get all(): readonly PowerSource[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedName
      : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): PowerSource | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): PowerSource {
    const result = PowerSource.tryParse(input);
    if (result === null) throw new Error(`Invalid power source.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return PowerSource.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: PowerSourceFormatOptions,
  ): string | null {
    const r = PowerSource.tryParse(input);
    if (r !== null) return PrimitivesDefaults.useLocalizedDisplayNames
      ? r.localizedName
      : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: PowerSourceFormatOptions,
  ): string | null {
    const r = PowerSource.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && PowerSource.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedName
      : this.englishName;
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

  equals(other: PowerSource | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: PowerSource | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly PowerSource[] = [
  PowerSource.Electric,
  PowerSource.Battery,
  PowerSource.Solar,
  PowerSource.Hybrid,
  PowerSource.Petrol,
  PowerSource.Diesel,
  PowerSource.Hydrogen,
  PowerSource.Pneumatic,
  PowerSource.Hydraulic,
  PowerSource.Manual,
];

function fallback(
  input: string | null | undefined,
  options?: PowerSourceFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_/().]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return foldOrdinalIgnoreCase(folded);
}

const ALIASES: readonly (readonly [PowerSource, readonly string[]])[] = [
  [
    PowerSource.Electric,
    ["230v", "400v", "corded", "cordedelectric", "el", "eldriven", "electric", "electricity", "elektrisk", "mains", "mainselectric", "mainspowered", "nat", "natansluten", "natstrom", "plugin", "sladdansluten"],
  ],
  [
    PowerSource.Battery,
    ["accu", "batteri", "batteridriven", "battery", "batterypowered", "cordless", "rechargeable", "sladdlos", "uppladdningsbartbatteri"],
  ],
  [
    PowerSource.Solar,
    ["pv", "solar", "solarpower", "solarpowered", "solcell", "soldriven", "solenergi", "solpanel"],
  ],
  [
    PowerSource.Hybrid,
    ["hev", "hybrid", "hybriddrift", "laddhybrid", "mhev", "mildhybrid", "phev", "pluginhybrid"],
  ],
  [
    PowerSource.Petrol,
    ["bensin", "bensindriven", "bensinmotor", "gas", "gasoline", "petrol", "petrolengine"],
  ],
  [
    PowerSource.Diesel,
    ["diesel", "dieseldriven", "dieselengine", "dieselmotor"],
  ],
  [
    PowerSource.Hydrogen,
    ["branslecell", "fcev", "fuelcell", "h2", "hydrogen", "vatgas", "vatgasdriven"],
  ],
  [
    PowerSource.Pneumatic,
    ["airpowered", "compressedair", "komprimeradluft", "pneumatic", "pneumaticair", "pneumatik", "pneumatisk", "tryckluft", "tryckluftsdriven"],
  ],
  [
    PowerSource.Hydraulic,
    ["hydrauldriven", "hydraulic", "hydraulik", "hydraulisk", "hydrauliskt"],
  ],
  [
    PowerSource.Manual,
    ["handdriven", "humanpowered", "manual", "manuell", "manuelldrift", "manuellt", "muskelkraft", "nopower", "pedal", "pedaldriven", "stromlos"],
  ],
];

const LOOKUP = new Map<string, PowerSource>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}
