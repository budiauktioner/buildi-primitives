import { Decimal } from "../internal/decimal.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { trySplitMeasurement } from "../internal/measurement-unit-parser.js";
import { formatQuantityDecimal } from "../internal/quantity.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskCameraResolution } from "./product-masking.js";

/** Options for {@link CameraResolution.format}. */
export interface CameraResolutionFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
  /** Round to this many fractional digits, away from zero. */
  decimals?: number;
}

const MAX_MEGAPIXELS = Decimal.parse("100000")!;
const PIXELS_PER_MEGAPIXEL = Decimal.parse("1000000")!;

const RECOGNIZED_SUFFIXES: ReadonlySet<string> = new Set(
  ["MP", "M", "Mpx", "Mpix", "megapixel", "megapixels", "mpixel", "mpixels", "megapixlar"].map(
    foldOrdinalIgnoreCase,
  ),
);

const SCAN_PATTERN =
  /(?<![\p{L}\p{N}_])\d+[0-9 .,]*\s*(?:megapixels?|megapixlar|MPix|Mpix|MPx|Mpx|MP|Mp)(?![\p{L}\p{N}_])/giu;

/**
 * A camera image-sensor resolution in megapixels (`kamerapixlar`), e.g. `12 MP` or
 * `108 megapixels`. Bare numbers and raw pixel counts such as `12000000` are rejected, since
 * they cannot be told apart from other product numbers.
 */
export class CameraResolution {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Camera Resolution",
    localizedName: "Kameraupplösning",
    emoji: "📷",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Pixel",
      "https://en.wikipedia.org/wiki/Image_resolution",
    ]),
  });

  private readonly exactMegapixels: Decimal;

  private constructor(megapixels: Decimal) {
    this.exactMegapixels = megapixels;
  }

  /** Resolution in megapixels, e.g. `12.2`. */
  get megapixels(): number {
    return this.exactMegapixels.toNumber();
  }

  /** Total pixel count, e.g. `12200000` for 12.2 MP. */
  get totalPixels(): number {
    return this.exactMegapixels.times(PIXELS_PER_MEGAPIXEL).round(0, "away-from-zero").toNumber();
  }

  /** Builds a resolution from a megapixel value, e.g. `fromMegapixels(12.2)`. */
  static fromMegapixels(megapixels: number | Decimal): CameraResolution {
    const amount = typeof megapixels === "number" ? Decimal.fromNumber(megapixels) : megapixels;
    if (amount === null || amount.isNegative) {
      throw new RangeError("Megapixels must be non-negative.");
    }
    if (amount.compareTo(MAX_MEGAPIXELS) > 0) {
      throw new RangeError("Megapixels must be at most 100000.");
    }
    return new CameraResolution(amount);
  }

  /** Builds a resolution from a total pixel count, e.g. `fromTotalPixels(12200000)`. */
  static fromTotalPixels(totalPixels: number): CameraResolution {
    if (!Number.isSafeInteger(totalPixels) || totalPixels < 0) {
      throw new RangeError("Total pixels must be a non-negative safe integer.");
    }
    const amount = Decimal.fromNumber(totalPixels)!;
    return CameraResolution.fromMegapixels(amount.dividedBy(PIXELS_PER_MEGAPIXEL));
  }

  static tryParse(input: string | null | undefined): CameraResolution | null {
    const split = trySplitMeasurement(input);
    if (split === null) return null;
    if (split.value.isNegative || split.value.compareTo(MAX_MEGAPIXELS) > 0) return null;
    if (!RECOGNIZED_SUFFIXES.has(foldOrdinalIgnoreCase(split.unitSuffix))) return null;

    return new CameraResolution(split.value);
  }

  static parse(input: string): CameraResolution {
    const result = CameraResolution.tryParse(input);
    if (result === null) throw new Error("Invalid camera resolution.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return CameraResolution.tryParse(input) !== null;
  }

  /** Returns the display form in megapixels, e.g. `12.2 MP`. */
  static format(
    input: string | null | undefined,
    options?: CameraResolutionFormatOptions,
  ): string | null {
    const r = CameraResolution.tryParse(input);
    if (r !== null) {
      return options?.decimals === undefined
        ? r.toString()
        : `${formatQuantityDecimal(r.exactMegapixels, options.decimals)} MP`;
    }
    return fallback(input, options);
  }

  /** Returns the value with the canonical `MP` suffix, e.g. `12.2 MP`. */
  static normalize(
    input: string | null | undefined,
    options?: CameraResolutionFormatOptions,
  ): string | null {
    const r = CameraResolution.tryParse(input);
    if (r !== null) return r.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && CameraResolution.normalize(input) === input;
  }

  /**
   * Scans unstructured text for megapixel values such as `12 MP` or `108 megapixels`. The scan
   * is heuristic and may produce false positives.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<CameraResolution>[] {
    if (!text) return [];
    const out: TextCandidate<CameraResolution>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = CameraResolution.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<CameraResolution>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "CameraResolution",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskCameraResolution(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return `${formatQuantityDecimal(this.exactMegapixels)} MP`;
  }

  toString(): string {
    return this.toNormalizedString();
  }

  equals(other: CameraResolution | null | undefined): boolean {
    return other != null && this.exactMegapixels.equals(other.exactMegapixels);
  }

  compareTo(other: CameraResolution | null | undefined): number {
    if (other == null) return 1;
    return this.exactMegapixels.compareTo(other.exactMegapixels);
  }
}

function fallback(
  input: string | null | undefined,
  options?: CameraResolutionFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
