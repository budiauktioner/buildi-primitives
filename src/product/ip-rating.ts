import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskIpRating } from "./product-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface IpRatingFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const PARSE_PATTERN = /^\s*[Ii][Pp]\s*[-/]?\s*([0-6Xx])\s*([0-9Xx])\s*$/u;
const SCAN_PATTERN = /(?<![\p{L}\p{N}_])IP\s*[-/]?\s*[0-6Xx][0-9Xx](?![\p{L}\p{N}_])/giu;

const SOLIDS_DESCRIPTIONS: Readonly<Record<string, string>> = {
  X: "Not tested",
  "0": "No protection",
  "1": "Objects >50 mm",
  "2": "Objects >12.5 mm",
  "3": "Objects >2.5 mm",
  "4": "Objects >1 mm",
  "5": "Dust protected",
  "6": "Dust tight",
};

const LIQUIDS_DESCRIPTIONS: Readonly<Record<string, string>> = {
  X: "Not tested",
  "0": "No protection",
  "1": "Dripping water",
  "2": "Dripping water (15° tilted)",
  "3": "Spraying water",
  "4": "Splashing water",
  "5": "Water jets",
  "6": "Powerful water jets",
  "7": "Temporary immersion",
  "8": "Continuous immersion",
  "9": "High-pressure/steam cleaning",
};

/**
 * Ingress Protection rating (`kapslingsklass`, `IP-klass`) per IEC 60529, e.g. `IP65` or `IPX4`,
 * where the first digit rates protection against solids and the second against liquids. An `X`
 * in either position means that level was not tested.
 */
export class IpRating {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "IP Rating",
    localizedName: "IP-klass",
    emoji: "🛡️",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/IP_code",
      "https://webstore.iec.ch/en/publication/2452",
    ]),
  });

  /** Solids protection, a single character `0`–`6` or `X`. */
  readonly solidsProtection: string;

  /** Liquids protection, a single character `0`–`9` or `X`. */
  readonly liquidsProtection: string;

  /** Normalized code, e.g. `IP65`. */
  readonly value: string;

  private constructor(solidsProtection: string, liquidsProtection: string) {
    this.solidsProtection = solidsProtection;
    this.liquidsProtection = liquidsProtection;
    this.value = `IP${solidsProtection}${liquidsProtection}`;
  }

  /** English description of the solids level, e.g. `Dust tight`. */
  get solidsDescription(): string {
    return SOLIDS_DESCRIPTIONS[this.solidsProtection] ?? "Unknown";
  }

  /** English description of the liquids level, e.g. `Water jets`. */
  get liquidsDescription(): string {
    return LIQUIDS_DESCRIPTIONS[this.liquidsProtection] ?? "Unknown";
  }

  static tryParse(input: string | null | undefined): IpRating | null {
    if (input == null || input.trim().length === 0) return null;

    const match = PARSE_PATTERN.exec(sanitizeInput(input).trim());
    if (match === null) return null;

    return new IpRating(match[1]!.toUpperCase(), match[2]!.toUpperCase());
  }

  static parse(input: string): IpRating {
    const result = IpRating.tryParse(input);
    if (result === null) throw new Error("Invalid IP rating.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return IpRating.tryParse(input) !== null;
  }

  /** Returns the canonical form, e.g. `IP65`. */
  static format(input: string | null | undefined, options?: IpRatingFormatOptions): string | null {
    const r = IpRating.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical form, e.g. `IP65`. */
  static normalize(
    input: string | null | undefined,
    options?: IpRatingFormatOptions,
  ): string | null {
    const r = IpRating.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && IpRating.normalize(input) === input;
  }

  /**
   * Scans unstructured text for IP ratings such as `IP65`. The `IP` prefix makes matches fairly
   * distinctive, but the scan stays heuristic and may produce false positives.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<IpRating>[] {
    if (!text) return [];
    const out: TextCandidate<IpRating>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = IpRating.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<IpRating>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "IpRating",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskIpRating(value),
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

  equals(other: IpRating | null | undefined): boolean {
    return (
      other != null &&
      this.solidsProtection === other.solidsProtection &&
      this.liquidsProtection === other.liquidsProtection
    );
  }

  compareTo(other: IpRating | null | undefined): number {
    if (other == null) return 1;
    const solids = compareChars(this.solidsProtection, other.solidsProtection);
    return solids !== 0 ? solids : compareChars(this.liquidsProtection, other.liquidsProtection);
  }
}

/** Compares by code point, the way .NET compares two `char` values. */
function compareChars(a: string, b: string): number {
  const left = a.charCodeAt(0);
  const right = b.charCodeAt(0);
  return left < right ? -1 : left > right ? 1 : 0;
}

function fallback(
  input: string | null | undefined,
  options?: IpRatingFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
