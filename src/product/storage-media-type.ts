import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface StorageMediaTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface StorageMediaTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly family: string;
  readonly isSolidState: boolean;
  readonly rank: number;
}

/**
 * Storage media technology (`lagringsmedia`) used in computers, laptops, phones, and consumer
 * electronics, e.g. `SSD`, `HDD`, `NVMe`, `eMMC`, `UFS`, `Flash`.
 */
export class StorageMediaType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Storage Media Type",
    localizedName: "Lagringsmedia",
    emoji: "💽",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Computer_data_storage",
      "https://en.wikipedia.org/wiki/NVM_Express",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly family: string;
  readonly isSolidState: boolean;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: StorageMediaTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.family = def.family;
    this.isSolidState = def.isSolidState;
    this.rank = def.rank;
  }

  static readonly Hdd = new StorageMediaType({
    value: "HDD",
    englishName: "Hard disk drive",
    localizedName: "Hårddisk (HDD)",
    family: "HDD",
    isSolidState: false,
    rank: 0,
  });

  static readonly Sshd = new StorageMediaType({
    value: "SSHD",
    englishName: "Solid-state hybrid drive",
    localizedName: "Hybriddisk (SSHD)",
    family: "Hybrid",
    isSolidState: false,
    rank: 1,
  });

  static readonly Ssd = new StorageMediaType({
    value: "SSD",
    englishName: "Solid-state drive",
    localizedName: "SSD-disk",
    family: "SSD",
    isSolidState: true,
    rank: 2,
  });

  static readonly Nvme = new StorageMediaType({
    value: "NVMe",
    englishName: "NVMe SSD",
    localizedName: "NVMe SSD",
    family: "SSD",
    isSolidState: true,
    rank: 3,
  });

  static readonly EMmc = new StorageMediaType({
    value: "eMMC",
    englishName: "eMMC",
    localizedName: "eMMC",
    family: "Flash",
    isSolidState: true,
    rank: 4,
  });

  static readonly Ufs = new StorageMediaType({
    value: "UFS",
    englishName: "Universal Flash Storage",
    localizedName: "UFS",
    family: "Flash",
    isSolidState: true,
    rank: 5,
  });

  static readonly Flash = new StorageMediaType({
    value: "Flash",
    englishName: "Flash storage",
    localizedName: "Flashminne",
    family: "Flash",
    isSolidState: true,
    rank: 6,
  });

  static readonly Optane = new StorageMediaType({
    value: "Optane",
    englishName: "Intel Optane",
    localizedName: "Intel Optane",
    family: "SSD",
    isSolidState: true,
    rank: 7,
  });

  /** All 8 values, in canonical order. */
  static get all(): readonly StorageMediaType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedName
      : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): StorageMediaType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): StorageMediaType {
    const result = StorageMediaType.tryParse(input);
    if (result === null) throw new Error(`Invalid storage media type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return StorageMediaType.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: StorageMediaTypeFormatOptions,
  ): string | null {
    const r = StorageMediaType.tryParse(input);
    if (r !== null) return PrimitivesDefaults.useLocalizedDisplayNames
      ? r.localizedName
      : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: StorageMediaTypeFormatOptions,
  ): string | null {
    const r = StorageMediaType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && StorageMediaType.normalize(input) === input;
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

  equals(other: StorageMediaType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: StorageMediaType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly StorageMediaType[] = [
  StorageMediaType.Hdd,
  StorageMediaType.Sshd,
  StorageMediaType.Ssd,
  StorageMediaType.Nvme,
  StorageMediaType.EMmc,
  StorageMediaType.Ufs,
  StorageMediaType.Flash,
  StorageMediaType.Optane,
];

function fallback(
  input: string | null | undefined,
  options?: StorageMediaTypeFormatOptions,
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

const ALIASES: readonly (readonly [StorageMediaType, readonly string[]])[] = [
  [
    StorageMediaType.Hdd,
    ["harddisk", "harddiskdrive", "harddiskhdd", "harddrive", "hdd", "magneticdisk", "magnetiskdisk", "mechanicaldrive", "mekaniskharddisk", "rotationaldrive", "spinningdisk", "spinningdrive"],
  ],
  [
    StorageMediaType.Sshd,
    ["hybriddisk", "hybriddisksshd", "hybriddrive", "hybridharddrive", "solidstatehybriddrive", "ssdhddhybrid", "sshd", "sshddisk"],
  ],
  [
    StorageMediaType.Ssd,
    ["m2sata", "m2satassd", "satassd", "solidstate", "solidstatedrive", "ssd", "ssddisk"],
  ],
  [
    StorageMediaType.Nvme,
    ["gen3nvme", "gen4nvme", "gen5nvme", "m2nvme", "m2nvmessd", "nvme", "nvmessd", "nvmexpress", "pciessd", "pciexpressssd"],
  ],
  [
    StorageMediaType.EMmc,
    ["embeddedmmc", "embeddedmultimediacard", "emmc"],
  ],
  [
    StorageMediaType.Ufs,
    ["ufs", "ufs21", "ufs30", "ufs31", "ufs40", "universalflashstorage"],
  ],
  [
    StorageMediaType.Flash,
    ["flash", "flashdrive", "flashlagring", "flashmemory", "flashminne", "flashstorage", "nandflash"],
  ],
  [
    StorageMediaType.Optane,
    ["3dxpoint", "inteloptane", "optane", "optanememory", "xpoint"],
  ],
];

const LOOKUP = new Map<string, StorageMediaType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}
