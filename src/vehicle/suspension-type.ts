import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface SuspensionTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface SuspensionTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly rank: number;
}

/**
 * A vehicle suspension/damping technology (`fjädring`), e.g. `Coil spring`, `Leaf spring`,
 * `Air`, `Hydropneumatic`, `Torsion bar`.
 */
export class SuspensionType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Suspension Type",
    localizedName: "Fjädring",
    emoji: "🛞",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Car_suspension"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: SuspensionTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.rank = def.rank;
  }

  static readonly CoilSpring = new SuspensionType({
    value: "Coil spring",
    englishName: "Coil spring",
    localizedName: "Spiralfjäder",
    rank: 6,
  });

  static readonly LeafSpring = new SuspensionType({
    value: "Leaf spring",
    englishName: "Leaf spring",
    localizedName: "Bladfjäder",
    rank: 10,
  });

  static readonly Air = new SuspensionType({
    value: "Air",
    englishName: "Air suspension",
    localizedName: "Luftfjädring",
    rank: 1,
  });

  static readonly AirAir = new SuspensionType({
    value: "Air/Air",
    englishName: "Air/Air",
    localizedName: "Luft/Luft",
    rank: 2,
  });

  static readonly AirLeaf = new SuspensionType({
    value: "Air/Leaf",
    englishName: "Air/Leaf",
    localizedName: "Luft/Blad",
    rank: 3,
  });

  static readonly LeafLeaf = new SuspensionType({
    value: "Leaf/Leaf",
    englishName: "Leaf/Leaf",
    localizedName: "Blad/Blad",
    rank: 11,
  });

  static readonly Parabolic = new SuspensionType({
    value: "Parabolic",
    englishName: "Parabolic leaf spring",
    localizedName: "Parabolfjäder",
    rank: 15,
  });

  static readonly AirFront = new SuspensionType({
    value: "AirFront",
    englishName: "Air front",
    localizedName: "Luftfjädring fram",
    rank: 4,
  });

  static readonly AirRear = new SuspensionType({
    value: "AirRear",
    englishName: "Air rear",
    localizedName: "Luftfjädring bak",
    rank: 5,
  });

  static readonly Hydropneumatic = new SuspensionType({
    value: "Hydropneumatic",
    englishName: "Hydropneumatic",
    localizedName: "Hydropneumatisk",
    rank: 8,
  });

  static readonly TorsionBar = new SuspensionType({
    value: "Torsion bar",
    englishName: "Torsion bar",
    localizedName: "Torsionsstav",
    rank: 18,
  });

  static readonly Adaptive = new SuspensionType({
    value: "Adaptive",
    englishName: "Adaptive",
    localizedName: "Adaptiv",
    rank: 0,
  });

  static readonly MagneticRide = new SuspensionType({
    value: "Magnetic ride",
    englishName: "Magnetic ride",
    localizedName: "Magnetisk fjädring",
    rank: 13,
  });

  static readonly Independent = new SuspensionType({
    value: "Independent",
    englishName: "Independent",
    localizedName: "Individuell hjulupphängning",
    rank: 9,
  });

  static readonly MacPherson = new SuspensionType({
    value: "MacPherson strut",
    englishName: "MacPherson strut",
    localizedName: "MacPherson-fjäderben",
    rank: 12,
  });

  static readonly DoubleWishbone = new SuspensionType({
    value: "Double wishbone",
    englishName: "Double wishbone",
    localizedName: "Dubbla A-armar",
    rank: 7,
  });

  static readonly MultiLink = new SuspensionType({
    value: "Multi-link",
    englishName: "Multi-link",
    localizedName: "Multilänk",
    rank: 14,
  });

  static readonly SolidAxle = new SuspensionType({
    value: "Solid axle",
    englishName: "Solid axle",
    localizedName: "Stel axel",
    rank: 17,
  });

  static readonly Rigid = new SuspensionType({
    value: "Rigid",
    englishName: "Rigid (unsprung)",
    localizedName: "Stel (utan fjädring)",
    rank: 16,
  });

  /** All 19 values, in canonical order. */
  static get all(): readonly SuspensionType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): SuspensionType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): SuspensionType {
    const result = SuspensionType.tryParse(input);
    if (result === null) throw new Error(`Invalid suspension type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return SuspensionType.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: SuspensionTypeFormatOptions,
  ): string | null {
    const r = SuspensionType.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: SuspensionTypeFormatOptions,
  ): string | null {
    const r = SuspensionType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SuspensionType.normalize(input) === input;
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

  equals(other: SuspensionType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: SuspensionType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly SuspensionType[] = [
  SuspensionType.CoilSpring,
  SuspensionType.LeafSpring,
  SuspensionType.Air,
  SuspensionType.AirAir,
  SuspensionType.AirLeaf,
  SuspensionType.LeafLeaf,
  SuspensionType.Parabolic,
  SuspensionType.AirFront,
  SuspensionType.AirRear,
  SuspensionType.Hydropneumatic,
  SuspensionType.TorsionBar,
  SuspensionType.Adaptive,
  SuspensionType.MagneticRide,
  SuspensionType.Independent,
  SuspensionType.MacPherson,
  SuspensionType.DoubleWishbone,
  SuspensionType.MultiLink,
  SuspensionType.SolidAxle,
  SuspensionType.Rigid,
];

function fallback(
  input: string | null | undefined,
  options?: SuspensionTypeFormatOptions,
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

const ALIASES: readonly (readonly [SuspensionType, readonly string[]])[] = [
  [SuspensionType.CoilSpring, ["coil", "coilspring", "fjader", "skruvfjader", "spiralfjader"]],
  [SuspensionType.LeafSpring, ["blad", "bladfjader", "leaf", "leafspring"]],
  [
    SuspensionType.Air,
    [
      "air",
      "airspring",
      "airsuspension",
      "balg",
      "bellow",
      "luft",
      "luftfjader",
      "luftfjadring",
      "pneumatic",
    ],
  ],
  [SuspensionType.AirAir, ["airair", "luftluft"]],
  [SuspensionType.AirLeaf, ["airleaf", "luftblad"]],
  [SuspensionType.LeafLeaf, ["bladblad", "leafleaf"]],
  [
    SuspensionType.Parabolic,
    [
      "parabol",
      "parabolfjader",
      "parabolic",
      "parabolicleaf",
      "parabolicleafspring",
      "parabolicspring",
      "paraboll",
    ],
  ],
  [SuspensionType.AirFront, ["airfront", "luftfjadringfram", "luftfram"]],
  [SuspensionType.AirRear, ["airrear", "luftbak", "luftfjadringbak"]],
  [SuspensionType.Hydropneumatic, ["hydraulic", "hydraulisk", "hydropneumatic", "hydropneumatisk"]],
  [SuspensionType.TorsionBar, ["torsion", "torsionbar", "torsionsfjader", "torsionsstav"]],
  [
    SuspensionType.Adaptive,
    ["activesuspension", "adaptiv", "adaptive", "adaptivedamping", "aktivfjadring"],
  ],
  [
    SuspensionType.MagneticRide,
    ["magneride", "magneticride", "magnetiskfjadring", "magnetorheological"],
  ],
  [
    SuspensionType.Independent,
    ["independent", "independentrearsuspension", "individuellhjulupphangning", "irs"],
  ],
  [
    SuspensionType.MacPherson,
    ["macpherson", "macphersonfjaderben", "macphersonstrut", "mcpherson"],
  ],
  [SuspensionType.DoubleWishbone, ["aarms", "doublewishbone", "dubblaaarmar", "wishbone"]],
  [SuspensionType.MultiLink, ["multilank", "multilink"]],
  [SuspensionType.SolidAxle, ["beamaxle", "liveaxle", "solidaxle", "stelaxel", "stelbakaxel"]],
  [SuspensionType.Rigid, ["ofjadrad", "rigid", "rigidunsprung", "stelutanfjadring", "unsprung"]],
];

const LOOKUP = new Map<string, SuspensionType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
