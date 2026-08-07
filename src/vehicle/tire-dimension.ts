import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/** Options for {@link TireDimension.format} and {@link TireDimension.normalize}. */
export interface TireDimensionFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MIN_WIDTH_MM = 100;
const MAX_WIDTH_MM = 400;
const MIN_ASPECT_RATIO = 20;
const MAX_ASPECT_RATIO = 90;
const MIN_RIM_INCHES = 10;
const MAX_RIM_INCHES = 26.5;
const MIN_LOAD_INDEX = 0;
const MAX_LOAD_INDEX = 279;

const PARSE_PATTERN =
  /^\s*(\d{3})\/(\d{2})\s*([RDBrdb])\s*(\d{2}(?:[.,]\d)?)\s*(C)?\s*(?:[(\s]*(\d{2,3})(?:\/(\d{2,3}))?\s*([A-Za-z])?\s*\)?\s*)?$/u;

const SCAN_PATTERN =
  /(?<!\d)(\d{3})\/(\d{2})\s*([RDBrdb])\s*(\d{2}(?:[.,]\d)?)C?(?:\s+(\d{2,3})(?:\/(\d{2,3}))?\s*([A-Za-z])?)?(?!\d)/gu;

/**
 * Metric tire size notation (`däckdimension`) per ISO 4000-1, e.g. `205/55R16` or
 * `315/70R22.5 154/150L` for commercial truck tires: section width, aspect ratio,
 * construction, rim diameter, plus optional load index, dual load index, speed
 * symbol and commercial `C` designation.
 *
 * Sources:
 * - https://www.iso.org/standard/4600.html
 * - https://en.wikipedia.org/wiki/Tire_code
 */
export class TireDimension {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Tire Dimension",
    localizedName: "Däckdimension",
    emoji: "🛞",
    sources: Object.freeze([
      "https://www.iso.org/standard/4600.html",
      "https://en.wikipedia.org/wiki/Tire_code",
    ]),
  });

  /** Tread width in millimetres, e.g. `205`. */
  readonly widthMm: number;

  /** Aspect ratio, the sidewall height as a percentage of section width, e.g. `55`. */
  readonly aspectRatio: number;

  /** Construction code: `R` radial, `D` diagonal, `B` bias belt. */
  readonly construction: string;

  /** Rim diameter in inches, e.g. `16` or `22.5` for half-inch commercial rims. */
  readonly rimDiameterInches: number;

  /** Whether the tire carries the commercial `C` designation. */
  readonly isCommercial: boolean;

  /** Optional load index, e.g. `91` in `205/55R16 91H`. */
  readonly loadIndex: number | null;

  /** Optional dual (twin-mounted) load index, e.g. `150` in `315/70R22.5 154/150L`. */
  readonly dualLoadIndex: number | null;

  /** Optional speed rating letter, e.g. `H` in `205/55R16 91H`. */
  readonly speedRating: string | null;

  /** Normalized compact form, e.g. `205/55R16 91H`. */
  readonly value: string;

  private constructor(
    widthMm: number,
    aspectRatio: number,
    construction: string,
    rimDiameterInches: number,
    isCommercial: boolean,
    loadIndex: number | null,
    dualLoadIndex: number | null,
    speedRating: string | null,
  ) {
    this.widthMm = widthMm;
    this.aspectRatio = aspectRatio;
    this.construction = construction;
    this.rimDiameterInches = rimDiameterInches;
    this.isCommercial = isCommercial;
    this.loadIndex = loadIndex;
    this.dualLoadIndex = dualLoadIndex;
    this.speedRating = speedRating;
    this.value = build(this, false);
  }

  static tryParse(input: string | null | undefined): TireDimension | null {
    if (input == null || input.trim().length === 0) return null;

    const match = PARSE_PATTERN.exec(sanitizeInput(input).trim());
    if (match === null) return null;

    const width = Number(match[1]);
    const aspect = Number(match[2]);
    const construction = match[3]!.toUpperCase();
    const rim = Number(match[4]!.replace(",", "."));

    if (width < MIN_WIDTH_MM || width > MAX_WIDTH_MM) return null;
    if (aspect < MIN_ASPECT_RATIO || aspect > MAX_ASPECT_RATIO) return null;
    if (rim < MIN_RIM_INCHES || rim > MAX_RIM_INCHES) return null;

    let loadIndex: number | null = null;
    let dualLoadIndex: number | null = null;
    let speedRating: string | null = null;

    if (match[6] !== undefined) {
      const load = Number(match[6]);
      if (load < MIN_LOAD_INDEX || load > MAX_LOAD_INDEX) return null;
      loadIndex = load;

      if (match[7] !== undefined) {
        const dual = Number(match[7]);
        if (dual < MIN_LOAD_INDEX || dual > MAX_LOAD_INDEX) return null;
        dualLoadIndex = dual;
      }

      if (match[8] !== undefined) speedRating = match[8].toUpperCase();
    }

    return new TireDimension(
      width,
      aspect,
      construction,
      rim,
      match[5] !== undefined,
      loadIndex,
      dualLoadIndex,
      speedRating,
    );
  }

  static parse(input: string): TireDimension {
    const result = TireDimension.tryParse(input);
    if (result === null) throw new Error("Invalid tire dimension.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return TireDimension.tryParse(input) !== null;
  }

  /** Returns the display form with spaces, e.g. `205/55 R 16 91H`. */
  static format(
    input: string | null | undefined,
    options?: TireDimensionFormatOptions,
  ): string | null {
    const parsed = TireDimension.tryParse(input);
    if (parsed !== null) return build(parsed, true);
    return fallback(input, options);
  }

  /** Returns the compact form, e.g. `205/55R16 91H`. */
  static normalize(
    input: string | null | undefined,
    options?: TireDimensionFormatOptions,
  ): string | null {
    const parsed = TireDimension.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    if (input == null) return false;
    const trimmed = input.trim();
    return TireDimension.normalize(trimmed) === trimmed;
  }

  /** Finds tire dimensions in unstructured text, e.g. `205/55R16`. */
  static findCandidatesInText(text: string): readonly TextCandidate<TireDimension>[] {
    if (!text) return [];

    const out: TextCandidate<TireDimension>[] = [];
    const pattern = new RegExp(SCAN_PATTERN.source, SCAN_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = TireDimension.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<TireDimension>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "TireDimension",
          category: TextCandidateCategory.Vehicle,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskTireDimension(value),
          confidence: TextMatchConfidence.High,
          value,
        }),
      );
    }

    return out;
  }

  /** Returns the compact form, e.g. `205/55R16 91H`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the display form with spaces, e.g. `205/55 R 16 91H`. */
  toString(): string {
    return build(this, true);
  }

  equals(other: TireDimension | null | undefined): boolean {
    return (
      other != null &&
      this.widthMm === other.widthMm &&
      this.aspectRatio === other.aspectRatio &&
      this.construction === other.construction &&
      this.rimDiameterInches === other.rimDiameterInches
    );
  }

  compareTo(other: TireDimension | null | undefined): number {
    if (other == null) return 1;
    return (
      compare(this.widthMm, other.widthMm) ||
      compare(this.aspectRatio, other.aspectRatio) ||
      compare(this.rimDiameterInches, other.rimDiameterInches) ||
      compare(this.construction, other.construction) ||
      compare(Number(this.isCommercial), Number(other.isCommercial)) ||
      compare(this.loadIndex ?? -1, other.loadIndex ?? -1) ||
      compare(this.dualLoadIndex ?? -1, other.dualLoadIndex ?? -1) ||
      compare(this.speedRating ?? "\0", other.speedRating ?? "\0")
    );
  }
}

/**
 * Returns a masked tire dimension keeping the construction letter and the commercial
 * `C` visible, so `205/55R16` masks down to three stars, a slash, two stars, `R` and
 * two more stars. Load-related suffixes are masked in full.
 */
export function maskTireDimension(dimension: TireDimension): string {
  const rimMaskLength = Number.isInteger(dimension.rimDiameterInches) ? 2 : 4;
  let core = `***/**${dimension.construction}${"*".repeat(rimMaskLength)}`;
  if (dimension.isCommercial) core += "C";
  if (dimension.loadIndex === null) return core;

  let loadPart =
    dimension.dualLoadIndex !== null
      ? `${dimension.loadIndex}/${dimension.dualLoadIndex}`
      : `${dimension.loadIndex}`;
  if (dimension.speedRating !== null) loadPart += dimension.speedRating;

  return core + "*".repeat(loadPart.length + 1);
}

function build(d: TireDimension, spaced: boolean): string {
  const rim = Number.isInteger(d.rimDiameterInches)
    ? String(d.rimDiameterInches).padStart(2, "0")
    : d.rimDiameterInches.toFixed(1);

  const commercial = d.isCommercial ? (spaced ? " C" : "C") : "";
  const core = spaced
    ? `${d.widthMm}/${d.aspectRatio} ${d.construction} ${rim}${commercial}`
    : `${d.widthMm}/${d.aspectRatio}${d.construction}${rim}${commercial}`;

  if (d.loadIndex === null) return core;

  const load = d.dualLoadIndex !== null ? `${d.loadIndex}/${d.dualLoadIndex}` : `${d.loadIndex}`;
  return d.speedRating !== null ? `${core} ${load}${d.speedRating}` : `${core} ${load}`;
}

function compare(a: number | string, b: number | string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function fallback(
  input: string | null | undefined,
  options?: TireDimensionFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
