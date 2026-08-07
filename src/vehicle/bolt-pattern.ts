import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link BoltPattern.format} and {@link BoltPattern.normalize}. */
export interface BoltPatternFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MIN_BOLT_COUNT = 3;
const MAX_BOLT_COUNT = 10;
const MIN_PCD = Decimal.parse("50")!;
const MAX_PCD = Decimal.parse("250")!;

const PARSE_PATTERN = /^\s*(\d{1,2})\s*[xX×]\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:mm)?\s*$/u;
const SCAN_PATTERN = /(?<!\d)(\d{1,2})\s*[xX×]\s*(\d{2,3}(?:[.,]\d{1,2})?)(?!\d)/gu;

/**
 * A wheel bolt pattern (`bultcirkelmått`) such as `5x114.3`: the number of bolt holes
 * and the pitch circle diameter in millimetres.
 *
 * Sources:
 * - https://en.wikipedia.org/wiki/Bolt_pattern
 */
export class BoltPattern {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Bolt Pattern",
    localizedName: "Bultcirkelmått",
    emoji: "🔩",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Bolt_pattern"]),
  });

  /** Number of bolt holes, e.g. `5`. */
  readonly boltCount: number;

  /** Normalized compact form, e.g. `5x114.3`. */
  readonly value: string;

  private readonly exactPcd: Decimal;

  private constructor(boltCount: number, pitchCircleDiameter: Decimal) {
    this.boltCount = boltCount;
    this.exactPcd = pitchCircleDiameter;
    this.value = `${boltCount}x${formatPcd(pitchCircleDiameter)}`;
  }

  /** Pitch circle diameter in millimetres, e.g. `114.3`. */
  get pitchCircleDiameter(): number {
    return this.exactPcd.toNumber();
  }

  static tryParse(input: string | null | undefined): BoltPattern | null {
    if (input == null || input.trim().length === 0) return null;

    const match = PARSE_PATTERN.exec(sanitizeInput(input).trim());
    if (match === null) return null;

    const boltCount = Number(match[1]);
    const pcd = Decimal.parse(match[2]!.replace(",", "."));

    if (boltCount < MIN_BOLT_COUNT || boltCount > MAX_BOLT_COUNT) return null;
    if (pcd === null || pcd.compareTo(MIN_PCD) < 0 || pcd.compareTo(MAX_PCD) > 0) return null;

    return new BoltPattern(boltCount, pcd);
  }

  static parse(input: string): BoltPattern {
    const result = BoltPattern.tryParse(input);
    if (result === null) throw new Error("Invalid bolt pattern.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return BoltPattern.tryParse(input) !== null;
  }

  /** Returns the display form with spaces, e.g. `5 x 114.3`. */
  static format(
    input: string | null | undefined,
    options?: BoltPatternFormatOptions,
  ): string | null {
    const parsed = BoltPattern.tryParse(input);
    if (parsed !== null) return parsed.toString();
    return fallback(input, options);
  }

  /** Returns the compact form, e.g. `5x114.3`. */
  static normalize(
    input: string | null | undefined,
    options?: BoltPatternFormatOptions,
  ): string | null {
    const parsed = BoltPattern.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && BoltPattern.normalize(input) === input;
  }

  /** Finds bolt patterns in unstructured text, e.g. `5x114.3`. */
  static findCandidatesInText(text: string): readonly TextCandidate<BoltPattern>[] {
    if (!text) return [];

    const out: TextCandidate<BoltPattern>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = BoltPattern.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<BoltPattern>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "BoltPattern",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskBoltPattern(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the compact form, e.g. `5x114.3`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the display form with spaces, e.g. `5 x 114.3`. */
  toString(): string {
    return `${this.boltCount} x ${formatPcd(this.exactPcd)}`;
  }

  equals(other: BoltPattern | null | undefined): boolean {
    return (
      other != null && this.boltCount === other.boltCount && this.exactPcd.equals(other.exactPcd)
    );
  }

  compareTo(other: BoltPattern | null | undefined): number {
    if (other == null) return 1;
    if (this.boltCount !== other.boltCount) return this.boltCount < other.boltCount ? -1 : 1;
    return this.exactPcd.compareTo(other.exactPcd);
  }

  /** @internal Exposes the parsed scale, which masking mirrors star for star. */
  get _exactPcd(): Decimal {
    return this.exactPcd;
  }
}

/** Returns a masked bolt pattern, e.g. `5x114.3` becomes `* x *****`. */
export function maskBoltPattern(pattern: BoltPattern): string {
  const bolts = "*".repeat(String(pattern.boltCount).length);
  const pcd = "*".repeat(pattern._exactPcd.toString().length);
  return `${bolts} x ${pcd}`;
}

function formatPcd(pcd: Decimal): string {
  return pcd.toTrimmedString();
}

function fallback(
  input: string | null | undefined,
  options?: BoltPatternFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
