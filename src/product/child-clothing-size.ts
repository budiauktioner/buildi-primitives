import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { ClothingSizeSystem } from "./clothing-size-system.js";

/** Options shared by the string-in, string-out helpers. */
export interface ChildClothingSizeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface ChildSizeLabels {
  readonly us: string;
  readonly uk: string;
  readonly ageRange: string;
}

/** EU height in centimetres with the US, UK and age labels the trade puts on it. */
const LABELS_BY_HEIGHT: readonly (readonly [number, ChildSizeLabels])[] = [
  [56, { us: "newborn", uk: "newborn", ageRange: "Newborn" }],
  [62, { us: "0-3m", uk: "0-3m", ageRange: "1-3 months" }],
  [68, { us: "3-6m", uk: "3-6m", ageRange: "3-6 months" }],
  [74, { us: "6-9m", uk: "6-9m", ageRange: "6-9 months" }],
  [80, { us: "12m", uk: "12-18m", ageRange: "9-12 months" }],
  [86, { us: "18m", uk: "18-24m", ageRange: "12-18 months" }],
  [92, { us: "2T", uk: "2-3", ageRange: "2-3 years" }],
  [98, { us: "3T", uk: "3-4", ageRange: "3-4 years" }],
  [104, { us: "4", uk: "4-5", ageRange: "4-5 years" }],
  [110, { us: "5", uk: "5-6", ageRange: "5-6 years" }],
  [116, { us: "6", uk: "6-7", ageRange: "6-7 years" }],
  [122, { us: "7", uk: "7-8", ageRange: "7-8 years" }],
  [128, { us: "8", uk: "8-9", ageRange: "8-9 years" }],
  [134, { us: "9", uk: "9-10", ageRange: "9-10 years" }],
  [140, { us: "10", uk: "10-11", ageRange: "10-11 years" }],
  [146, { us: "11", uk: "11-12", ageRange: "11-12 years" }],
  [152, { us: "12", uk: "12-13", ageRange: "12-13 years" }],
  [158, { us: "14", uk: "13-14", ageRange: "13-14 years" }],
  [164, { us: "16", uk: "14-15", ageRange: "14-15 years" }],
  [170, { us: "16-18", uk: "15-16", ageRange: "15-16 years" }],
  [176, { us: "16-18", uk: "15-16", ageRange: "15-16 years" }],
];

/** Midpoint age each height stands for, used to resolve an input given in years. */
const REPRESENTATIVE_AGE_YEARS: readonly number[] = [
  0, 0.2, 0.5, 0.65, 0.9, 1.25, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5,
  14.5, 15.5, 16.5,
];

const PREFIXED_EU_PATTERN = /^EU\s*(\d+)$/iu;
const PREFIXED_US_PATTERN = /^US\s*(.+)$/iu;
const PREFIXED_UK_PATTERN = /^UK\s*(.+)$/iu;
const CHILD_HEIGHT_PATTERN = /^(?:child|barn)\s+(\d+)$/iu;
const YEARS_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(?:years?|år)\s*$/iu;
const HEIGHT_RANGE_PATTERN = /^(?:(?:EU|child|barn)\s+)?(\d{2,3})\s*[/\-–—]\s*(\d{2,3})$/iu;
const BARE_NUMBER_PATTERN = /^\d+$/u;

const HEIGHTS = LABELS_BY_HEIGHT.map(([height]) => height);
const LABELS = new Map(LABELS_BY_HEIGHT);

const HEIGHT_BY_US_LABEL = buildReverseLookup((labels) => labels.us);
const HEIGHT_BY_UK_LABEL = buildReverseLookup((labels) => labels.uk);

/**
 * Children's clothing size (`barnklädesstorlek`) keyed on body height in centimetres, the EU
 * standard, with approximate US, UK and age labels alongside. A bare number is always read as an
 * EU height; US and UK labels need an explicit prefix. Ages and height ranges snap to the
 * closest standard height.
 */
export class ChildClothingSize {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Child Clothing Size",
    localizedName: "Barnklädesstorlek",
    emoji: "👶",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/EN_13402",
      "https://www.iso.org/standard/85084.html",
      "https://en.wikipedia.org/wiki/Clothing_sizes",
    ]),
  });

  /** Body height in centimetres, e.g. `128`. */
  readonly heightCm: number;

  /** EU size, which is the height as a string, e.g. `128`. */
  readonly euSize: string;

  /** Approximate US label, e.g. `8` or `3-6m`. */
  readonly usSize: string;

  /** Approximate UK label, e.g. `8-9` or `12-18m`. */
  readonly ukSize: string;

  /** Approximate age range label, e.g. `8-9 years`. */
  readonly ageRange: string;

  /** The sizing system the value was parsed from. */
  readonly system: ClothingSizeSystem;

  private constructor(heightCm: number, system: ClothingSizeSystem) {
    const labels = LABELS.get(heightCm)!;
    this.heightCm = heightCm;
    this.system = system;
    this.euSize = String(heightCm);
    this.usSize = labels.us;
    this.ukSize = labels.uk;
    this.ageRange = labels.ageRange;
  }

  private static create(heightCm: number, system: ClothingSizeSystem): ChildClothingSize | null {
    return LABELS.has(heightCm) ? new ChildClothingSize(heightCm, system) : null;
  }

  static tryParse(input: string | null | undefined): ChildClothingSize | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();
    if (text.length === 0) return null;

    const childPrefixed = CHILD_HEIGHT_PATTERN.exec(text);
    if (childPrefixed !== null) {
      const size = ChildClothingSize.create(Number(childPrefixed[1]), ClothingSizeSystem.EU);
      if (size !== null) return size;
    }

    const euPrefixed = PREFIXED_EU_PATTERN.exec(text);
    if (euPrefixed !== null) {
      const size = ChildClothingSize.create(Number(euPrefixed[1]), ClothingSizeSystem.EU);
      if (size !== null) return size;
    }

    const usPrefixed = PREFIXED_US_PATTERN.exec(text);
    if (usPrefixed !== null) {
      const height = HEIGHT_BY_US_LABEL.get(usPrefixed[1]!.trim().toLowerCase());
      if (height !== undefined) {
        const size = ChildClothingSize.create(height, ClothingSizeSystem.US);
        if (size !== null) return size;
      }
    }

    const ukPrefixed = PREFIXED_UK_PATTERN.exec(text);
    if (ukPrefixed !== null) {
      const height = HEIGHT_BY_UK_LABEL.get(ukPrefixed[1]!.trim().toLowerCase());
      if (height !== undefined) {
        const size = ChildClothingSize.create(height, ClothingSizeSystem.UK);
        if (size !== null) return size;
      }
    }

    const years = YEARS_PATTERN.exec(text);
    if (years !== null) {
      const value = Number(years[1]!.replace(",", "."));
      if (Number.isFinite(value)) {
        const size = ChildClothingSize.create(
          closestHeightForAge(value),
          ClothingSizeSystem.Unknown,
        );
        if (size !== null) return size;
      }
    }

    const range = HEIGHT_RANGE_PATTERN.exec(text);
    if (range !== null) {
      const low = Number(range[1]);
      const high = Number(range[2]);
      if (low < high && low >= 50 && high <= 185) {
        const size = ChildClothingSize.create(
          closestHeight((low + high) / 2),
          ClothingSizeSystem.EU,
        );
        if (size !== null) return size;
      }
    }

    if (BARE_NUMBER_PATTERN.test(text)) {
      const size = ChildClothingSize.create(Number(text), ClothingSizeSystem.EU);
      if (size !== null) return size;
    }

    return null;
  }

  static parse(input: string): ChildClothingSize {
    const result = ChildClothingSize.tryParse(input);
    if (result === null) throw new Error("Invalid child clothing size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ChildClothingSize.tryParse(input) !== null;
  }

  /** Returns the canonical form, e.g. `EU 128`. */
  static format(
    input: string | null | undefined,
    options?: ChildClothingSizeFormatOptions,
  ): string | null {
    const r = ChildClothingSize.tryParse(input);
    if (r !== null) return euDisplay(r.heightCm);
    return fallback(input, options);
  }

  /** Returns the canonical form, e.g. `EU 128`. */
  static normalize(
    input: string | null | undefined,
    options?: ChildClothingSizeFormatOptions,
  ): string | null {
    const r = ChildClothingSize.tryParse(input);
    if (r !== null) return euDisplay(r.heightCm);
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ChildClothingSize.normalize(input) === input;
  }

  toNormalizedString(): string {
    return euDisplay(this.heightCm);
  }

  toString(): string {
    return euDisplay(this.heightCm);
  }

  equals(other: ChildClothingSize | null | undefined): boolean {
    return other != null && this.heightCm === other.heightCm;
  }

  compareTo(other: ChildClothingSize | null | undefined): number {
    if (other == null) return 1;
    return this.heightCm < other.heightCm ? -1 : this.heightCm > other.heightCm ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: ChildClothingSizeFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function euDisplay(heightCm: number): string {
  return `EU ${heightCm}`;
}

function buildReverseLookup(pick: (labels: ChildSizeLabels) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const [height, labels] of LABELS_BY_HEIGHT) {
    const key = pick(labels).trim().toLowerCase();
    if (key.length > 0 && !map.has(key)) map.set(key, height);
  }
  return map;
}

/** Ties go to the taller height, matching the .NET tie-break. */
function closestHeightForAge(years: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [index, height] of HEIGHTS.entries()) {
    const distance = Math.abs(REPRESENTATIVE_AGE_YEARS[index]! - years);
    if (
      distance < bestDistance - 1e-9 ||
      (Math.abs(distance - bestDistance) < 1e-9 && height > best)
    ) {
      bestDistance = distance;
      best = height;
    }
  }
  return best;
}

function closestHeight(target: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const height of HEIGHTS) {
    const distance = Math.abs(height - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = height;
    }
  }
  return best;
}
