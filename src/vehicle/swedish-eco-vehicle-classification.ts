import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskSwedishEcoVehicleClassification } from "./vehicle-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface SwedishEcoVehicleClassificationFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface SwedishEcoVehicleClassificationDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly introductionYear: number;
  readonly endYear: number | null;
  readonly englishDescription: string;
  readonly localizedDescription: string;
  readonly rank: number;
}

/**
 * A Swedish eco-vehicle classification (`miljöbilsklassning`) used by Transportstyrelsen and
 * the Swedish tax legislation, e.g. `Miljöbil 2007`, `Miljöbil 2013`, `Supermiljöbil`,
 * `Klimatbonusbil`.
 */
export class SwedishEcoVehicleClassification {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Swedish Eco-Vehicle Classification",
    localizedName: "Miljöbilsklassning",
    emoji: "🌿",
    sources: Object.freeze(["https://www.transportstyrelsen.se/", "https://www.skatteverket.se/"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly introductionYear: number;
  readonly endYear: number | null;
  readonly englishDescription: string;
  readonly localizedDescription: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: SwedishEcoVehicleClassificationDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.introductionYear = def.introductionYear;
    this.endYear = def.endYear;
    this.englishDescription = def.englishDescription;
    this.localizedDescription = def.localizedDescription;
    this.rank = def.rank;
  }

  static readonly Miljobil2007 = new SwedishEcoVehicleClassification({
    value: "Miljöbil 2007",
    englishName: "Eco vehicle 2007",
    localizedName: "Miljöbil 2007",
    introductionYear: 2007,
    endYear: 2012,
    englishDescription:
      "Definition under the 2007 Swedish eco-vehicle scheme: low CO₂ emissions and/or alternative fuel propulsion.",
    localizedDescription:
      "Miljöbilsdefinition från 2007 års system: låga CO₂-utsläpp och/eller alternativa drivmedel.",
    rank: 3,
  });

  static readonly Miljobil2013 = new SwedishEcoVehicleClassification({
    value: "Miljöbil 2013",
    englishName: "Eco vehicle 2013",
    localizedName: "Miljöbil 2013",
    introductionYear: 2013,
    endYear: 2017,
    englishDescription:
      "Definition under the 2013 Swedish eco-vehicle scheme: stricter CO₂ limits depending on weight.",
    localizedDescription:
      "Miljöbilsdefinition från 2013 års system: striktare CO₂-gränser beroende på fordonsvikt.",
    rank: 4,
  });

  static readonly Supermiljobil = new SwedishEcoVehicleClassification({
    value: "Supermiljöbil",
    englishName: "Super eco vehicle",
    localizedName: "Supermiljöbil",
    introductionYear: 2012,
    endYear: 2018,
    englishDescription:
      "Vehicles emitting at most 50 g CO₂/km, eligible for the Swedish super eco-vehicle premium 2012–2018.",
    localizedDescription:
      "Fordon som släpper ut högst 50 g CO₂/km, berättigade till supermiljöbilspremie 2012–2018.",
    rank: 5,
  });

  static readonly Klimatbonusbil = new SwedishEcoVehicleClassification({
    value: "Klimatbonusbil",
    englishName: "Climate bonus vehicle",
    localizedName: "Klimatbonusbil",
    introductionYear: 2018,
    endYear: 2022,
    englishDescription:
      "Vehicles eligible for the Swedish climate bonus 2018–2022 based on CO₂ emissions and electric propulsion.",
    localizedDescription:
      "Fordon som varit berättigade till klimatbonus 2018–2022 utifrån CO₂-utsläpp och elektrisk drift.",
    rank: 2,
  });

  static readonly Bonusbil = new SwedishEcoVehicleClassification({
    value: "Bonusbil",
    englishName: "Bonus vehicle",
    localizedName: "Bonusbil",
    introductionYear: 2018,
    endYear: 2022,
    englishDescription: "Synonym for klimatbonusbil — climate bonus eligible vehicle.",
    localizedDescription: "Synonymt med klimatbonusbil — fordon berättigade till klimatbonus.",
    rank: 0,
  });

  static readonly Elbil = new SwedishEcoVehicleClassification({
    value: "Elbil",
    englishName: "Electric vehicle",
    localizedName: "Elbil",
    introductionYear: 2010,
    endYear: null,
    englishDescription:
      "Battery electric vehicle — included as a Swedish eco-vehicle classification when no Euro stage applies.",
    localizedDescription:
      "Helelektriskt fordon — registreras som miljöbilsklassning när Euroklass inte är tillämplig.",
    rank: 1,
  });

  /** All 6 values, in canonical order. */
  static get all(): readonly SwedishEcoVehicleClassification[] {
    return ALL;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): SwedishEcoVehicleClassification | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): SwedishEcoVehicleClassification {
    const result = SwedishEcoVehicleClassification.tryParse(input);
    if (result === null) throw new Error(`Invalid swedish eco-vehicle classification.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishEcoVehicleClassification.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: SwedishEcoVehicleClassificationFormatOptions,
  ): string | null {
    const r = SwedishEcoVehicleClassification.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: SwedishEcoVehicleClassificationFormatOptions,
  ): string | null {
    const r = SwedishEcoVehicleClassification.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishEcoVehicleClassification.normalize(input) === input;
  }

  /** Finds swedish eco-vehicle classification mentions in unstructured text. */
  static findCandidatesInText(
    text: string,
  ): readonly TextCandidate<SwedishEcoVehicleClassification>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishEcoVehicleClassification>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const value = SwedishEcoVehicleClassification.tryParse(m[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<SwedishEcoVehicleClassification>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishEcoVehicleClassification",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskSwedishEcoVehicleClassification(value),
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

  equals(other: SwedishEcoVehicleClassification | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: SwedishEcoVehicleClassification | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly SwedishEcoVehicleClassification[] = [
  SwedishEcoVehicleClassification.Miljobil2007,
  SwedishEcoVehicleClassification.Miljobil2013,
  SwedishEcoVehicleClassification.Supermiljobil,
  SwedishEcoVehicleClassification.Klimatbonusbil,
  SwedishEcoVehicleClassification.Bonusbil,
  SwedishEcoVehicleClassification.Elbil,
];

function fallback(
  input: string | null | undefined,
  options?: SwedishEcoVehicleClassificationFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /\s+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, " ");
  return folded.trim();
}

const ALIASES: readonly (readonly [SwedishEcoVehicleClassification, readonly string[]])[] = [
  [
    SwedishEcoVehicleClassification.Miljobil2007,
    ["eco vehicle 2007", "mb2007", "miljobil 2007", "miljobil2007"],
  ],
  [
    SwedishEcoVehicleClassification.Miljobil2013,
    ["eco vehicle 2013", "mb2013", "miljobil 2013", "miljobil2013"],
  ],
  [SwedishEcoVehicleClassification.Supermiljobil, ["super eco vehicle", "supermiljobil"]],
  [
    SwedishEcoVehicleClassification.Klimatbonusbil,
    ["climate bonus car", "climate bonus vehicle", "klimatbonus", "klimatbonusbil"],
  ],
  [SwedishEcoVehicleClassification.Bonusbil, ["bonus car", "bonus vehicle", "bonusbil"]],
  [
    SwedishEcoVehicleClassification.Elbil,
    ["bev", "elbil", "electric car", "electric vehicle", "ev"],
  ],
];

const LOOKUP = new Map<string, SwedishEcoVehicleClassification>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}

const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])(?:Miljöbil(?:\s*20\d{2})?|Supermiljöbil|Klimatbonusbil)(?![\p{L}\p{N}_])/giu;
