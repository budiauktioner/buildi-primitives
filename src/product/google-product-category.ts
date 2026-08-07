import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options shared by the string-in, string-out helpers. */
export interface GoogleProductCategoryFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const MAX_INPUT_LENGTH = 1000;

/**
 * A Google product category path used by Google Shopping and Merchant Center, written as
 * `>`-separated segments such as `Animals & Pet Supplies > Pet Supplies > Bird Supplies`.
 *
 * Only the path structure is checked; the segments are not matched against Google's published
 * taxonomy, which changes over time.
 */
export class GoogleProductCategory {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Google Product Category",
    localizedName: "Google-produktkategori",
    emoji: "🏷️",
    sources: Object.freeze([
      "https://support.google.com/merchants/answer/6324436",
      "https://www.google.com/basepages/producttype/taxonomy.en-US.txt",
      "https://support.google.com/merchants/answer/160081",
    ]),
  });

  /** The full path in canonical form, e.g. `Animals & Pet Supplies > Pet Supplies`. */
  readonly path: string;

  /** The individual segments, e.g. `["Animals & Pet Supplies", "Pet Supplies"]`. */
  readonly segments: readonly string[];

  private constructor(segments: readonly string[]) {
    this.segments = Object.freeze([...segments]);
    this.path = this.segments.join(" > ");
  }

  /** The number of hierarchy levels, where 1 is a root category on its own. */
  get depth(): number {
    return this.segments.length;
  }

  /** The top-level category, e.g. `Animals & Pet Supplies`. */
  get rootCategory(): string {
    return this.segments[0]!;
  }

  /** The most specific category, e.g. `Bird Supplies`. */
  get leafCategory(): string {
    return this.segments[this.segments.length - 1]!;
  }

  static tryParse(input: string | null | undefined): GoogleProductCategory | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();
    if (text.length > MAX_INPUT_LENGTH) return null;

    const segments = text.split(">").map((part) => part.trim());
    if (segments.some((segment) => segment.length === 0)) return null;

    return new GoogleProductCategory(segments);
  }

  static parse(input: string): GoogleProductCategory {
    const result = GoogleProductCategory.tryParse(input);
    if (result === null) throw new Error("Invalid Google product category.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return GoogleProductCategory.tryParse(input) !== null;
  }

  /** Returns the path with canonical ` > ` separators. */
  static format(
    input: string | null | undefined,
    options?: GoogleProductCategoryFormatOptions,
  ): string | null {
    const r = GoogleProductCategory.tryParse(input);
    if (r !== null) return r.path;
    return fallback(input, options);
  }

  /** Returns the path with canonical ` > ` separators. */
  static normalize(
    input: string | null | undefined,
    options?: GoogleProductCategoryFormatOptions,
  ): string | null {
    const r = GoogleProductCategory.tryParse(input);
    if (r !== null) return r.path;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && GoogleProductCategory.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.path;
  }

  toString(): string {
    return this.path;
  }

  equals(other: GoogleProductCategory | null | undefined): boolean {
    return other != null && this.path === other.path;
  }

  /** Orders segment by segment, so a parent sorts before its children. */
  compareTo(other: GoogleProductCategory | null | undefined): number {
    if (other == null) return 1;

    const shared = Math.min(this.segments.length, other.segments.length);
    for (let i = 0; i < shared; i++) {
      const mine = this.segments[i]!;
      const theirs = other.segments[i]!;
      if (mine !== theirs) return mine < theirs ? -1 : 1;
    }

    return this.segments.length < other.segments.length
      ? -1
      : this.segments.length > other.segments.length
        ? 1
        : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: GoogleProductCategoryFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
