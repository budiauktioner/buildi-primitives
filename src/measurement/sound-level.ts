import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { tryParseNumberOnly } from "../internal/measurement-unit-parser.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/**
 * The frequency weighting curve applied to a sound measurement.
 */
export const SoundWeighting = {
  /** No weighting: a flat response. */
  Unweighted: 0,
  /** A-weighting, which approximates human hearing sensitivity. */
  A: 1,
  /** B-weighting, an intermediate curve that is rarely used. */
  B: 2,
  /** C-weighting, flat across most audible frequencies. */
  C: 3,
  /** Z-weighting, zero weighting, flat from 10 Hz to 20 kHz. */
  Z: 4,
} as const;

export type SoundWeighting = (typeof SoundWeighting)[keyof typeof SoundWeighting];

/** Options for {@link SoundLevel.format} and {@link SoundLevel.normalize}. */
export interface SoundLevelFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const UNIT_PATTERN =
  /^\s*(?<sign>[+-])?\s*(?<num>[0-9][0-9 .,]*[0-9]|[0-9])\s*(?<unit>dB\s*(?:\(\s*(?<w1>[ABCZabcz])\s*\)|(?<w2>[ABCZabcz]))?)?\s*$/iu;

const SCAN_PATTERN =
  /(?<!\w)(?:[+-]\s*)?\d+[0-9 .,]*\s*dB(?:\s*\(\s*[ABCZabcz]\s*\)|[ABCZabcz])?\b/giu;

const SUFFIXES: Record<SoundWeighting, string> = {
  [SoundWeighting.Unweighted]: " dB",
  [SoundWeighting.A]: " dB(A)",
  [SoundWeighting.B]: " dB(B)",
  [SoundWeighting.C]: " dB(C)",
  [SoundWeighting.Z]: " dB(Z)",
};

const WEIGHTINGS: Record<string, SoundWeighting> = {
  A: SoundWeighting.A,
  B: SoundWeighting.B,
  C: SoundWeighting.C,
  Z: SoundWeighting.Z,
};

/**
 * A sound pressure level in decibels, optionally carrying a frequency
 * weighting — `85 dB`, `69 dB(A)`, `40 dBZ`.
 *
 * The decibel unit is missing from many inputs in practice, so a bare number is
 * accepted and read as unweighted decibels.
 */
export class SoundLevel {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Sound Level",
    localizedName: "Ljudnivå",
    emoji: "🔊",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/A-weighting",
      "https://www.iso.org/standard/17426.html",
    ]),
  });

  /** The display form, e.g. `69 dB(A)`. */
  readonly value: string;

  private constructor(
    private readonly decibelsValue: Decimal,
    /** The frequency weighting applied to this measurement. */
    readonly weighting: SoundWeighting,
  ) {
    this.value = `${decibelsValue.toTrimmedString()}${SUFFIXES[weighting]}`;
  }

  /** The numeric decibel value, e.g. `69`. */
  get decibels(): number {
    return this.decibelsValue.toNumber();
  }

  /** Creates a sound level from a value and weighting. */
  static create(value: number | Decimal, weighting: SoundWeighting): SoundLevel {
    return new SoundLevel(toDecimal(value), weighting);
  }

  /** Creates an unweighted sound level, e.g. `85 dB`. */
  static fromDecibels(value: number | Decimal): SoundLevel {
    return new SoundLevel(toDecimal(value), SoundWeighting.Unweighted);
  }

  /** Creates an A-weighted sound level, e.g. `69 dB(A)`. */
  static fromDecibelA(value: number | Decimal): SoundLevel {
    return new SoundLevel(toDecimal(value), SoundWeighting.A);
  }

  static tryParse(input: string | null | undefined): SoundLevel | null {
    if (input == null) return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0) return null;

    const match = UNIT_PATTERN.exec(trimmed);
    const number = match?.groups?.["num"];
    if (number === undefined) return null;

    const parsed = tryParseNumberOnly(number);
    if (parsed === null) return null;

    const decibels = match?.groups?.["sign"] === "-" ? parsed.negated() : parsed;
    const letter = match?.groups?.["w1"] ?? match?.groups?.["w2"];
    const weighting =
      letter === undefined
        ? SoundWeighting.Unweighted
        : (WEIGHTINGS[letter.toUpperCase()] ?? SoundWeighting.Unweighted);

    return new SoundLevel(decibels, weighting);
  }

  static parse(input: string): SoundLevel {
    const result = SoundLevel.tryParse(input);
    if (result === null) throw new Error("Invalid sound level.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return SoundLevel.tryParse(input) !== null;
  }

  /** Display form, e.g. `69 dB(A)`. */
  static format(
    input: string | null | undefined,
    options?: SoundLevelFormatOptions,
  ): string | null {
    const parsed = SoundLevel.tryParse(input);
    if (parsed !== null) return parsed.toString();
    return fallback(input, options);
  }

  /** Canonical form, e.g. `69 dB(A)`. */
  static normalize(
    input: string | null | undefined,
    options?: SoundLevelFormatOptions,
  ): string | null {
    const parsed = SoundLevel.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SoundLevel.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  compareTo(other: SoundLevel | null | undefined): number {
    if (other == null) return 1;
    return this.decibelsValue.compareTo(other.decibelsValue);
  }

  equals(other: SoundLevel | null | undefined): boolean {
    return (
      other != null &&
      this.decibelsValue.equals(other.decibelsValue) &&
      this.weighting === other.weighting
    );
  }

  static findCandidatesInText(text: string): readonly TextCandidate<SoundLevel>[] {
    if (!text) return [];

    const out: TextCandidate<SoundLevel>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = SoundLevel.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<SoundLevel>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "SoundLevel",
          category: TextCandidateCategory.Measurement,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskSoundLevel(value),
          confidence: TextMatchConfidence.Low,
          value,
        }),
      );
    }

    return out;
  }
}

/** Returns a masked sound level, e.g. `69 dB(A)` becomes `*** dB(A)`. */
export function maskSoundLevel(soundLevel: SoundLevel): string {
  return `***${SUFFIXES[soundLevel.weighting]}`;
}

function toDecimal(value: number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a sound level: ${value}`);
  return parsed;
}

function fallback(
  input: string | null | undefined,
  options?: SoundLevelFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true) return null;
  if (input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
