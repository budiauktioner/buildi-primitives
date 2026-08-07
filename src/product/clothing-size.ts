import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { AdultClothingSize } from "./adult-clothing-size.js";
import { ChildClothingSize } from "./child-clothing-size.js";

/** Options shared by the string-in, string-out helpers. */
export interface ClothingSizeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const ADULT_PREFIXES: readonly string[] = ["adult", "vuxen"];
const CHILD_PREFIXES: readonly string[] = ["child", "barn"];

/**
 * Generic clothing size (`klädstorlek`) wrapping either an {@link AdultClothingSize} or a
 * {@link ChildClothingSize}, detected from the input or from an explicit `adult`/`vuxen` or
 * `child`/`barn` prefix.
 *
 * Letter sizes such as `M` and adult EU/US/UK ranges resolve as adult; child height in
 * centimetres such as `128` resolves as child when adult parsing does not apply.
 */
export class ClothingSize {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Clothing Size",
    localizedName: "Klädstorlek",
    emoji: "👕",
    sources: Object.freeze(["https://en.wikipedia.org/wiki/EN_13402"]),
  });

  private readonly adult: AdultClothingSize | null;
  private readonly child: ChildClothingSize | null;

  private constructor(adult: AdultClothingSize | null, child: ChildClothingSize | null) {
    this.adult = adult;
    this.child = child;
  }

  /** `true` when this instance wraps an {@link AdultClothingSize}. */
  get isAdult(): boolean {
    return this.adult !== null;
  }

  /** `true` when this instance wraps a {@link ChildClothingSize}. */
  get isChild(): boolean {
    return this.child !== null;
  }

  /** Display form of the wrapped size, e.g. `L` or `EU 128`. */
  get value(): string {
    return this.adult?.value ?? this.child!.toString();
  }

  /** Returns the adult size when {@link isAdult}, otherwise `null`. */
  asAdult(): AdultClothingSize | null {
    return this.adult;
  }

  /** Returns the child size when {@link isChild}, otherwise `null`. */
  asChild(): ChildClothingSize | null {
    return this.child;
  }

  static tryParse(input: string | null | undefined): ClothingSize | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();
    if (text.length === 0) return null;

    const adultBody = stripPrefixes(text, ADULT_PREFIXES);
    if (adultBody !== null) {
      const adult = AdultClothingSize.tryParse(adultBody);
      return adult === null ? null : new ClothingSize(adult, null);
    }

    const childBody = stripPrefixes(text, CHILD_PREFIXES);
    if (childBody !== null) {
      const child = ChildClothingSize.tryParse(childBody);
      return child === null ? null : new ClothingSize(null, child);
    }

    const adult = AdultClothingSize.tryParse(text);
    if (adult !== null) return new ClothingSize(adult, null);

    const child = ChildClothingSize.tryParse(text);
    return child === null ? null : new ClothingSize(null, child);
  }

  static parse(input: string): ClothingSize {
    const result = ClothingSize.tryParse(input);
    if (result === null) throw new Error("Invalid clothing size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ClothingSize.tryParse(input) !== null;
  }

  /** Returns the display form of the resolved kind, e.g. `L` or `EU 128`. */
  static format(input: string | null | undefined, options?: ClothingSizeFormatOptions): string | null {
    if (input == null || input.trim().length === 0) return null;

    const text = input.trim();

    const adultBody = stripPrefixes(text, ADULT_PREFIXES);
    if (adultBody !== null) return AdultClothingSize.format(adultBody, options);

    const childBody = stripPrefixes(text, CHILD_PREFIXES);
    if (childBody !== null) return ChildClothingSize.format(childBody, options);

    return AdultClothingSize.format(text, options) ?? ChildClothingSize.format(text, options);
  }

  /** Returns the canonical EU form of the resolved kind, e.g. `EU 40` or `EU 128`. */
  static normalize(
    input: string | null | undefined,
    options?: ClothingSizeFormatOptions,
  ): string | null {
    if (input == null || input.trim().length === 0) return null;

    const text = input.trim();

    const adultBody = stripPrefixes(text, ADULT_PREFIXES);
    if (adultBody !== null) return AdultClothingSize.normalize(adultBody);

    const childBody = stripPrefixes(text, CHILD_PREFIXES);
    if (childBody !== null) return ChildClothingSize.normalize(childBody);

    const normalized = AdultClothingSize.normalize(text) ?? ChildClothingSize.normalize(text);
    if (normalized !== null) return normalized;

    return options?.fallbackToTrimmedInputWhenInvalid === true ? text : null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    const size = ClothingSize.tryParse(input);
    if (size === null) return false;

    const trimmed = input!.trim();
    return size.isAdult
      ? AdultClothingSize.isNormalized(trimmed)
      : ChildClothingSize.isNormalized(trimmed);
  }

  toNormalizedString(): string {
    return (this.adult ?? this.child!).toNormalizedString();
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClothingSize | null | undefined): boolean {
    if (other == null) return false;
    if (this.adult !== null && other.adult !== null) return this.adult.equals(other.adult);
    if (this.child !== null && other.child !== null) return this.child.equals(other.child);
    return false;
  }

  compareTo(other: ClothingSize | null | undefined): number {
    if (other == null) return 1;
    if (this.child !== null && other.child !== null) return this.child.compareTo(other.child);
    if (this.adult !== null && other.adult !== null) return this.adult.compareTo(other.adult);
    return this.child !== null ? -1 : 1;
  }
}

/**
 * Strips the first matching prefix when it stands as a whole word at the start, returning the
 * remainder, or `null` when no prefix applies.
 */
function stripPrefixes(text: string, prefixes: readonly string[]): string | null {
  for (const prefix of prefixes) {
    if (text.length < prefix.length) continue;
    if (text.slice(0, prefix.length).toLowerCase() !== prefix) continue;
    if (text.length === prefix.length) return "";
    if (!/\s/u.test(text.charAt(prefix.length))) continue;
    return text.slice(prefix.length).trimStart();
  }

  return null;
}
