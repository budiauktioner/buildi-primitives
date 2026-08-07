import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface DrivetrainTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface DrivetrainTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly drivenAxleCount: number;
  readonly rank: number;
}

/**
 * Drivetrain layout (`drivning`) of a road vehicle, e.g. `AWD` (all-wheel drive,
 * `fyrhjulsdrift`), `FWD` (front-wheel drive, `framhjulsdrift`), or `RWD` (rear-wheel drive,
 * `bakhjulsdrift`).
 */
export class DrivetrainType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Drivetrain Type",
    localizedName: "Drivning",
    emoji: "🚗",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Drive_wheel",
      "https://en.wikipedia.org/wiki/All-wheel_drive",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly drivenAxleCount: number;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: DrivetrainTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.drivenAxleCount = def.drivenAxleCount;
    this.rank = def.rank;
  }

  static readonly Awd = new DrivetrainType({
    value: "AWD",
    englishName: "All-wheel drive",
    localizedName: "Fyrhjulsdrift",
    drivenAxleCount: 2,
    rank: 0,
  });

  static readonly Fwd = new DrivetrainType({
    value: "FWD",
    englishName: "Front-wheel drive",
    localizedName: "Framhjulsdrift",
    drivenAxleCount: 1,
    rank: 1,
  });

  static readonly Rwd = new DrivetrainType({
    value: "RWD",
    englishName: "Rear-wheel drive",
    localizedName: "Bakhjulsdrift",
    drivenAxleCount: 1,
    rank: 2,
  });

  /** All 3 values, in canonical order. */
  static get all(): readonly DrivetrainType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): DrivetrainType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): DrivetrainType {
    const result = DrivetrainType.tryParse(input);
    if (result === null) throw new Error(`Invalid drivetrain type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return DrivetrainType.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: DrivetrainTypeFormatOptions,
  ): string | null {
    const r = DrivetrainType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: DrivetrainTypeFormatOptions,
  ): string | null {
    const r = DrivetrainType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && DrivetrainType.normalize(input) === input;
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

  equals(other: DrivetrainType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: DrivetrainType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly DrivetrainType[] = [DrivetrainType.Awd, DrivetrainType.Fwd, DrivetrainType.Rwd];

function fallback(
  input: string | null | undefined,
  options?: DrivetrainTypeFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_/]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return folded;
}

const ALIASES: readonly (readonly [DrivetrainType, readonly string[]])[] = [
  [
    DrivetrainType.Awd,
    [
      "4matic",
      "4motion",
      "4wd",
      "4x4",
      "allwheeldrive",
      "awd",
      "awdsystem",
      "fourwheeldrive",
      "fyrahjul",
      "fyrhjul",
      "fyrhjulsdrift",
      "fyrhjulsdriven",
      "fyrhjulsdrivet",
      "quattro",
      "sawc",
      "symmetricalawd",
      "twincharger",
      "xdrive",
    ],
  ],
  [
    DrivetrainType.Fwd,
    [
      "2wdfront",
      "framdrift",
      "framhjul",
      "framhjulsdrift",
      "framhjulsdriven",
      "framhjulsdrivet",
      "frontdrive",
      "frontwheeldrive",
      "fwd",
    ],
  ],
  [
    DrivetrainType.Rwd,
    [
      "2wdrear",
      "bakdrift",
      "bakhjul",
      "bakhjulsdrift",
      "bakhjulsdriven",
      "bakhjulsdrivet",
      "reardrive",
      "rearwheeldrive",
      "rwd",
    ],
  ],
];

const LOOKUP = new Map<string, DrivetrainType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
