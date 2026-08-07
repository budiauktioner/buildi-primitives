import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { collapseWhitespace } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

const MAX_INPUT_LENGTH = 200;

const PARSE_PATTERN =
  /^(?<name>[\p{L}\p{M}\d][\p{L}\p{M}\d\s'-]*?)\s+(?<block>\d{1,6}):(?<unit>\d{1,6})$/u;

const SCAN_PATTERN =
  /(?<![\p{L}\p{M}\d])(?<name>\p{Lu}[\p{L}\p{M}'-]*(?:\s\p{Lu}[\p{L}\p{M}'-]*)?)\s+(?<block>\d{1,6}):(?<unit>\d{1,6})(?!\d)/gu;

/**
 * A Swedish property designation (`fastighetsbeteckning`), e.g. `Stockholm Söder 75:2`.
 * Combines the municipality/tract name with a register number `BLOCK:UNIT`.
 */
export class SwedishPropertyDesignation {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Property Designation",
    localizedName: "Fastighetsbeteckning",
    emoji: "\u{1F3E0}",
    sources: Object.freeze([
      "https://www.lantmateriet.se/sv/kartor/vara-karttjanster/min-karta/hitta-fastighetsbeteckning-i-min-karta/",
      "https://www2.lantmateriet.se/sv/fastighet-och-mark/information-om-fastigheter/Fastighetsregistret/registrets-innehall/",
      "https://sv.wikipedia.org/wiki/Fastighetsbeteckning",
    ]),
  });

  /** The full designation, e.g. `Stockholm Söder 75:2`. */
  readonly value: string;
  /** The capitalized designation name, e.g. `Stockholm Söder`. */
  readonly designationName: string;
  /** The register number `BLOCK:UNIT`, e.g. `75:2`. */
  readonly registerNumber: string;
  /** Block portion of the register number. */
  readonly blockNumber: number;
  /** Unit portion of the register number. */
  readonly unitNumber: number;

  private constructor(
    value: string,
    designationName: string,
    registerNumber: string,
    blockNumber: number,
    unitNumber: number,
  ) {
    this.value = value;
    this.designationName = designationName;
    this.registerNumber = registerNumber;
    this.blockNumber = blockNumber;
    this.unitNumber = unitNumber;
  }

  static tryParse(input: string | null | undefined): SwedishPropertyDesignation | null {
    if (input == null || input.trim() === "") return null;
    const normalized = normalizeInput(input);
    if (normalized.length > MAX_INPUT_LENGTH) return null;

    const match = PARSE_PATTERN.exec(normalized);
    if (!match || !match.groups) return null;

    const name = normalizeName(match.groups.name!);
    if (name === "") return null;

    const block = Number(match.groups.block);
    const unit = Number(match.groups.unit);
    if (!Number.isFinite(block) || block <= 0) return null;
    if (!Number.isFinite(unit) || unit <= 0) return null;

    const register = `${block}:${unit}`;
    const value = `${name} ${register}`;
    return new SwedishPropertyDesignation(value, name, register, block, unit);
  }

  static parse(input: string): SwedishPropertyDesignation {
    const r = SwedishPropertyDesignation.tryParse(input);
    if (r === null) throw new Error("Invalid Swedish property designation.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishPropertyDesignation.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishPropertyDesignation.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return SwedishPropertyDesignation.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishPropertyDesignation.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SwedishPropertyDesignation>[] {
    if (!text) return [];
    const out: TextCandidate<SwedishPropertyDesignation>[] = [];
    const re = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const r = SwedishPropertyDesignation.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<SwedishPropertyDesignation>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "SwedishPropertyDesignation",
          category: TextCandidateCategory.Property,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskSwedishPropertyDesignation(r),
          confidence: TextMatchConfidence.Medium,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: SwedishPropertyDesignation | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: SwedishPropertyDesignation | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function normalizeInput(input: string): string {
  let s = collapseWhitespace(input);
  s = s.replace(/\s*:\s*/g, ":");
  return s;
}

function normalizeName(input: string): string {
  const words = collapseWhitespace(input)
    .split(" ")
    .filter((w) => w.length > 0);
  return words.map(capitalizeHyphenatedWord).join(" ");
}

function capitalizeHyphenatedWord(word: string): string {
  if (!word) return word;
  return word.split("-").map(capitalizeWord).join("-");
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  const locale = PrimitivesDefaults.culture;
  const lowered = word.toLocaleLowerCase(locale);
  for (let i = 0; i < lowered.length; i++) {
    const ch = lowered[i]!;
    if (isLetter(ch)) {
      return lowered.slice(0, i) + ch.toLocaleUpperCase(locale) + lowered.slice(i + 1);
    }
  }
  return lowered;
}

function isLetter(ch: string): boolean {
  return /\p{L}/u.test(ch);
}

/**
 * Masks the property designation preserving the name, e.g.
 * `Stockholm Söder 75:2` → `Stockholm Söder **:*`.
 */
export function maskSwedishPropertyDesignation(d: SwedishPropertyDesignation): string {
  const block = "*".repeat(d.blockNumber.toString().length);
  const unit = "*".repeat(d.unitNumber.toString().length);
  return `${d.designationName} ${block}:${unit}`;
}

/** Returns a Lantmäteriet map search URL for the designation. */
export function getLantmaterietUrl(d: SwedishPropertyDesignation): string {
  return `https://minkarta.lantmateriet.se/?search=${encodeURIComponent(d.value)}`;
}

/** Returns a Hitta.se map search URL for the designation. */
export function getPropertyHittaUrl(d: SwedishPropertyDesignation): string {
  return `https://www.hitta.se/kartan?s=${encodeURIComponent(d.value)}`;
}
