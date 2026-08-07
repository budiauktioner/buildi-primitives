import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { Decimal } from "../internal/decimal.js";

/** Options shared by the string-in, string-out helpers. */
export interface BatteryChemistryFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface BatteryChemistryDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly isRechargeable: boolean;
  readonly nominalCellVoltageV: Decimal;
  readonly rank: number;
}

/**
 * The electrochemical chemistry of a battery (`batterikemi`), e.g. `Li-ion`, `LiFePO4`, `AGM`,
 * `Pb-Acid`, `Gel`.
 */
export class BatteryChemistry {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Battery Chemistry",
    localizedName: "Batterikemi",
    emoji: "🔋",
    sources: Object.freeze(["https://www.iec.ch/"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly isRechargeable: boolean;
  readonly nominalCellVoltageV: Decimal;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: BatteryChemistryDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.isRechargeable = def.isRechargeable;
    this.nominalCellVoltageV = def.nominalCellVoltageV;
    this.rank = def.rank;
  }

  static readonly LithiumIon = new BatteryChemistry({
    value: "Li-ion",
    englishName: "Lithium-ion",
    localizedName: "Litium-jon",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("3.7")!,
    rank: 4,
  });

  static readonly LiFePO4 = new BatteryChemistry({
    value: "LiFePO4",
    englishName: "Lithium iron phosphate",
    localizedName: "Litiumjärnfosfat",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("3.2")!,
    rank: 5,
  });

  static readonly LithiumPolymer = new BatteryChemistry({
    value: "LiPo",
    englishName: "Lithium polymer",
    localizedName: "Litium-polymer",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("3.7")!,
    rank: 6,
  });

  static readonly LithiumTitanate = new BatteryChemistry({
    value: "LTO",
    englishName: "Lithium titanate",
    localizedName: "Litium-titanat",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("2.4")!,
    rank: 3,
  });

  static readonly NickelMetalHydride = new BatteryChemistry({
    value: "NiMH",
    englishName: "Nickel-metal hydride",
    localizedName: "Nickel-metallhydrid",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("1.2")!,
    rank: 8,
  });

  static readonly NickelCadmium = new BatteryChemistry({
    value: "NiCd",
    englishName: "Nickel-cadmium",
    localizedName: "Nickel-kadmium",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("1.2")!,
    rank: 7,
  });

  static readonly FloodedLeadAcid = new BatteryChemistry({
    value: "Pb-Acid",
    englishName: "Flooded lead-acid",
    localizedName: "Blybatteri (flytande syra)",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("2.0")!,
    rank: 9,
  });

  static readonly AbsorbedGlassMat = new BatteryChemistry({
    value: "AGM",
    englishName: "Absorbed Glass Mat",
    localizedName: "AGM-batteri",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("2.0")!,
    rank: 0,
  });

  static readonly GelLeadAcid = new BatteryChemistry({
    value: "Gel",
    englishName: "Gel lead-acid",
    localizedName: "Gelbatteri",
    isRechargeable: true,
    nominalCellVoltageV: Decimal.parse("2.0")!,
    rank: 2,
  });

  static readonly Alkaline = new BatteryChemistry({
    value: "Alkaline",
    englishName: "Alkaline",
    localizedName: "Alkaliskt",
    isRechargeable: false,
    nominalCellVoltageV: Decimal.parse("1.5")!,
    rank: 1,
  });

  static readonly ZincCarbon = new BatteryChemistry({
    value: "Zinc-carbon",
    englishName: "Zinc-carbon",
    localizedName: "Zinkkol",
    isRechargeable: false,
    nominalCellVoltageV: Decimal.parse("1.5")!,
    rank: 10,
  });

  /** All 11 values, in canonical order. */
  static get all(): readonly BatteryChemistry[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): BatteryChemistry | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): BatteryChemistry {
    const result = BatteryChemistry.tryParse(input);
    if (result === null) throw new Error(`Invalid battery chemistry.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return BatteryChemistry.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: BatteryChemistryFormatOptions,
  ): string | null {
    const r = BatteryChemistry.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: BatteryChemistryFormatOptions,
  ): string | null {
    const r = BatteryChemistry.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && BatteryChemistry.normalize(input) === input;
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

  equals(other: BatteryChemistry | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: BatteryChemistry | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly BatteryChemistry[] = [
  BatteryChemistry.LithiumIon,
  BatteryChemistry.LiFePO4,
  BatteryChemistry.LithiumPolymer,
  BatteryChemistry.LithiumTitanate,
  BatteryChemistry.NickelMetalHydride,
  BatteryChemistry.NickelCadmium,
  BatteryChemistry.FloodedLeadAcid,
  BatteryChemistry.AbsorbedGlassMat,
  BatteryChemistry.GelLeadAcid,
  BatteryChemistry.Alkaline,
  BatteryChemistry.ZincCarbon,
];

function fallback(
  input: string | null | undefined,
  options?: BatteryChemistryFormatOptions,
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
  return foldOrdinalIgnoreCase(folded);
}

const ALIASES: readonly (readonly [BatteryChemistry, readonly string[]])[] = [
  [BatteryChemistry.LithiumIon, ["liion", "lithiumion", "litiumion", "litiumjon"]],
  [BatteryChemistry.LiFePO4, ["lfp", "lifepo4", "lithiumironphosphate", "litiumjarnfosfat"]],
  [BatteryChemistry.LithiumPolymer, ["lipo", "lipoly", "lithiumpolymer", "litiumpolymer"]],
  [BatteryChemistry.LithiumTitanate, ["lithiumtitanate", "litiumtitanat", "lto"]],
  [BatteryChemistry.NickelMetalHydride, ["nickelmetalhydride", "nickelmetallhydrid", "nimh"]],
  [BatteryChemistry.NickelCadmium, ["nicd", "nickelcadmium", "nickelkadmium"]],
  [
    BatteryChemistry.FloodedLeadAcid,
    [
      "bly",
      "blybatteri",
      "blybatteri(flytandesyra)",
      "floodedleadacid",
      "leadacid",
      "pb",
      "pbacid",
      "vatcell",
      "wetcell",
    ],
  ],
  [
    BatteryChemistry.AbsorbedGlassMat,
    ["absorbedglassmat", "absorbentglassmat", "agm", "agmbatteri"],
  ],
  [BatteryChemistry.GelLeadAcid, ["gel", "gelbatteri", "gelcell", "gelleadacid"]],
  [BatteryChemistry.Alkaline, ["alkaline", "alkalisk", "alkaliskt"]],
  [BatteryChemistry.ZincCarbon, ["zinccarbon", "zinkkol"]],
];

const LOOKUP = new Map<string, BatteryChemistry>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}
