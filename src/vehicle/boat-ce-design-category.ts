import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface BoatCeDesignCategoryFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface BoatCeDesignCategoryDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly maxSignificantWaveHeightM: number;
  readonly maxBeaufortWindForce: number;
  readonly englishDescription: string;
  readonly localizedDescription: string;
  readonly rank: number;
}

/**
 * CE design category for recreational craft (`CE-konstruktionskategori`) per the EU
 * Recreational Craft Directive (RCD) 2013/53/EU and ISO 12217: `A` Ocean, `B` Offshore, `C`
 * Inshore, `D` Sheltered waters.
 */
export class BoatCeDesignCategory {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Boat CE Design Category",
    localizedName: "Båt CE-konstruktionskategori",
    emoji: "⛵",
    sources: Object.freeze([
      "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32013L0053",
      "https://www.iso.org/standard/56707.html",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly maxSignificantWaveHeightM: number;
  readonly maxBeaufortWindForce: number;
  readonly englishDescription: string;
  readonly localizedDescription: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: BoatCeDesignCategoryDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.maxSignificantWaveHeightM = def.maxSignificantWaveHeightM;
    this.maxBeaufortWindForce = def.maxBeaufortWindForce;
    this.englishDescription = def.englishDescription;
    this.localizedDescription = def.localizedDescription;
    this.rank = def.rank;
  }

  static readonly A = new BoatCeDesignCategory({
    value: "A",
    englishName: "Ocean",
    localizedName: "Hav",
    maxSignificantWaveHeightM: 7,
    maxBeaufortWindForce: 10,
    englishDescription:
      "Designed for extended voyages where conditions may exceed wind force 8 (Beaufort) and significant wave heights of 4 m and above, but excluding abnormal conditions, and vessels largely self-sufficient.",
    localizedDescription:
      "För längre färder där vindhastigheten kan överskrida 8 Beaufort och signifikant våghöjd överstiga 4 m, undantaget abnorma förhållanden. Båten är i stort sett självförsörjande.",
    rank: 0,
  });

  static readonly B = new BoatCeDesignCategory({
    value: "B",
    englishName: "Offshore",
    localizedName: "Utomskärs",
    maxSignificantWaveHeightM: 4,
    maxBeaufortWindForce: 8,
    englishDescription:
      "Designed for offshore voyages where conditions up to and including wind force 8 and significant wave heights up to and including 4 m may be experienced.",
    localizedDescription:
      "För färder utomskärs där vindar upp till 8 Beaufort och signifikanta våghöjder upp till 4 m kan förekomma.",
    rank: 1,
  });

  static readonly C = new BoatCeDesignCategory({
    value: "C",
    englishName: "Inshore",
    localizedName: "Inomskärs",
    maxSignificantWaveHeightM: 2,
    maxBeaufortWindForce: 6,
    englishDescription:
      "Designed for inshore voyages in coastal waters, large bays, estuaries, lakes and rivers where conditions up to and including wind force 6 and significant wave heights up to and including 2 m may be experienced.",
    localizedDescription:
      "För färder inomskärs och i kustnära farvatten, större vikar, flodmynningar, sjöar och floder där vindar upp till 6 Beaufort och signifikanta våghöjder upp till 2 m kan förekomma.",
    rank: 2,
  });

  static readonly D = new BoatCeDesignCategory({
    value: "D",
    englishName: "Sheltered waters",
    localizedName: "Skyddade vatten",
    maxSignificantWaveHeightM: 0.3,
    maxBeaufortWindForce: 4,
    englishDescription:
      "Designed for voyages on sheltered coastal waters, small bays, small lakes, rivers and canals where conditions up to and including wind force 4 and significant wave heights up to and including 0.3 m may be experienced, with occasional waves up to 0.5 m, e.g. from passing vessels.",
    localizedDescription:
      "För färder i skyddade kustnära vatten, små vikar, mindre sjöar, floder och kanaler där vindar upp till 4 Beaufort och signifikanta våghöjder upp till 0,3 m kan förekomma, med tillfälliga vågor upp till 0,5 m, t.ex. från passerande fartyg.",
    rank: 3,
  });

  /** All 4 values, in canonical order. */
  static get all(): readonly BoatCeDesignCategory[] {
    return ALL;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): BoatCeDesignCategory | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): BoatCeDesignCategory {
    const result = BoatCeDesignCategory.tryParse(input);
    if (result === null) throw new Error(`Invalid boat ce design category.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return BoatCeDesignCategory.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: BoatCeDesignCategoryFormatOptions,
  ): string | null {
    const r = BoatCeDesignCategory.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: BoatCeDesignCategoryFormatOptions,
  ): string | null {
    const r = BoatCeDesignCategory.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && BoatCeDesignCategory.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: BoatCeDesignCategory | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: BoatCeDesignCategory | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly BoatCeDesignCategory[] = [
  BoatCeDesignCategory.A,
  BoatCeDesignCategory.B,
  BoatCeDesignCategory.C,
  BoatCeDesignCategory.D,
];

function fallback(
  input: string | null | undefined,
  options?: BoatCeDesignCategoryFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s-]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return folded;
}

const ALIASES: readonly (readonly [BoatCeDesignCategory, readonly string[]])[] = [
  [
    BoatCeDesignCategory.A,
    ["a", "categorya", "cea", "classa", "hav", "havsgaende", "kategoria", "ocean", "oceangoing"],
  ],
  [
    BoatCeDesignCategory.B,
    ["b", "categoryb", "ceb", "classb", "kategorib", "offshore", "utomskars"],
  ],
  [
    BoatCeDesignCategory.C,
    [
      "c",
      "categoryc",
      "cec",
      "classc",
      "inomskars",
      "inshore",
      "inshore/coastal",
      "kategoric",
      "kustnara",
    ],
  ],
  [
    BoatCeDesignCategory.D,
    [
      "categoryd",
      "ced",
      "classd",
      "d",
      "insjo",
      "kategorid",
      "sheltered",
      "shelteredwaters",
      "skyddadevatten",
    ],
  ],
];

const LOOKUP = new Map<string, BoatCeDesignCategory>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
