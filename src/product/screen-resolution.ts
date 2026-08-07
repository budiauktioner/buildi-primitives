import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskScreenResolution } from "./product-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface ScreenResolutionFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const WIDTH_BY_HEIGHT_PATTERN = /^\s*(\d+)\s*[xX]\s*(\d+)\s*$/u;
const SCAN_PATTERN = /(?<!\d)\d{3,5}\s*[xX]\s*\d{3,5}(?!\d)/gu;
const MAX_INT32 = 2_147_483_647;

/** Marketing names accepted on input, including the ones that share pixel dimensions. */
const PIXELS_BY_NAME: readonly (readonly [string, number, number])[] = [
  ["HD", 1280, 720],
  ["720p", 1280, 720],
  ["Full HD", 1920, 1080],
  ["FHD", 1920, 1080],
  ["1080p", 1920, 1080],
  ["QHD", 2560, 1440],
  ["WQHD", 2560, 1440],
  ["1440p", 2560, 1440],
  ["4K", 3840, 2160],
  ["UHD", 3840, 2160],
  ["2160p", 3840, 2160],
  ["8K", 7680, 4320],
  ["4320p", 7680, 4320],
  ["WQXGA", 2560, 1600],
  ["UWQHD", 3440, 1440],
];

/** The name reported back for a given size; 1366x768 is sold as HD even though it is not 720p. */
const NAME_BY_PIXELS: ReadonlyMap<string, string> = new Map([
  ["1280x720", "HD"],
  ["1920x1080", "Full HD"],
  ["2560x1440", "QHD"],
  ["3840x2160", "4K"],
  ["7680x4320", "8K"],
  ["1366x768", "HD"],
  ["2560x1600", "WQXGA"],
  ["3440x1440", "UWQHD"],
]);

const PIXELS_BY_NAME_KEY: ReadonlyMap<string, readonly [number, number]> = new Map(
  PIXELS_BY_NAME.map(([name, width, height]) => [name.toUpperCase(), [width, height] as const]),
);

/**
 * Pixel dimensions of a display or video mode (`skärmupplösning`), parsed either as `1920x1080`
 * or by a marketing name such as `Full HD` or `4K`.
 */
export class ScreenResolution {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Screen Resolution",
    localizedName: "Skärmupplösning",
    emoji: "📺",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/Display_resolution"]),
  });

  /** Width in pixels. */
  readonly width: number;

  /** Height in pixels. */
  readonly height: number;

  /** Marketing name when this size is a known standard, e.g. `Full HD`, otherwise `null`. */
  readonly name: string | null;

  /** Reduced aspect ratio, e.g. `16:9`. */
  readonly aspectRatio: string;

  /** Normalized form with a lowercase `x`, e.g. `1920x1080`. */
  readonly value: string;

  private constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.value = `${width}x${height}`;
    this.name = NAME_BY_PIXELS.get(this.value) ?? null;

    const divisor = greatestCommonDivisor(width, height);
    this.aspectRatio = `${width / divisor}:${height / divisor}`;
  }

  /** Total pixel count, width times height. */
  get totalPixels(): bigint {
    return BigInt(this.width) * BigInt(this.height);
  }

  /** Builds a resolution from pixel dimensions, e.g. `create(1920, 1080)`. */
  static create(width: number, height: number): ScreenResolution {
    if (!Number.isInteger(width) || width <= 0 || width > MAX_INT32) {
      throw new RangeError("Width must be a positive Int32.");
    }
    if (!Number.isInteger(height) || height <= 0 || height > MAX_INT32) {
      throw new RangeError("Height must be a positive Int32.");
    }
    return new ScreenResolution(width, height);
  }

  static tryParse(input: string | null | undefined): ScreenResolution | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();

    const dimensions = WIDTH_BY_HEIGHT_PATTERN.exec(text);
    if (dimensions !== null) {
      const width = Number(dimensions[1]);
      const height = Number(dimensions[2]);
      try {
        return ScreenResolution.create(width, height);
      } catch (error) {
        if (error instanceof RangeError) return null;
        throw error;
      }
    }

    const named = PIXELS_BY_NAME_KEY.get(text.toUpperCase());
    return named === undefined ? null : ScreenResolution.create(named[0], named[1]);
  }

  static parse(input: string): ScreenResolution {
    const result = ScreenResolution.tryParse(input);
    if (result === null) throw new Error("Invalid screen resolution.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ScreenResolution.tryParse(input) !== null;
  }

  /** Returns the marketing name when known, otherwise `1920 x 1080` with spaces. */
  static format(
    input: string | null | undefined,
    options?: ScreenResolutionFormatOptions,
  ): string | null {
    const r = ScreenResolution.tryParse(input);
    if (r !== null) return r.toString();
    return fallback(input, options);
  }

  /** Returns the compact form, e.g. `1920x1080`. */
  static normalize(
    input: string | null | undefined,
    options?: ScreenResolutionFormatOptions,
  ): string | null {
    const r = ScreenResolution.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ScreenResolution.normalize(input) === input;
  }

  /**
   * Scans unstructured text for `WIDTHxHEIGHT` spans. The scan is heuristic and may match
   * numbers that are not resolutions at all.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<ScreenResolution>[] {
    if (!text) return [];
    const out: TextCandidate<ScreenResolution>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = ScreenResolution.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<ScreenResolution>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "ScreenResolution",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskScreenResolution(value),
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
    return this.name ?? `${this.width} x ${this.height}`;
  }

  equals(other: ScreenResolution | null | undefined): boolean {
    return other != null && this.width === other.width && this.height === other.height;
  }

  compareTo(other: ScreenResolution | null | undefined): number {
    if (other == null) return 1;
    return this.totalPixels < other.totalPixels ? -1 : this.totalPixels > other.totalPixels ? 1 : 0;
  }
}

function greatestCommonDivisor(a: number, b: number): number {
  let left = a;
  let right = b;
  while (right !== 0) {
    [left, right] = [right, left % right];
  }
  return left;
}

function fallback(
  input: string | null | undefined,
  options?: ScreenResolutionFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
