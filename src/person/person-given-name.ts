import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import {
  collapseWhitespace,
  normalizeCasing,
  validateGivenNames,
} from "./person-name-normalization.js";

const MAX_INPUT_LENGTH = 200;

/** A person's given names (`förnamn`). */
export class PersonGivenName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Given Name",
    localizedName: "Förnamn",
    emoji: "\u{270F}\uFE0F",
    sources: Object.freeze([
      "https://skatteverket.se/privat/folkbokforing/namn.4.18e1b10334ebe8bc80004083.html",
      "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20161013-om-personnamn_sfs-2016-1013/",
    ]),
  });

  readonly value: string;
  readonly names: readonly string[];
  readonly preferredName: string | null;

  private constructor(value: string, names: readonly string[], preferredName: string | null) {
    this.value = value;
    this.names = Object.freeze([...names]);
    this.preferredName = preferredName;
  }

  static tryParse(
    input: string | null | undefined,
    options?: { preferredName?: string | null },
  ): PersonGivenName | null {
    const collapsed = collapseWhitespace(input);
    if (collapsed.length === 0 || collapsed.length > MAX_INPUT_LENGTH) return null;
    const normalized = normalizeCasing(collapsed);
    if (!validateGivenNames(normalized)) return null;
    const names = normalized.split(" ").filter((p) => p !== "");
    let preferred: string | null = null;
    const preferredInput = options?.preferredName ?? null;
    if (preferredInput != null && preferredInput.trim() !== "") {
      const np = normalizeCasing(collapseWhitespace(preferredInput));
      const found = names.find((n) => n.toLowerCase() === np.toLowerCase()) ?? null;
      if (found === null) return null;
      preferred = found;
    }
    return new PersonGivenName(normalized, names, preferred);
  }

  static parse(input: string, options?: { preferredName?: string | null }): PersonGivenName {
    const r = PersonGivenName.tryParse(input, options);
    if (r === null) throw new Error("Invalid given name(s).");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return PersonGivenName.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = PersonGivenName.tryParse(input);
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
    return PersonGivenName.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && PersonGivenName.normalize(input) === input;
  }

  withPreferredName(preferredName: string): PersonGivenName {
    const found = this.names.find((n) => n.toLowerCase() === preferredName.toLowerCase()) ?? null;
    if (found === null) {
      throw new Error("Preferred name must be one of the given names.");
    }
    return new PersonGivenName(this.value, this.names, found);
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  equals(other: PersonGivenName | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: PersonGivenName | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}
