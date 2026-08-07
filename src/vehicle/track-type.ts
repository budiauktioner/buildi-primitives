import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface TrackTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface TrackTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/**
 * The track (continuous tread) material/construction used on tracked vehicles (`bandtyp`) such
 * as excavators, dumpers, snow groomers, and military vehicles, e.g. `Steel`, `Rubber`,
 * `Polyurethane`, `Half-track`.
 */
export class TrackType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Track Type",
    localizedName: "Bandtyp",
    emoji: "🚜",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Continuous_track"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: TrackTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly Steel = new TrackType({
    value: "Steel",
    englishName: "Steel tracks",
    localizedName: "Stålband",
    rank: 5,
  });

  static readonly Rubber = new TrackType({
    value: "Rubber",
    englishName: "Rubber tracks",
    localizedName: "Gummiband",
    rank: 3,
  });

  static readonly Polyurethane = new TrackType({
    value: "Polyurethane",
    englishName: "Polyurethane tracks",
    localizedName: "Polyuretanband",
    rank: 2,
  });

  static readonly RubberPad = new TrackType({
    value: "Rubber pad",
    englishName: "Steel tracks with rubber pads",
    localizedName: "Stålband med gummiplattor",
    rank: 4,
  });

  static readonly HalfTrack = new TrackType({
    value: "Half-track",
    englishName: "Half-track",
    localizedName: "Halvband",
    rank: 1,
  });

  static readonly Composite = new TrackType({
    value: "Composite",
    englishName: "Composite tracks",
    localizedName: "Kompositband",
    rank: 0,
  });

  /** All 6 values, in canonical order. */
  static get all(): readonly TrackType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): TrackType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): TrackType {
    const result = TrackType.tryParse(input);
    if (result === null) throw new Error(`Invalid track type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return TrackType.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: TrackTypeFormatOptions): string | null {
    const r = TrackType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: TrackTypeFormatOptions,
  ): string | null {
    const r = TrackType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && TrackType.normalize(input) === input;
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

  equals(other: TrackType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: TrackType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly TrackType[] = [
  TrackType.Steel,
  TrackType.Rubber,
  TrackType.Polyurethane,
  TrackType.RubberPad,
  TrackType.HalfTrack,
  TrackType.Composite,
];

function fallback(
  input: string | null | undefined,
  options?: TrackTypeFormatOptions,
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

const ALIASES: readonly (readonly [TrackType, readonly string[]])[] = [
  [TrackType.Steel, ["stal", "stalband", "steel", "steeltrack", "steeltracks"]],
  [
    TrackType.Rubber,
    ["gummi", "gummiband", "gummibandsutrustad", "rubber", "rubbertrack", "rubbertracks"],
  ],
  [
    TrackType.Polyurethane,
    ["polyuretan", "polyuretanband", "polyurethane", "polyurethanetracks", "pu"],
  ],
  [
    TrackType.RubberPad,
    [
      "pad",
      "rubberpad",
      "stalbandmedgummiplattor",
      "stalmedgummiplattor",
      "steeltrackswithrubberpads",
      "steelwithrubberpads",
    ],
  ],
  [TrackType.HalfTrack, ["halftrack", "halvband", "halvbandvagn"]],
  [TrackType.Composite, ["composite", "compositetracks", "kompositband", "kompositmaterial"]],
];

const LOOKUP = new Map<string, TrackType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
