import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface BoatHullMaterialFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface BoatHullMaterialDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/**
 * The material used for a boat's hull (`skrovmaterial`), e.g. `Glasfiber`, `Aluminium`,
 * `Stål`.
 */
export class BoatHullMaterial {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Boat Hull Material",
    localizedName: "Båt skrovmaterial",
    emoji: "🛥️",
    sources: Object.freeze(["https://www.transportstyrelsen.se/sv/sjofart/Fritidsbatar/"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: BoatHullMaterialDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly Fiberglass = new BoatHullMaterial({
    value: "Fiberglass",
    englishName: "Fiberglass",
    localizedName: "Glasfiber",
    rank: 4,
  });

  static readonly Aluminum = new BoatHullMaterial({
    value: "Aluminum",
    englishName: "Aluminum",
    localizedName: "Aluminium",
    rank: 0,
  });

  static readonly Steel = new BoatHullMaterial({
    value: "Steel",
    englishName: "Steel",
    localizedName: "Stål",
    rank: 7,
  });

  static readonly Wood = new BoatHullMaterial({
    value: "Wood",
    englishName: "Wood",
    localizedName: "Trä",
    rank: 8,
  });

  static readonly Plastic = new BoatHullMaterial({
    value: "Plastic",
    englishName: "Plastic",
    localizedName: "Plast",
    rank: 6,
  });

  static readonly CarbonFiber = new BoatHullMaterial({
    value: "Carbon fiber",
    englishName: "Carbon fiber",
    localizedName: "Kolfiber",
    rank: 1,
  });

  static readonly Inflatable = new BoatHullMaterial({
    value: "Inflatable",
    englishName: "Inflatable PVC/Hypalon",
    localizedName: "Uppblåsbar (PVC/Hypalon)",
    rank: 5,
  });

  static readonly Ferrocement = new BoatHullMaterial({
    value: "Ferrocement",
    englishName: "Ferrocement",
    localizedName: "Cementarmerad",
    rank: 3,
  });

  static readonly Composite = new BoatHullMaterial({
    value: "Composite",
    englishName: "Composite",
    localizedName: "Komposit",
    rank: 2,
  });

  /** All 9 values, in canonical order. */
  static get all(): readonly BoatHullMaterial[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): BoatHullMaterial | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): BoatHullMaterial {
    const result = BoatHullMaterial.tryParse(input);
    if (result === null) throw new Error(`Invalid boat hull material.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return BoatHullMaterial.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: BoatHullMaterialFormatOptions,
  ): string | null {
    const r = BoatHullMaterial.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: BoatHullMaterialFormatOptions,
  ): string | null {
    const r = BoatHullMaterial.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && BoatHullMaterial.normalize(input) === input;
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

  equals(other: BoatHullMaterial | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: BoatHullMaterial | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly BoatHullMaterial[] = [
  BoatHullMaterial.Fiberglass,
  BoatHullMaterial.Aluminum,
  BoatHullMaterial.Steel,
  BoatHullMaterial.Wood,
  BoatHullMaterial.Plastic,
  BoatHullMaterial.CarbonFiber,
  BoatHullMaterial.Inflatable,
  BoatHullMaterial.Ferrocement,
  BoatHullMaterial.Composite,
];

function fallback(
  input: string | null | undefined,
  options?: BoatHullMaterialFormatOptions,
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

const ALIASES: readonly (readonly [BoatHullMaterial, readonly string[]])[] = [
  [
    BoatHullMaterial.Fiberglass,
    [
      "fiberglass",
      "fibreglass",
      "gfk",
      "glasfiber",
      "glasfiberarmeradplast",
      "glasfiberplast",
      "grp",
      "plastbat",
    ],
  ],
  [BoatHullMaterial.Aluminum, ["alu", "aluminium", "aluminum"]],
  [BoatHullMaterial.Steel, ["jarn", "stal", "steel"]],
  [BoatHullMaterial.Wood, ["mahogany", "mahogny", "tra", "wood", "wooden"]],
  [
    BoatHullMaterial.Plastic,
    ["pe", "plast", "plastic", "polyeten", "polyethylene", "roplene", "rotomoulded"],
  ],
  [BoatHullMaterial.CarbonFiber, ["carbon", "carbonfiber", "kol", "kolfiber"]],
  [
    BoatHullMaterial.Inflatable,
    [
      "gummibat",
      "hypalon",
      "inflatable",
      "inflatablepvchypalon",
      "pvc",
      "rib",
      "uppblasbarpvchypalon",
    ],
  ],
  [BoatHullMaterial.Ferrocement, ["cementarmerad", "ferrocement"]],
  [BoatHullMaterial.Composite, ["composite", "komposit", "kompositmaterial"]],
];

const LOOKUP = new Map<string, BoatHullMaterial>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
