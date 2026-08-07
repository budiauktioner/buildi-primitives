import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";

const MAX_INPUT_LENGTH = 50;

export interface ContinentFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * A continent (`kontinent`) identified by its two-letter code, English name,
 * or Swedish name. Seven continents are recognized: Africa, Antarctica, Asia,
 * Europe, North America, Oceania, and South America.
 *
 * Sources:
 * - UN M49 Standard
 * - Datahub continent codes
 */
export class Continent {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Continent",
    localizedName: "Kontinent",
    emoji: "\u{1F5FA}\uFE0F",
    sources: Object.freeze([
      "https://unstats.un.org/unsd/methodology/m49/",
      "https://datahub.io/core/continent-codes",
    ]),
  });

  static readonly Africa: Continent = new Continent("AF", "Africa", "Afrika");
  static readonly Antarctica: Continent = new Continent("AN", "Antarctica", "Antarktis");
  static readonly Asia: Continent = new Continent("AS", "Asia", "Asien");
  static readonly Europe: Continent = new Continent("EU", "Europe", "Europa");
  static readonly NorthAmerica: Continent = new Continent("NA", "North America", "Nordamerika");
  static readonly Oceania: Continent = new Continent("OC", "Oceania", "Oceanien");
  static readonly SouthAmerica: Continent = new Continent("SA", "South America", "Sydamerika");

  /** All seven continents. */
  static readonly all: readonly Continent[] = Object.freeze([
    Continent.Africa,
    Continent.Antarctica,
    Continent.Asia,
    Continent.Europe,
    Continent.NorthAmerica,
    Continent.Oceania,
    Continent.SouthAmerica,
  ]);

  readonly code: string;
  readonly englishName: string;
  readonly localizedName: string;

  private constructor(code: string, englishName: string, localizedName: string) {
    this.code = code;
    this.englishName = englishName;
    this.localizedName = localizedName;
  }

  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  get value(): string {
    return this.code;
  }

  static tryParse(input: string | null | undefined): Continent | null {
    if (input == null) return null;
    const trimmed = input.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) return null;
    const lower = trimmed.toLowerCase();
    return BY_KEY.get(lower) ?? null;
  }

  static parse(input: string): Continent {
    const r = Continent.tryParse(input);
    if (r === null) throw new Error("Unknown continent.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Continent.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: ContinentFormatOptions): string | null {
    const r = Continent.tryParse(input);
    if (r) return r.displayName;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: ContinentFormatOptions,
  ): string | null {
    const r = Continent.tryParse(input);
    if (r) return r.code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const trimmed = input.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Continent.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.code;
  }

  toString(): string {
    return this.displayName;
  }

  equals(other: Continent | null | undefined): boolean {
    return other != null && this.code === other.code;
  }

  compareTo(other: Continent | null | undefined): number {
    if (other == null) return 1;
    return this.code < other.code ? -1 : this.code > other.code ? 1 : 0;
  }
}

const BY_KEY = (() => {
  const m = new Map<string, Continent>();
  for (const c of Continent.all) {
    m.set(c.code.toLowerCase(), c);
    m.set(c.englishName.toLowerCase(), c);
    m.set(c.localizedName.toLowerCase(), c);
  }
  return m;
})();
