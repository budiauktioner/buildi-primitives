import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface AspectRatioFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const INTEGER_COLON_PATTERN = /^\s*(\d{1,3})\s*[:xX×/]\s*(\d{1,3})\s*$/u;
const DECIMAL_PATTERN = /^\s*(\d+(?:[.,]\d+)?)\s*(?::\s*1)?\s*$/u;
const WHITESPACE_PATTERN = /\s+/gu;

/** Widest gap between a decimal input and a canonical ratio that still counts as a match. */
const DECIMAL_TOLERANCE = Decimal.parse("0.02")!;

/**
 * A display or image aspect ratio (`bildformat`) expressed as `width:height`, e.g. `16:9`,
 * `4:3`, `21:9`. Accepts colon, slash and `x`-separated forms, as well as decimal ratios such
 * as `1.78` or `1.78:1`. Decimal inputs snap to the closest known ratio within a small
 * tolerance, so `1.7777` and `16:9` do not become separate values.
 */
export class AspectRatio {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Aspect Ratio",
    localizedName: "Bildformat",
    emoji: "🖥️",
    sources: Object.freeze(["https://www.itu.int/rec/R-REC-BT.709"]),
  });

  /** Canonical width:height form, e.g. `16:9`. */
  readonly value: string;

  /** Width component, e.g. `16`. */
  readonly width: number;

  /** Height component, e.g. `9`. */
  readonly height: number;

  /** Common name when available, e.g. `Widescreen` for `16:9`; otherwise `null`. */
  readonly commonName: string | null;

  private constructor(value: string, width: number, height: number, commonName: string | null) {
    this.value = value;
    this.width = width;
    this.height = height;
    this.commonName = commonName;
  }

  static readonly OneToOne = new AspectRatio("1:1", 1, 1, "Square");
  static readonly FourThree = new AspectRatio("4:3", 4, 3, "Standard");
  static readonly FiveFour = new AspectRatio("5:4", 5, 4, "Computer Standard");
  static readonly ThreeTwo = new AspectRatio("3:2", 3, 2, "Classic 35 mm");
  static readonly SixteenTen = new AspectRatio("16:10", 16, 10, "Widescreen Computer");
  static readonly SixteenNine = new AspectRatio("16:9", 16, 9, "Widescreen");
  static readonly EighteenNine = new AspectRatio("18:9", 18, 9, "Univisium");
  static readonly TwentyOneNine = new AspectRatio("21:9", 21, 9, "Ultrawide");
  static readonly ThirtyTwoNine = new AspectRatio("32:9", 32, 9, "Super Ultrawide");
  static readonly NineSixteen = new AspectRatio("9:16", 9, 16, "Vertical");
  static readonly NineEighteen = new AspectRatio("9:18", 9, 18, "Vertical Tall");

  /** All 11 predefined ratios, in canonical order. */
  static get all(): readonly AspectRatio[] {
    return ALL;
  }

  /** Numeric ratio ({@link width} divided by {@link height}), e.g. `1.7777…`. */
  get ratio(): Decimal {
    return Decimal.fromNumber(this.width)!.dividedBy(Decimal.fromNumber(this.height)!);
  }

  /**
   * Resolves a ratio from a `width:height`, `width/height` or `width x height` form, or from a
   * decimal ratio close enough to one of the canonical values.
   */
  static tryParse(input: string | null | undefined): AspectRatio | null {
    if (input == null) return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0) return null;

    const fromLookup = LOOKUP.get(normalizeLookupKey(trimmed));
    if (fromLookup !== undefined) return fromLookup;

    const integers = INTEGER_COLON_PATTERN.exec(trimmed);
    if (integers !== null) {
      const width = Number(integers[1]);
      const height = Number(integers[2]);
      if (width > 0 && height > 0) return reduceToCanonical(width, height);
      return null;
    }

    const decimals = DECIMAL_PATTERN.exec(trimmed);
    if (decimals !== null) {
      const ratio = Decimal.parse(decimals[1]!.replace(",", "."));
      if (ratio !== null && !ratio.isZero && !ratio.isNegative) return matchByDecimal(ratio);
    }

    return null;
  }

  static parse(input: string): AspectRatio {
    const result = AspectRatio.tryParse(input);
    if (result === null) throw new Error("Invalid aspect ratio.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return AspectRatio.tryParse(input) !== null;
  }

  /** Returns the canonical width:height form, e.g. `16:9`. */
  static format(
    input: string | null | undefined,
    options?: AspectRatioFormatOptions,
  ): string | null {
    const r = AspectRatio.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical width:height form, e.g. `16:9`. */
  static normalize(
    input: string | null | undefined,
    options?: AspectRatioFormatOptions,
  ): string | null {
    const r = AspectRatio.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && AspectRatio.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: AspectRatio | null | undefined): boolean {
    return other != null && this.width === other.width && this.height === other.height;
  }

  compareTo(other: AspectRatio | null | undefined): number {
    if (other == null) return 1;
    return this.ratio.compareTo(other.ratio);
  }
}

const ALL: readonly AspectRatio[] = [
  AspectRatio.OneToOne,
  AspectRatio.FourThree,
  AspectRatio.FiveFour,
  AspectRatio.ThreeTwo,
  AspectRatio.SixteenTen,
  AspectRatio.SixteenNine,
  AspectRatio.EighteenNine,
  AspectRatio.TwentyOneNine,
  AspectRatio.ThirtyTwoNine,
  AspectRatio.NineSixteen,
  AspectRatio.NineEighteen,
];

function fallback(
  input: string | null | undefined,
  options?: AspectRatioFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase().replace(WHITESPACE_PATTERN, "");
}

function greatestCommonDivisor(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

function reduceToCanonical(width: number, height: number): AspectRatio | null {
  const divisor = greatestCommonDivisor(width, height);
  const w = width / divisor;
  const h = height / divisor;
  return ALL.find((r) => r.width === w && r.height === h) ?? null;
}

function matchByDecimal(ratio: Decimal): AspectRatio | null {
  let best: AspectRatio | null = null;
  let bestDifference: Decimal | null = null;
  for (const candidate of ALL) {
    const difference = candidate.ratio.minus(ratio).abs();
    if (bestDifference === null || difference.compareTo(bestDifference) < 0) {
      bestDifference = difference;
      best = candidate;
    }
  }
  if (bestDifference === null || bestDifference.compareTo(DECIMAL_TOLERANCE) > 0) return null;
  return best;
}

const LOOKUP = new Map<string, AspectRatio>();
for (const ratio of ALL) {
  for (const key of [
    ratio.value,
    `${ratio.width}/${ratio.height}`,
    `${ratio.width}x${ratio.height}`,
  ]) {
    const folded = normalizeLookupKey(key);
    if (folded.length > 0 && !LOOKUP.has(folded)) LOOKUP.set(folded, ratio);
  }
}
