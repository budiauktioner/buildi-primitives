import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { keepAsciiAlphanumericUppercase } from "../internal/input-sanitization.js";

const CODE_LENGTH = 4;
const MAX_INPUT_LENGTH = 20;

interface KnownElf {
  englishName: string;
  swedishName: string;
}

const KNOWN_CODES: ReadonlyMap<string, KnownElf> = new Map<string, KnownElf>([
  ["XTIQ", { englishName: "Limited company", swedishName: "Aktiebolag" }],
  ["N2GY", { englishName: "General partnership", swedishName: "Handelsbolag" }],
  ["FR3V", { englishName: "Limited partnership", swedishName: "Kommanditbolag" }],
  ["V2YH", { englishName: "Economic association", swedishName: "Ekonomisk förening" }],
  ["WJEL", { englishName: "Sole proprietorship", swedishName: "Enskild näringsidkare" }],
  ["CLBQ", { englishName: "Foundation", swedishName: "Stiftelse" }],
  ["F85L", { englishName: "Non-profit association", swedishName: "Ideell förening" }],
  ["O9FH", { englishName: "Housing cooperative", swedishName: "Bostadsrättsförening" }],
  [
    "H0PO",
    {
      englishName: "Cooperative housing association",
      swedishName: "Kooperativ hyresrättsförening",
    },
  ],
  ["2HBR", { englishName: "Government entity", swedishName: "Statlig enhet" }],
  ["EVKQ", { englishName: "Municipality", swedishName: "Kommun" }],
  ["R7GX", { englishName: "Region", swedishName: "Region" }],
  ["KQM9", { englishName: "Banking company", swedishName: "Bankaktiebolag" }],
  ["L5CF", { englishName: "Insurance company", swedishName: "Försäkringsaktiebolag" }],
  ["LRQE", { englishName: "Mutual insurance company", swedishName: "Ömsesidigt försäkringsbolag" }],
  [
    "J4GF",
    { englishName: "Branch of foreign company", swedishName: "Filial till utländskt företag" },
  ],
  ["9GQP", { englishName: "European company (SE)", swedishName: "Europabolag" }],
]);

/** ISO 20275 Entity Legal Form code. */
export class ElfCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Entity Legal Form Code",
    localizedName: "Juridisk företagsform",
    emoji: "\u{1F4CB}",
    sources: Object.freeze([
      "https://www.gleif.org/en/about-lei/code-lists/iso-20275-entity-legal-forms-code-list",
      "https://www.iso.org/standard/67462.html",
    ]),
  });

  readonly code: string;
  readonly englishName: string | null;
  readonly localizedName: string | null;

  get displayName(): string {
    const localized = PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedName
      : this.englishName;
    return localized ?? this.code;
  }

  get isKnown(): boolean {
    return this.englishName !== null;
  }

  private constructor(code: string, en: string | null, sv: string | null) {
    this.code = code;
    this.englishName = en;
    this.localizedName = sv;
  }

  static tryParse(input: string | null | undefined): ElfCode | null {
    if (input == null || input.trim() === "") return null;
    const cleaned = keepAsciiAlphanumericUppercase(input);
    if (cleaned.length > MAX_INPUT_LENGTH || cleaned.length !== CODE_LENGTH) return null;
    const known = KNOWN_CODES.get(cleaned);
    return new ElfCode(cleaned, known?.englishName ?? null, known?.swedishName ?? null);
  }

  static parse(input: string): ElfCode {
    const r = ElfCode.tryParse(input);
    if (r === null) {
      throw new Error("Invalid ELF code (must be exactly 4 alphanumeric characters).");
    }
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return ElfCode.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = ElfCode.tryParse(input);
    if (r) return r.displayName;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = ElfCode.tryParse(input);
    if (r) return r.code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ElfCode.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.code;
  }
  toString(): string {
    return this.displayName;
  }

  equals(other: ElfCode | null | undefined): boolean {
    return other != null && this.code === other.code;
  }
  compareTo(other: ElfCode | null | undefined): number {
    if (other == null) return 1;
    return this.code < other.code ? -1 : this.code > other.code ? 1 : 0;
  }
}
