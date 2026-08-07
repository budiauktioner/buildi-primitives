import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { keepDigits } from "../internal/input-sanitization.js";

const MAX_INPUT_LENGTH = 20;

/**
 * Main category derived from the first digit of a Swedish property taxation code (`typkod`).
 */
export const SwedishPropertyTaxationCategory = {
  Unknown: "Unknown",
  Lantbruksenhet: "Lantbruksenhet",
  Smahusenhet: "Smahusenhet",
  Hyreshusenhet: "Hyreshusenhet",
  Industrienhet: "Industrienhet",
  Taktmark: "Taktmark",
  Elproduktionsenhet: "Elproduktionsenhet",
  Specialenhet: "Specialenhet",
  OvrigMark: "OvrigMark",
} as const;

export type SwedishPropertyTaxationCategory =
  (typeof SwedishPropertyTaxationCategory)[keyof typeof SwedishPropertyTaxationCategory];

const CATEGORY_BY_FIRST_DIGIT: Record<number, SwedishPropertyTaxationCategory> = {
  1: SwedishPropertyTaxationCategory.Lantbruksenhet,
  2: SwedishPropertyTaxationCategory.Smahusenhet,
  3: SwedishPropertyTaxationCategory.Hyreshusenhet,
  4: SwedishPropertyTaxationCategory.Industrienhet,
  5: SwedishPropertyTaxationCategory.Taktmark,
  6: SwedishPropertyTaxationCategory.Elproduktionsenhet,
  7: SwedishPropertyTaxationCategory.Specialenhet,
  8: SwedishPropertyTaxationCategory.OvrigMark,
};

interface KnownCode {
  readonly english: string;
  readonly swedish: string;
}

const KNOWN_CODES: Readonly<Record<number, KnownCode>> = {
  110: { english: "Agricultural unit, undeveloped", swedish: "Lantbruksenhet, obebyggd" },
  113: {
    english: "Agricultural unit, with farm building only",
    swedish: "Lantbruksenhet, obebyggd, enbart med ekonomibyggnad",
  },
  120: { english: "Agricultural unit, developed", swedish: "Lantbruksenhet, bebyggd" },

  210: { english: "Small house unit, land only", swedish: "Småhusenhet, tomtmark" },
  213: {
    english: "Small house unit, land with building value under 50 000 SEK",
    swedish: "Småhusenhet, tomtmark med byggnadsvärde under 50 000 kr",
  },
  220: { english: "Small house unit, developed", swedish: "Småhusenhet, bebyggd" },
  221: {
    english: "Small house unit, developed with two houses",
    swedish: "Småhusenhet, bebyggd med två småhus",
  },
  225: {
    english: "Small house unit, on leasehold",
    swedish: "Småhusenhet, bebyggd på ofri grund",
  },
  230: {
    english: "Small house unit, developed, cluster housing",
    swedish: "Småhusenhet, bebyggd, grupphusområde",
  },

  310: { english: "Rental property unit, land only", swedish: "Hyreshusenhet, tomtmark" },
  313: {
    english: "Rental property unit, land with building value under 50 000 SEK",
    swedish: "Hyreshusenhet, tomtmark med byggnadsvärde under 50 000 kr",
  },
  320: {
    english: "Rental property unit, developed, residential",
    swedish: "Hyreshusenhet, bebyggd, bostäder",
  },
  321: {
    english: "Rental property unit, developed, residential and commercial",
    swedish: "Hyreshusenhet, bebyggd, bostäder och lokaler",
  },
  325: {
    english: "Rental property unit, developed, commercial",
    swedish: "Hyreshusenhet, bebyggd, lokaler",
  },
  381: {
    english: "Rental property unit, developed, residential (special)",
    swedish: "Hyreshusenhet, bebyggd, bostäder (specialenhet)",
  },

  410: { english: "Industrial unit, land only", swedish: "Industrienhet, tomtmark" },
  420: { english: "Industrial unit, developed", swedish: "Industrienhet, bebyggd" },
  421: {
    english: "Industrial unit, developed with rental property area",
    swedish: "Industrienhet, bebyggd med hyreshusareal",
  },
  498: { english: "Industrial unit, petrol station", swedish: "Industrienhet, bensinstation" },

  510: { english: "Quarry land, undeveloped", swedish: "Täktmark, obebyggd" },
  520: { english: "Quarry land, developed", swedish: "Täktmark, bebyggd" },

  610: {
    english: "Power production unit, hydropower",
    swedish: "Elproduktionsenhet, vattenkraftverk",
  },
  620: {
    english: "Power production unit, thermal power",
    swedish: "Elproduktionsenhet, värmekraftverk",
  },
  630: {
    english: "Power production unit, wind power",
    swedish: "Elproduktionsenhet, vindkraftverk",
  },

  710: { english: "Communication building", swedish: "Kommunikationsbyggnad" },
  720: { english: "Distribution building", swedish: "Distributionsbyggnad" },
  730: { english: "Cultural building", swedish: "Kulturbyggnad" },

  810: { english: "Special unit, undeveloped land", swedish: "Specialenhet, obebyggd mark" },
  890: { english: "Other land", swedish: "Övrig mark" },
};

/**
 * A Swedish property taxation code (`typkod`), e.g. `220` (Småhusenhet, bebyggd).
 * 3-digit numeric code assigned by Skatteverket.
 */
export class SwedishPropertyTaxationCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Property Taxation Code",
    localizedName: "Typkod",
    emoji: "\u{1F3D7}\uFE0F",
    sources: Object.freeze([
      "https://www.skatteverket.se/privat/fastigheterochbostad/fastighetstaxering.4.69ef368911e1304a625800013531.html",
      "https://sv.wikipedia.org/wiki/Typkod_(fastighet)",
    ]),
  });

  /** The 3-digit taxation code, e.g. `220`. */
  readonly code: string;
  /** The numeric form of the code, e.g. `220`. */
  readonly numericCode: number;
  /** The main property category (derived from the first digit). */
  readonly category: SwedishPropertyTaxationCategory;
  /** English description, or `null` when the code is not in the known list. */
  readonly englishDescription: string | null;
  /** Localized (Swedish) description, or `null` when not in the known list. */
  readonly localizedDescription: string | null;

  /** `true` when this code has a known description. */
  get isKnown(): boolean {
    return this.englishDescription !== null;
  }

  /** Display description in the current display language; falls back to the code. */
  get displayDescription(): string {
    const desc = PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedDescription
      : this.englishDescription;
    return desc ?? this.code;
  }

  private constructor(
    code: string,
    numericCode: number,
    category: SwedishPropertyTaxationCategory,
    englishDescription: string | null,
    localizedDescription: string | null,
  ) {
    this.code = code;
    this.numericCode = numericCode;
    this.category = category;
    this.englishDescription = englishDescription;
    this.localizedDescription = localizedDescription;
  }

  static tryParse(input: string | null | undefined): SwedishPropertyTaxationCode | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(input);
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (digits.length !== 3) return null;
    const numeric = Number(digits);
    if (!Number.isFinite(numeric) || numeric < 100 || numeric > 999) return null;

    const firstDigit = Math.floor(numeric / 100);
    const category = CATEGORY_BY_FIRST_DIGIT[firstDigit];
    if (!category || category === SwedishPropertyTaxationCategory.Unknown) return null;

    const known = KNOWN_CODES[numeric];
    return new SwedishPropertyTaxationCode(
      digits,
      numeric,
      category,
      known?.english ?? null,
      known?.swedish ?? null,
    );
  }

  static parse(input: string): SwedishPropertyTaxationCode {
    const r = SwedishPropertyTaxationCode.tryParse(input);
    if (r === null) throw new Error("Invalid Swedish property taxation code.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishPropertyTaxationCode.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishPropertyTaxationCode.tryParse(input);
    if (r) return r.displayDescription;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishPropertyTaxationCode.tryParse(input);
    if (r) return r.code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishPropertyTaxationCode.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.code;
  }
  toString(): string {
    return this.displayDescription;
  }

  equals(other: SwedishPropertyTaxationCode | null | undefined): boolean {
    return other != null && this.code === other.code;
  }
  compareTo(other: SwedishPropertyTaxationCode | null | undefined): number {
    if (other == null) return 1;
    return this.code < other.code ? -1 : this.code > other.code ? 1 : 0;
  }
}
