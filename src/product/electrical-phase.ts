import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskElectricalPhase } from "./product-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface ElectricalPhaseFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface ElectricalPhaseDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly phaseCount: number;
  readonly rank: number;
}

/**
 * An electrical phase configuration (`fas`) used for electrical equipment, such as
 * single-phase (`enfas`) or three-phase (`trefas`).
 */
export class ElectricalPhase {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Electrical Phase",
    localizedName: "Fas",
    emoji: "⚡",
    sources: Object.freeze(["https://www.elsakerhetsverket.se/"]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly phaseCount: number;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: ElectricalPhaseDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.phaseCount = def.phaseCount;
    this.rank = def.rank;
  }

  static readonly SinglePhase = new ElectricalPhase({
    value: "1-phase",
    englishName: "Single-phase",
    localizedName: "Enfas",
    phaseCount: 1,
    rank: 0,
  });

  static readonly TwoPhase = new ElectricalPhase({
    value: "2-phase",
    englishName: "Two-phase",
    localizedName: "Tvåfas",
    phaseCount: 2,
    rank: 1,
  });

  static readonly ThreePhase = new ElectricalPhase({
    value: "3-phase",
    englishName: "Three-phase",
    localizedName: "Trefas",
    phaseCount: 3,
    rank: 2,
  });

  /** All 3 values, in canonical order. */
  static get all(): readonly ElectricalPhase[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): ElectricalPhase | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): ElectricalPhase {
    const result = ElectricalPhase.tryParse(input);
    if (result === null) throw new Error(`Invalid electrical phase.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ElectricalPhase.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: ElectricalPhaseFormatOptions,
  ): string | null {
    const r = ElectricalPhase.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: ElectricalPhaseFormatOptions,
  ): string | null {
    const r = ElectricalPhase.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ElectricalPhase.normalize(input) === input;
  }

  /** Finds electrical phase mentions in unstructured text. */
  static findCandidatesInText(text: string): readonly TextCandidate<ElectricalPhase>[] {
    if (!text) return [];
    const out: TextCandidate<ElectricalPhase>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const value = ElectricalPhase.tryParse(m[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<ElectricalPhase>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "ElectricalPhase",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskElectricalPhase(value),
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

  equals(other: ElectricalPhase | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: ElectricalPhase | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly ElectricalPhase[] = [
  ElectricalPhase.SinglePhase,
  ElectricalPhase.TwoPhase,
  ElectricalPhase.ThreePhase,
];

function fallback(
  input: string | null | undefined,
  options?: ElectricalPhaseFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-~]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return foldOrdinalIgnoreCase(folded.trim());
}

const ALIASES: readonly (readonly [ElectricalPhase, readonly string[]])[] = [
  [
    ElectricalPhase.SinglePhase,
    ["1", "1f", "1fas", "1p", "1phase", "230v1fas", "enfas", "l1", "singlephase"],
  ],
  [ElectricalPhase.TwoPhase, ["2", "2f", "2fas", "2p", "2phase", "tvafas", "twophase"]],
  [
    ElectricalPhase.ThreePhase,
    ["3", "3f", "3fas", "3p", "3phase", "400v3fas", "l1l2l3", "threephase", "trefas"],
  ],
];

const LOOKUP = new Map<string, ElectricalPhase>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}

const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])(?:[123]-?fas(?:ig)?|enfas(?:ig)?|trefas(?:ig)?|tvåfas(?:ig)?|single-?phase|three-?phase|two-?phase|[123]~)(?![\p{L}\p{N}_])/giu;
