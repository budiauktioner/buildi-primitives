import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface TransmissionTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface TransmissionTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/** A vehicle transmission/gearbox type (`växellåda`). */
export class TransmissionType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Transmission Type",
    localizedName: "Växellåda",
    emoji: "⚙️",
    sources: Object.freeze(["https://www.transportstyrelsen.se/"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: TransmissionTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly Manual = new TransmissionType({
    value: "Manual",
    englishName: "Manual",
    localizedName: "Manuell",
    rank: 4,
  });

  static readonly Automatic = new TransmissionType({
    value: "Automatic",
    englishName: "Automatic",
    localizedName: "Automat",
    rank: 1,
  });

  static readonly Cvt = new TransmissionType({
    value: "CVT",
    englishName: "CVT",
    localizedName: "CVT",
    rank: 2,
  });

  static readonly DualClutch = new TransmissionType({
    value: "Dual clutch",
    englishName: "Dual clutch",
    localizedName: "Dubbelkoppling",
    rank: 3,
  });

  static readonly Sequential = new TransmissionType({
    value: "Sequential",
    englishName: "Sequential",
    localizedName: "Sekventiell",
    rank: 6,
  });

  static readonly SemiAutomatic = new TransmissionType({
    value: "Semi-automatic",
    englishName: "Semi-automatic",
    localizedName: "Halvautomatisk",
    rank: 5,
  });

  static readonly Amt = new TransmissionType({
    value: "AMT",
    englishName: "AMT",
    localizedName: "AMT",
    rank: 0,
  });

  /** All 7 values, in canonical order. */
  static get all(): readonly TransmissionType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): TransmissionType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): TransmissionType {
    const result = TransmissionType.tryParse(input);
    if (result === null) throw new Error(`Invalid transmission type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return TransmissionType.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: TransmissionTypeFormatOptions,
  ): string | null {
    const r = TransmissionType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: TransmissionTypeFormatOptions,
  ): string | null {
    const r = TransmissionType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && TransmissionType.normalize(input) === input;
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

  equals(other: TransmissionType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: TransmissionType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly TransmissionType[] = [
  TransmissionType.Manual,
  TransmissionType.Automatic,
  TransmissionType.Cvt,
  TransmissionType.DualClutch,
  TransmissionType.Sequential,
  TransmissionType.SemiAutomatic,
  TransmissionType.Amt,
];

function fallback(
  input: string | null | undefined,
  options?: TransmissionTypeFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-/]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, " ");
  return folded.trim();
}

const ALIASES: readonly (readonly [TransmissionType, readonly string[]])[] = [
  [
    TransmissionType.Manual,
    [
      "handvaxel",
      "handvaxlad",
      "m t",
      "manual",
      "manuell",
      "manuell manual",
      "manuell vaxellada",
      "standard",
      "stick",
    ],
  ],
  [
    TransmissionType.Automatic,
    [
      "a t",
      "auto",
      "automat",
      "automatic",
      "automatiserad",
      "automatisk",
      "automatisk vaxellada",
      "automatvaxlad",
      "momentomvandlare",
      "tiptronic",
      "torque converter",
    ],
  ],
  [
    TransmissionType.Cvt,
    [
      "continuously variable",
      "cvt",
      "e cvt",
      "lineartronic",
      "multitronic",
      "steglos",
      "variator",
      "variomatic",
      "xtronic",
    ],
  ],
  [
    TransmissionType.DualClutch,
    [
      "dct",
      "dsg",
      "dual clutch",
      "dubbelkoppling",
      "dubbelkopplingslada",
      "edc",
      "pdk",
      "powershift",
      "s tronic",
      "twinclutch",
    ],
  ],
  [
    TransmissionType.Sequential,
    ["sekvensiell", "sekventiell", "sekventiell vaxellada", "sequential", "smg"],
  ],
  [
    TransmissionType.SemiAutomatic,
    [
      "automated manual",
      "halvautomatisk",
      "halvautomatvaxlad",
      "semi automat",
      "semi automatic",
      "semi automatisk",
    ],
  ],
  [
    TransmissionType.Amt,
    [
      "amt",
      "automated manual transmission",
      "automatiserad manuell",
      "easytronic",
      "imt",
      "robotized",
    ],
  ],
];

const LOOKUP = new Map<string, TransmissionType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
