import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import {
  collapseWhitespace,
  normalizeCasing,
  validateNamePart,
} from "./person-name-normalization.js";

const MAX_INPUT_LENGTH = 200;

/** A person's family name (`efternamn`). */
export class PersonFamilyName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Family Name",
    localizedName: "Efternamn",
    emoji: "\u{1F4DB}",
    sources: Object.freeze([
      "https://skatteverket.se/privat/folkbokforing/namn.4.18e1b10334ebe8bc80004083.html",
      "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20161013-om-personnamn_sfs-2016-1013/",
    ]),
  });

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static tryParse(input: string | null | undefined): PersonFamilyName | null {
    const collapsed = collapseWhitespace(input);
    if (collapsed.length === 0 || collapsed.length > MAX_INPUT_LENGTH) return null;
    const normalized = normalizeCasing(collapsed);
    if (!validateNamePart(normalized)) return null;
    return new PersonFamilyName(normalized);
  }

  static parse(input: string): PersonFamilyName {
    const r = PersonFamilyName.tryParse(input);
    if (r === null) throw new Error("Invalid family name.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return PersonFamilyName.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = PersonFamilyName.tryParse(input);
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
    return PersonFamilyName.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && PersonFamilyName.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  equals(other: PersonFamilyName | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: PersonFamilyName | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}
