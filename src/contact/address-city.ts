import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { collapseWhitespace } from "../internal/input-sanitization.js";

const MAX_INPUT_LENGTH = 100;

const NAME_PATTERN =
  /^(?:[\p{L}\p{M}]{2,}|['\p{L}\p{M}]{2,}|[\p{Lo}])(?:['\p{Zs}-][\p{L}\p{M}]+)*$/u;

/**
 * The postal city (`postort`) is the locality associated with a postal code.
 * Normalization applies Swedish-aware title casing.
 */
export class AddressCity {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "City",
    localizedName: "Postort",
    emoji: "\u{1F3D9}\uFE0F",
    sources: Object.freeze(["https://www.postnord.se/"]),
  });

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static tryParse(input: string | null | undefined): AddressCity | null {
    if (input == null || input.trim() === "") return null;
    const cleaned = collapseWhitespace(input);
    if (cleaned.length === 0 || cleaned.length > MAX_INPUT_LENGTH) return null;
    const capitalized = capitalizeEachWord(cleaned);
    if ([...capitalized].some(isDisallowed)) return null;
    if (!NAME_PATTERN.test(capitalized)) return null;
    return new AddressCity(capitalized);
  }

  static parse(input: string): AddressCity {
    const r = AddressCity.tryParse(input);
    if (r === null) throw new Error("Invalid city name.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return AddressCity.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = AddressCity.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return AddressCity.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && AddressCity.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  equals(other: AddressCity | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: AddressCity | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function capitalizeEachWord(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map((w) => capitalizeHyphenated(w))
    .join(" ");
}

function capitalizeHyphenated(word: string): string {
  return word.split("-").map(capitalizeWord).join("-");
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  const culture = PrimitivesDefaults.culture;
  const lowered = word.toLocaleLowerCase(culture);
  for (let i = 0; i < lowered.length; i++) {
    if (/\p{L}/u.test(lowered[i]!)) {
      return lowered.slice(0, i) + lowered[i]!.toLocaleUpperCase(culture) + lowered.slice(i + 1);
    }
  }
  return lowered;
}

function isDisallowed(c: string): boolean {
  return /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}]/u.test(c);
}
