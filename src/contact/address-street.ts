import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { collapseWhitespace } from "../internal/input-sanitization.js";

const MAX_INPUT_LENGTH = 200;

const ADDRESS_PATTERN = /^[\p{L}0-9\s,.:'/-]+$/u;
const CARE_OF = /^c[/.]o\.?\s+/i;
const APARTMENT = /[,\s]+(?:lgh\.?|lägenhet|apt\.?)\s*(\d+\w*)\s*$/iu;
const BOX = /^(?:p\.?o\.?\s*)?box\s+(\d{1,7})\s*$/i;
const STREET_NUMBER = /^(.*?)\s+(\d+[A-ZÅÄÖ]*)$/u;

/**
 * A street address (`gatuadress`). Extracts care-of (c/o), apartment number
 * (lgh/apt), and post box (Box) when present.
 */
export class AddressStreet {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Street Address",
    localizedName: "Gatuadress",
    emoji: "\u{1F6E3}\uFE0F",
    sources: Object.freeze(["https://www.lantmateriet.se/"]),
  });

  readonly street: string;
  readonly streetName: string | null;
  readonly streetNumber: string | null;
  readonly apartmentNumber: string | null;
  readonly careOf: string | null;
  readonly postBox: string | null;

  private constructor(
    street: string,
    streetName: string | null,
    streetNumber: string | null,
    apartmentNumber: string | null,
    careOf: string | null,
    postBox: string | null,
  ) {
    this.street = street;
    this.streetName = streetName;
    this.streetNumber = streetNumber;
    this.apartmentNumber = apartmentNumber;
    this.careOf = careOf;
    this.postBox = postBox;
  }

  get isPostBox(): boolean {
    return this.postBox !== null;
  }

  static tryParse(
    input: string | null | undefined,
    options?: { city?: string | null; zipCode?: string | null },
  ): AddressStreet | null {
    if (input == null || input.trim() === "") return null;

    let text = collapseWhitespace(input);
    if (text.length === 0 || text.length > MAX_INPUT_LENGTH) return null;

    let careOf: string | null = null;
    const co = text.match(CARE_OF);
    if (co) {
      const after = text.slice(co[0].length);
      const comma = after.indexOf(",");
      if (comma >= 0) {
        careOf = after.slice(0, comma).trim();
        text = after.slice(comma + 1).trim();
      } else {
        careOf = after.trim();
        text = "";
      }
      if (careOf.trim() === "") careOf = null;
    }

    if (text.trim() !== "") {
      const boxText = collapseWhitespace(text.replace(/,/g, " "));
      const boxMatch = boxText.match(BOX);
      if (boxMatch) {
        const postBox = boxMatch[1]!;
        return new AddressStreet(`Box ${postBox}`, null, null, null, careOf, postBox);
      }
    }

    if (text.trim() === "") {
      if (careOf !== null) {
        return new AddressStreet(`c/o ${careOf}`, null, null, null, careOf, null);
      }
      return null;
    }

    let apartment: string | null = null;
    const apt = text.match(APARTMENT);
    if (apt) {
      apartment = apt[1]!;
      text = text.slice(0, apt.index!).trim();
    }

    const normalized = normalizeStreet(text, options?.city ?? null, options?.zipCode ?? null);
    if (!validateStreet(normalized)) return null;

    let streetName: string | null = null;
    let streetNumber: string | null = null;
    const num = normalized.match(STREET_NUMBER);
    if (num) {
      streetName = num[1]!;
      streetNumber = num[2]!;
    }

    return new AddressStreet(normalized, streetName, streetNumber, apartment, careOf, null);
  }

  static parse(input: string): AddressStreet {
    const r = AddressStreet.tryParse(input);
    if (r === null) throw new Error("Invalid street address.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return AddressStreet.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = AddressStreet.tryParse(input);
    if (r) return r.street;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return AddressStreet.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && AddressStreet.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.street;
  }
  toString(): string {
    return this.street;
  }

  equals(other: AddressStreet | null | undefined): boolean {
    return other != null && this.street === other.street;
  }
  compareTo(other: AddressStreet | null | undefined): number {
    if (other == null) return 1;
    return this.street < other.street ? -1 : this.street > other.street ? 1 : 0;
  }
}

function normalizeStreet(input: string, city: string | null, zip: string | null): string {
  let cleaned = collapseWhitespace(input);
  if (cleaned === "") return "";
  cleaned = collapseWhitespace(cleaned.replace(/,/g, " "));
  cleaned = cleaned.replace(/(\p{L})(\d+\p{L}*)$/u, "$1 $2");
  cleaned = collapseWhitespace(cleaned);
  let stripped = removeTrailingCityAndZip(cleaned, city, zip);
  if (shouldSentenceCase(stripped)) stripped = toSentenceCase(stripped);
  stripped = uppercaseHouseNumberSuffixes(stripped);
  return stripped;
}

function validateStreet(addr: string): boolean {
  if (!addr || addr.trim() === "") return false;
  if (/[\p{Cc}]/u.test(addr)) return false;
  if (addr !== addr.trim()) return false;
  if (addr.includes("  ")) return false;
  if (addr.length < 5 || addr.length > 50) return false;
  if (/[\p{Cn}]/u.test(addr)) return false;
  return ADDRESS_PATTERN.test(addr);
}

function shouldSentenceCase(input: string): boolean {
  if (!input || input.trim() === "") return false;
  const letters = [...input].filter((c) => /\p{L}/u.test(c));
  if (letters.length === 0) return false;
  const allUpper = letters.every((c) => c === c.toLocaleUpperCase(PrimitivesDefaults.culture));
  let firstLetterIndex = -1;
  for (let i = 0; i < input.length; i++) {
    if (/\p{L}/u.test(input[i]!)) {
      firstLetterIndex = i;
      break;
    }
  }
  if (firstLetterIndex === -1) return allUpper;
  const startsWithUpper =
    input[firstLetterIndex] ===
    input[firstLetterIndex]!.toLocaleUpperCase(PrimitivesDefaults.culture);
  return allUpper || !startsWithUpper;
}

function toSentenceCase(input: string): string {
  if (!input || input.trim() === "") return "";
  const culture = PrimitivesDefaults.culture;
  const lowered = input.toLocaleLowerCase(culture);
  let out = lowered;
  for (let i = 0; i < lowered.length; i++) {
    if (/\p{L}/u.test(lowered[i]!)) {
      out = lowered.slice(0, i) + lowered[i]!.toLocaleUpperCase(culture) + lowered.slice(i + 1);
      break;
    }
  }
  return uppercaseHouseNumberSuffixes(out);
}

function uppercaseHouseNumberSuffixes(input: string): string {
  return input.replace(
    /(\d+)(\p{L}+)(?=[^\p{L}\d]|$)/gu,
    (_, d: string, s: string) => d + s.toLocaleUpperCase(PrimitivesDefaults.culture),
  );
}

function removeTrailingCityAndZip(street: string, city: string | null, zip: string | null): string {
  const cityNorm = city == null ? "" : collapseWhitespace(city);
  const zipNorm = zip == null ? "" : collapseWhitespace(zip);
  const cityU = cityNorm.toUpperCase();
  const zipU = zipNorm.toUpperCase();
  const zipNoSpaceU = zipNorm.replace(/ /g, "").toUpperCase();
  const orig = collapseWhitespace(street.replace(/,/g, " "));
  const upper = orig.toUpperCase();

  const has = (s: string) => s.length > 0;
  const removeTail = (s: string, tail: number) =>
    tail <= 0 || tail > s.length ? s : collapseWhitespace(s.slice(0, s.length - tail));

  if (has(cityU) && has(zipU) && upper.endsWith(` ${zipU} ${cityU}`))
    return removeTail(orig, (zipU + " " + cityU).length);
  if (has(cityU) && has(zipNoSpaceU) && upper.endsWith(` ${zipNoSpaceU} ${cityU}`))
    return removeTail(orig, (zipNoSpaceU + " " + cityU).length);
  if (has(cityU) && has(zipU) && upper.endsWith(` ${cityU} ${zipU}`))
    return removeTail(orig, (cityU + " " + zipU).length);
  if (has(cityU) && has(zipNoSpaceU) && upper.endsWith(` ${cityU} ${zipNoSpaceU}`))
    return removeTail(orig, (cityU + " " + zipNoSpaceU).length);
  if (has(cityU) && upper.endsWith(` ${cityU}`)) return removeTail(orig, cityU.length);
  if (has(zipU) && upper.endsWith(` ${zipU}`)) return removeTail(orig, zipU.length);
  if (has(zipNoSpaceU) && upper.endsWith(` ${zipNoSpaceU}`))
    return removeTail(orig, zipNoSpaceU.length);
  return orig;
}
