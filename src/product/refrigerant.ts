import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskRefrigerant } from "./product-masking.js";
import { RefrigerantFamily } from "./refrigerant-family.js";

/** Options shared by the string-in, string-out helpers. */
export interface RefrigerantFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface RefrigerantDef {
  readonly value: string;
  readonly compactCode: string;
  readonly composition: string;
  readonly family: RefrigerantFamily;
  readonly gwp100Year: number;
  readonly safetyClass: string;
  readonly isRestrictedInEu: boolean;
  readonly rank: number;
}

/**
 * A refrigerant designation (`köldmedium`) following the ASHRAE Standard 34 numbering system,
 * with associated GWP (Global Warming Potential) metadata.
 */
export class Refrigerant {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Refrigerant",
    localizedName: "Köldmedium",
    emoji: "❄️",
    sources: Object.freeze([
      "https://www.ashrae.org/technical-resources/standards-and-guidelines/standards-addenda/standard-34-designation-and-safety-classification-of-refrigerants",
      "https://eur-lex.europa.eu/eli/reg/2014/517/oj",
    ]),
  });

  readonly value: string;
  readonly compactCode: string;
  readonly composition: string;
  readonly family: RefrigerantFamily;
  readonly gwp100Year: number;
  readonly safetyClass: string;
  readonly isRestrictedInEu: boolean;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: RefrigerantDef) {
    this.value = def.value;
    this.compactCode = def.compactCode;
    this.composition = def.composition;
    this.family = def.family;
    this.gwp100Year = def.gwp100Year;
    this.safetyClass = def.safetyClass;
    this.isRestrictedInEu = def.isRestrictedInEu;
    this.rank = def.rank;
  }

  static readonly R12 = new Refrigerant({
    value: "R-12",
    compactCode: "R12",
    composition: "Dichlorodifluoromethane",
    family: RefrigerantFamily.Cfc,
    gwp100Year: 10900,
    safetyClass: "A1",
    isRestrictedInEu: true,
    rank: 0,
  });

  static readonly R22 = new Refrigerant({
    value: "R-22",
    compactCode: "R22",
    composition: "Chlorodifluoromethane",
    family: RefrigerantFamily.Hcfc,
    gwp100Year: 1810,
    safetyClass: "A1",
    isRestrictedInEu: true,
    rank: 6,
  });

  static readonly R32 = new Refrigerant({
    value: "R-32",
    compactCode: "R32",
    composition: "Difluoromethane",
    family: RefrigerantFamily.Hfc,
    gwp100Year: 675,
    safetyClass: "A2L",
    isRestrictedInEu: false,
    rank: 8,
  });

  static readonly R134a = new Refrigerant({
    value: "R-134a",
    compactCode: "R134a",
    composition: "1,1,1,2-Tetrafluoroethane",
    family: RefrigerantFamily.Hfc,
    gwp100Year: 1430,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 5,
  });

  static readonly R290 = new Refrigerant({
    value: "R-290",
    compactCode: "R290",
    composition: "Propane",
    family: RefrigerantFamily.Natural,
    gwp100Year: 3,
    safetyClass: "A3",
    isRestrictedInEu: false,
    rank: 7,
  });

  static readonly R404A = new Refrigerant({
    value: "R-404A",
    compactCode: "R404A",
    composition: "HFC blend (R-125/R-143a/R-134a)",
    family: RefrigerantFamily.Hfc,
    gwp100Year: 3922,
    safetyClass: "A1",
    isRestrictedInEu: true,
    rank: 9,
  });

  static readonly R407C = new Refrigerant({
    value: "R-407C",
    compactCode: "R407C",
    composition: "HFC blend (R-32/R-125/R-134a)",
    family: RefrigerantFamily.Hfc,
    gwp100Year: 1774,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 10,
  });

  static readonly R407F = new Refrigerant({
    value: "R-407F",
    compactCode: "R407F",
    composition: "HFC blend (R-32/R-125/R-134a)",
    family: RefrigerantFamily.Hfc,
    gwp100Year: 1825,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 11,
  });

  static readonly R410A = new Refrigerant({
    value: "R-410A",
    compactCode: "R410A",
    composition: "HFC blend (R-32/R-125)",
    family: RefrigerantFamily.Hfc,
    gwp100Year: 2088,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 12,
  });

  static readonly R448A = new Refrigerant({
    value: "R-448A",
    compactCode: "R448A",
    composition: "HFC/HFO blend (R-32/R-125/R-134a/R-1234yf/R-1234ze)",
    family: RefrigerantFamily.HfcHfoBlend,
    gwp100Year: 1387,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 13,
  });

  static readonly R449A = new Refrigerant({
    value: "R-449A",
    compactCode: "R449A",
    composition: "HFC/HFO blend (R-32/R-125/R-134a/R-1234yf)",
    family: RefrigerantFamily.HfcHfoBlend,
    gwp100Year: 1397,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 14,
  });

  static readonly R452A = new Refrigerant({
    value: "R-452A",
    compactCode: "R452A",
    composition: "HFC/HFO blend (R-32/R-125/R-1234yf)",
    family: RefrigerantFamily.HfcHfoBlend,
    gwp100Year: 2140,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 15,
  });

  static readonly R507A = new Refrigerant({
    value: "R-507A",
    compactCode: "R507A",
    composition: "HFC blend (R-125/R-143a)",
    family: RefrigerantFamily.Hfc,
    gwp100Year: 3985,
    safetyClass: "A1",
    isRestrictedInEu: true,
    rank: 16,
  });

  static readonly R513A = new Refrigerant({
    value: "R-513A",
    compactCode: "R513A",
    composition: "HFC/HFO blend (R-1234yf/R-134a)",
    family: RefrigerantFamily.HfcHfoBlend,
    gwp100Year: 631,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 17,
  });

  static readonly R600a = new Refrigerant({
    value: "R-600a",
    compactCode: "R600a",
    composition: "Isobutane",
    family: RefrigerantFamily.Natural,
    gwp100Year: 3,
    safetyClass: "A3",
    isRestrictedInEu: false,
    rank: 18,
  });

  static readonly R717 = new Refrigerant({
    value: "R-717",
    compactCode: "R717",
    composition: "Ammonia",
    family: RefrigerantFamily.Natural,
    gwp100Year: 0,
    safetyClass: "B2L",
    isRestrictedInEu: false,
    rank: 19,
  });

  static readonly R718 = new Refrigerant({
    value: "R-718",
    compactCode: "R718",
    composition: "Water",
    family: RefrigerantFamily.Natural,
    gwp100Year: 0,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 20,
  });

  static readonly R744 = new Refrigerant({
    value: "R-744",
    compactCode: "R744",
    composition: "Carbon dioxide",
    family: RefrigerantFamily.Natural,
    gwp100Year: 1,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 21,
  });

  static readonly R1234yf = new Refrigerant({
    value: "R-1234yf",
    compactCode: "R1234yf",
    composition: "2,3,3,3-Tetrafluoropropene",
    family: RefrigerantFamily.Hfo,
    gwp100Year: 4,
    safetyClass: "A2L",
    isRestrictedInEu: false,
    rank: 2,
  });

  static readonly R1234ze = new Refrigerant({
    value: "R-1234ze",
    compactCode: "R1234ze",
    composition: "trans-1,3,3,3-Tetrafluoropropene",
    family: RefrigerantFamily.Hfo,
    gwp100Year: 7,
    safetyClass: "A2L",
    isRestrictedInEu: false,
    rank: 3,
  });

  static readonly R1233zd = new Refrigerant({
    value: "R-1233zd",
    compactCode: "R1233zd",
    composition: "trans-1-Chloro-3,3,3-trifluoropropene",
    family: RefrigerantFamily.Hfo,
    gwp100Year: 1,
    safetyClass: "A1",
    isRestrictedInEu: false,
    rank: 1,
  });

  static readonly R1270 = new Refrigerant({
    value: "R-1270",
    compactCode: "R1270",
    composition: "Propylene",
    family: RefrigerantFamily.Natural,
    gwp100Year: 2,
    safetyClass: "A3",
    isRestrictedInEu: false,
    rank: 4,
  });

  /** All 22 values, in canonical order. */
  static get all(): readonly Refrigerant[] {
    return ALL;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): Refrigerant | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): Refrigerant {
    const result = Refrigerant.tryParse(input);
    if (result === null) throw new Error(`Invalid refrigerant.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Refrigerant.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: RefrigerantFormatOptions,
  ): string | null {
    const r = Refrigerant.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: RefrigerantFormatOptions,
  ): string | null {
    const r = Refrigerant.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Refrigerant.normalize(input) === input;
  }

  /** Finds refrigerant mentions in unstructured text. */
  static findCandidatesInText(text: string): readonly TextCandidate<Refrigerant>[] {
    if (!text) return [];
    const out: TextCandidate<Refrigerant>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const value = Refrigerant.tryParse(m[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Refrigerant>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "Refrigerant",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskRefrigerant(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Refrigerant | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: Refrigerant | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly Refrigerant[] = [
  Refrigerant.R12,
  Refrigerant.R22,
  Refrigerant.R32,
  Refrigerant.R134a,
  Refrigerant.R290,
  Refrigerant.R404A,
  Refrigerant.R407C,
  Refrigerant.R407F,
  Refrigerant.R410A,
  Refrigerant.R448A,
  Refrigerant.R449A,
  Refrigerant.R452A,
  Refrigerant.R507A,
  Refrigerant.R513A,
  Refrigerant.R600a,
  Refrigerant.R717,
  Refrigerant.R718,
  Refrigerant.R744,
  Refrigerant.R1234yf,
  Refrigerant.R1234ze,
  Refrigerant.R1233zd,
  Refrigerant.R1270,
];

function fallback(
  input: string | null | undefined,
  options?: RefrigerantFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replace(KEY_PATTERN, "");
  return foldOrdinalIgnoreCase(folded);
}

const ALIASES: readonly (readonly [Refrigerant, readonly string[]])[] = [
  [
    Refrigerant.R12,
    ["r12"],
  ],
  [
    Refrigerant.R22,
    ["r22"],
  ],
  [
    Refrigerant.R32,
    ["r32"],
  ],
  [
    Refrigerant.R134a,
    ["r134a"],
  ],
  [
    Refrigerant.R290,
    ["propan", "propane", "r290"],
  ],
  [
    Refrigerant.R404A,
    ["r404a"],
  ],
  [
    Refrigerant.R407C,
    ["r407c"],
  ],
  [
    Refrigerant.R407F,
    ["r407f"],
  ],
  [
    Refrigerant.R410A,
    ["r410a"],
  ],
  [
    Refrigerant.R448A,
    ["r448a"],
  ],
  [
    Refrigerant.R449A,
    ["r449a"],
  ],
  [
    Refrigerant.R452A,
    ["r452a"],
  ],
  [
    Refrigerant.R507A,
    ["r507a"],
  ],
  [
    Refrigerant.R513A,
    ["r513a"],
  ],
  [
    Refrigerant.R600a,
    ["isobutan", "isobutane", "r600a"],
  ],
  [
    Refrigerant.R717,
    ["ammonia", "ammoniak", "nh3", "r717"],
  ],
  [
    Refrigerant.R718,
    ["h2o", "r718", "vatten", "water"],
  ],
  [
    Refrigerant.R744,
    ["carbondioxide", "co2", "co₂", "koldioxid", "r744"],
  ],
  [
    Refrigerant.R1234yf,
    ["r1234yf"],
  ],
  [
    Refrigerant.R1234ze,
    ["r1234ze"],
  ],
  [
    Refrigerant.R1233zd,
    ["r1233zd"],
  ],
  [
    Refrigerant.R1270,
    ["propen", "propylene", "r1270"],
  ],
];

const LOOKUP = new Map<string, Refrigerant>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}

const SCAN_PATTERN = /(?<![\p{L}\p{N}_])R-?\d{2,4}[A-Za-z]?(?![\p{L}\p{N}_])/gui;
