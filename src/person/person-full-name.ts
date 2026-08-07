import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { collapseWhitespace } from "./person-name-normalization.js";
import { PersonGivenName } from "./person-given-name.js";
import { PersonFamilyName } from "./person-family-name.js";

const MAX_INPUT_LENGTH = 500;

/** A person's full name (`fullständigt namn`). */
export class PersonFullName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Full Name",
    localizedName: "Fullständigt namn",
    emoji: "\u{1F4C7}",
    sources: Object.freeze([
      "https://skatteverket.se/privat/folkbokforing/namn.4.18e1b10334ebe8bc80004083.html",
      "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20161013-om-personnamn_sfs-2016-1013/",
    ]),
  });

  readonly givenName: PersonGivenName;
  readonly familyName: PersonFamilyName;
  readonly value: string;

  get preferredName(): string | null {
    return this.givenName.preferredName;
  }

  private constructor(given: PersonGivenName, family: PersonFamilyName, value: string) {
    this.givenName = given;
    this.familyName = family;
    this.value = value;
  }

  static create(givenName: PersonGivenName, familyName: PersonFamilyName): PersonFullName {
    return new PersonFullName(givenName, familyName, `${givenName.value} ${familyName.value}`);
  }

  static tryParse(
    input: string | null | undefined,
    options?: { preferredName?: string | null },
  ): PersonFullName | null {
    const collapsed = collapseWhitespace(input);
    if (collapsed.length === 0 || collapsed.length > MAX_INPUT_LENGTH) return null;
    const tokens = collapsed.split(" ").filter((t) => t !== "");
    if (tokens.length < 2) return null;
    const givenPart = tokens.slice(0, tokens.length - 1).join(" ");
    const given = PersonGivenName.tryParse(givenPart, options);
    if (given === null) return null;
    const family = PersonFamilyName.tryParse(tokens[tokens.length - 1]!);
    if (family === null) return null;
    return new PersonFullName(given, family, `${given.value} ${family.value}`);
  }

  static parse(input: string, options?: { preferredName?: string | null }): PersonFullName {
    const r = PersonFullName.tryParse(input, options);
    if (r === null) {
      throw new Error("Invalid full name. Must contain at least given name(s) and a family name.");
    }
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return PersonFullName.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = PersonFullName.tryParse(input);
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
    return PersonFullName.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && PersonFullName.normalize(input) === input;
  }

  withPreferredName(preferredName: string): PersonFullName {
    const given = this.givenName.withPreferredName(preferredName);
    return new PersonFullName(given, this.familyName, this.value);
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  equals(other: PersonFullName | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: PersonFullName | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}
