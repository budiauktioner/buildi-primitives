import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface FuelConsumptionNormFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface FuelConsumptionNormDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly region: string;
  readonly rank: number;
}

/**
 * A regulatory test cycle / norm under which fuel consumption (and CO₂) is measured for
 * vehicles (`förbrukningsnorm`), e.g. `NEDC`, `WLTP`, `EPA`.
 */
export class FuelConsumptionNorm {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Fuel Consumption Norm",
    localizedName: "Förbrukningsnorm",
    emoji: "🧪",
    sources: Object.freeze([
      "https://unece.org/transport/vehicle-regulations",
      "https://www.epa.gov/fueleconomy",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly region: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: FuelConsumptionNormDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.region = def.region;
    this.rank = def.rank;
  }

  static readonly Nedc = new FuelConsumptionNorm({
    value: "NEDC",
    englishName: "New European Driving Cycle",
    localizedName: "NEDC-cykel",
    region: "EU",
    rank: 3,
  });

  static readonly Wltp = new FuelConsumptionNorm({
    value: "WLTP",
    englishName: "Worldwide Harmonised Light Vehicles Test Procedure",
    localizedName: "WLTP-cykel",
    region: "EU/Worldwide",
    rank: 6,
  });

  static readonly Wltc = new FuelConsumptionNorm({
    value: "WLTC",
    englishName: "Worldwide Harmonised Light Vehicles Test Cycle",
    localizedName: "WLTC-cykel",
    region: "Worldwide",
    rank: 5,
  });

  static readonly Epa = new FuelConsumptionNorm({
    value: "EPA",
    englishName: "EPA fuel economy estimate",
    localizedName: "EPA-cykel",
    region: "US",
    rank: 1,
  });

  static readonly Jc08 = new FuelConsumptionNorm({
    value: "JC08",
    englishName: "JC08 driving cycle",
    localizedName: "JC08-cykel",
    region: "Japan",
    rank: 2,
  });

  static readonly Cltc = new FuelConsumptionNorm({
    value: "CLTC",
    englishName: "China Light-duty vehicle Test Cycle",
    localizedName: "CLTC-cykel",
    region: "China",
    rank: 0,
  });

  static readonly Unknown = new FuelConsumptionNorm({
    value: "Unknown",
    englishName: "Unknown",
    localizedName: "Okänd",
    region: "Unspecified",
    rank: 4,
  });

  /** All 7 values, in canonical order. */
  static get all(): readonly FuelConsumptionNorm[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.value;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): FuelConsumptionNorm | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): FuelConsumptionNorm {
    const result = FuelConsumptionNorm.tryParse(input);
    if (result === null) throw new Error(`Invalid fuel consumption norm.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return FuelConsumptionNorm.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: FuelConsumptionNormFormatOptions,
  ): string | null {
    const r = FuelConsumptionNorm.tryParse(input);
    if (r !== null) return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.value;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: FuelConsumptionNormFormatOptions,
  ): string | null {
    const r = FuelConsumptionNorm.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && FuelConsumptionNorm.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.value;
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

  equals(other: FuelConsumptionNorm | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: FuelConsumptionNorm | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly FuelConsumptionNorm[] = [
  FuelConsumptionNorm.Nedc,
  FuelConsumptionNorm.Wltp,
  FuelConsumptionNorm.Wltc,
  FuelConsumptionNorm.Epa,
  FuelConsumptionNorm.Jc08,
  FuelConsumptionNorm.Cltc,
  FuelConsumptionNorm.Unknown,
];

function fallback(
  input: string | null | undefined,
  options?: FuelConsumptionNormFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return folded;
}

const ALIASES: readonly (readonly [FuelConsumptionNorm, readonly string[]])[] = [
  [FuelConsumptionNorm.Nedc, ["nedc", "nedccykel", "neweuropeandrivingcycle"]],
  [
    FuelConsumptionNorm.Wltp,
    [
      "wltp",
      "wltpcycle",
      "wltpcykel",
      "wltpcykeln",
      "worldwideharmonisedlightvehiclestestprocedure",
    ],
  ],
  [
    FuelConsumptionNorm.Wltc,
    ["wltc", "wltccycle", "wltccykel", "worldwideharmonisedlightvehiclestestcycle"],
  ],
  [
    FuelConsumptionNorm.Epa,
    ["epa", "epacykel", "epaestimate", "epafueleconomy", "epafueleconomyestimate"],
  ],
  [FuelConsumptionNorm.Jc08, ["jc08", "jc08cykel", "jc08drivingcycle"]],
  [FuelConsumptionNorm.Cltc, ["chinalightdutyvehicletestcycle", "cltc", "cltccykel"]],
  [FuelConsumptionNorm.Unknown, ["n/a", "okand", "unknown", "unspecified"]],
];

const LOOKUP = new Map<string, FuelConsumptionNorm>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
