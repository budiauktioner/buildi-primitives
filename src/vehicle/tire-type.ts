import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface TireTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface TireTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/**
 * A tire season/intended-use category (`däcktyp`), e.g. `Summer`, `Winter (studded)`, `Winter
 * (friction)`, `All-season`.
 */
export class TireType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Tire Type",
    localizedName: "Däcktyp",
    emoji: "🛞",
    sources: Object.freeze([
      "https://www.transportstyrelsen.se/sv/vagtrafik/Fordon/Fordonsregler/Vinterdack/",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: TireTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly Summer = new TireType({
    value: "Summer",
    englishName: "Summer",
    localizedName: "Sommardäck",
    rank: 6,
  });

  static readonly WinterStudded = new TireType({
    value: "Winter (studded)",
    englishName: "Winter (studded)",
    localizedName: "Vinterdäck (dubb)",
    rank: 9,
  });

  static readonly WinterFriction = new TireType({
    value: "Winter (friction)",
    englishName: "Winter (friction)",
    localizedName: "Vinterdäck (friktion)",
    rank: 8,
  });

  static readonly AllSeason = new TireType({
    value: "All-season",
    englishName: "All-season",
    localizedName: "Helårsdäck",
    rank: 1,
  });

  static readonly AllTerrain = new TireType({
    value: "All-terrain",
    englishName: "All-terrain",
    localizedName: "Terrängdäck",
    rank: 2,
  });

  static readonly MudTerrain = new TireType({
    value: "Mud-terrain",
    englishName: "Mud-terrain",
    localizedName: "Lerdäck",
    rank: 4,
  });

  static readonly Track = new TireType({
    value: "Track",
    englishName: "Track / racing",
    localizedName: "Bandäck / racing",
    rank: 7,
  });

  static readonly Industrial = new TireType({
    value: "Industrial",
    englishName: "Industrial",
    localizedName: "Industridäck",
    rank: 3,
  });

  static readonly Agricultural = new TireType({
    value: "Agricultural",
    englishName: "Agricultural",
    localizedName: "Lantbruksdäck",
    rank: 0,
  });

  static readonly Spare = new TireType({
    value: "Spare",
    englishName: "Spare / temporary",
    localizedName: "Reservdäck",
    rank: 5,
  });

  /** All 10 values, in canonical order. */
  static get all(): readonly TireType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): TireType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): TireType {
    const result = TireType.tryParse(input);
    if (result === null) throw new Error(`Invalid tire type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return TireType.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: TireTypeFormatOptions): string | null {
    const r = TireType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: TireTypeFormatOptions,
  ): string | null {
    const r = TireType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && TireType.normalize(input) === input;
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

  equals(other: TireType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: TireType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly TireType[] = [
  TireType.Summer,
  TireType.WinterStudded,
  TireType.WinterFriction,
  TireType.AllSeason,
  TireType.AllTerrain,
  TireType.MudTerrain,
  TireType.Track,
  TireType.Industrial,
  TireType.Agricultural,
  TireType.Spare,
];

function fallback(
  input: string | null | undefined,
  options?: TireTypeFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_/()]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return folded;
}

const ALIASES: readonly (readonly [TireType, readonly string[]])[] = [
  [TireType.Summer, ["sommar", "sommardack", "summer", "summertires"]],
  [
    TireType.WinterStudded,
    [
      "dubbadevinterdack",
      "dubbdack",
      "studded",
      "studdedwinter",
      "vinterdackdubb",
      "vinterdackdubbade",
      "winterstudded",
    ],
  ],
  [
    TireType.WinterFriction,
    [
      "friction",
      "friktionsdack",
      "nordicwinter",
      "odubbadevinterdack",
      "studlesswinter",
      "vinterdackfriktion",
      "winterfriction",
    ],
  ],
  [TireType.AllSeason, ["allroundsdack", "allseason", "allweather", "helar", "helarsdack"]],
  [TireType.AllTerrain, ["allterrain", "at", "offroad", "terrangdack"]],
  [TireType.MudTerrain, ["lerdack", "mt", "mudterrain"]],
  [TireType.Track, ["bandack", "bandackracing", "racing", "slick", "track", "trackracing"]],
  [TireType.Industrial, ["industri", "industrial", "industridack", "massivdack", "solidtire"]],
  [TireType.Agricultural, ["agricultural", "lantbruk", "lantbruksdack", "tractor", "traktordack"]],
  [TireType.Spare, ["donut", "reservdack", "reservhjul", "spare", "sparetemporary", "sparewheel"]],
];

const LOOKUP = new Map<string, TireType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
