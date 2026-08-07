import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { AdultShoeSize } from "./adult-shoe-size.js";
import { ChildShoeSize } from "./child-shoe-size.js";

/** Options shared by the string-in, string-out helpers. */
export interface ShoeSizeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const ADULT_PREFIX_PATTERN = /^\s*(?:adult|vuxen)\s+/iu;
const CHILD_PREFIX_PATTERN = /^\s*(?:child|barn)\s+/iu;
const US_CHILD_HINT_PATTERN = /\bUS\s+[0-9]+(?:[.,][0-9]+)?\s*[CY]\b/iu;

/**
 * Generic shoe size (`skostorlek`) wrapping either an {@link AdultShoeSize} or a
 * {@link ChildShoeSize}, chosen by parsing heuristics.
 *
 * An explicit `adult`/`vuxen` or `child`/`barn` prefix forces the matching parser. US sizes with
 * a `C` or `Y` suffix are read as children's first; otherwise adult is tried before child, so an
 * unprefixed EU 35–39 resolves as adult.
 */
export class ShoeSize {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Shoe Size",
    localizedName: "Skostorlek",
    emoji: "👟",
    sources: Object.freeze([
      "https://www.iso.org/standard/83106.html",
      "https://www.iso.org/standard/71594.html",
      "https://en.wikipedia.org/wiki/Shoe_size",
    ]),
  });

  private readonly adult: AdultShoeSize | null;
  private readonly child: ChildShoeSize | null;

  private constructor(adult: AdultShoeSize | null, child: ChildShoeSize | null) {
    this.adult = adult;
    this.child = child;
  }

  /** `true` when this instance wraps an {@link AdultShoeSize}. */
  get isAdult(): boolean {
    return this.adult !== null;
  }

  /** `true` when this instance wraps a {@link ChildShoeSize}. */
  get isChild(): boolean {
    return this.child !== null;
  }

  /** Display form of the wrapped size, e.g. `EU 42` or `EU 28`. */
  get value(): string {
    return this.adult?.value ?? this.child!.value;
  }

  /** Returns the adult size when {@link isAdult}, otherwise `null`. */
  asAdult(): AdultShoeSize | null {
    return this.adult;
  }

  /** Returns the child size when {@link isChild}, otherwise `null`. */
  asChild(): ChildShoeSize | null {
    return this.child;
  }

  static tryParse(input: string | null | undefined): ShoeSize | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();

    const adultPrefix = ADULT_PREFIX_PATTERN.exec(text);
    if (adultPrefix !== null) {
      const adult = AdultShoeSize.tryParse(text.slice(adultPrefix[0].length).trim());
      return adult === null ? null : new ShoeSize(adult, null);
    }

    const childPrefix = CHILD_PREFIX_PATTERN.exec(text);
    if (childPrefix !== null) {
      const child = ChildShoeSize.tryParse(text.slice(childPrefix[0].length).trim());
      return child === null ? null : new ShoeSize(null, child);
    }

    if (US_CHILD_HINT_PATTERN.test(text)) {
      const child = ChildShoeSize.tryParse(text);
      if (child !== null) return new ShoeSize(null, child);

      const adult = AdultShoeSize.tryParse(text);
      return adult === null ? null : new ShoeSize(adult, null);
    }

    const adult = AdultShoeSize.tryParse(text);
    if (adult !== null) return new ShoeSize(adult, null);

    const child = ChildShoeSize.tryParse(text);
    return child === null ? null : new ShoeSize(null, child);
  }

  static parse(input: string): ShoeSize {
    const result = ShoeSize.tryParse(input);
    if (result === null) throw new Error("Invalid shoe size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ShoeSize.tryParse(input) !== null;
  }

  /** Returns the canonical EU display of the resolved kind, e.g. `EU 42` or `EU 28`. */
  static format(input: string | null | undefined, options?: ShoeSizeFormatOptions): string | null {
    const r = ShoeSize.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical EU display, the same as {@link format} for this wrapper. */
  static normalize(
    input: string | null | undefined,
    options?: ShoeSizeFormatOptions,
  ): string | null {
    const r = ShoeSize.tryParse(input);
    if (r !== null) return r.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ShoeSize.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ShoeSize | null | undefined): boolean {
    if (other == null) return false;
    if (this.adult !== null && other.adult !== null) return this.adult.equals(other.adult);
    if (this.child !== null && other.child !== null) return this.child.equals(other.child);
    return false;
  }

  compareTo(other: ShoeSize | null | undefined): number {
    if (other == null) return 1;
    if (this.child !== null && other.child !== null) return this.child.compareTo(other.child);
    if (this.adult !== null && other.adult !== null) return this.adult.compareTo(other.adult);
    return this.child !== null ? -1 : 1;
  }
}

function fallback(
  input: string | null | undefined,
  options?: ShoeSizeFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
