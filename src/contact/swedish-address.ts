import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { Country } from "../geography/index.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { Address } from "./address.js";
import { AddressCity } from "./address-city.js";
import { AddressStreet } from "./address-street.js";
import type { ICountryAddressZipCode } from "./country-address.js";
import { SwedishAddressZipCode } from "./swedish-address-zip-code.js";

/** A Swedish address — street + 5-digit zip + city, all within Sweden. */
export class SwedishAddress {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Swedish Address",
    localizedName: "Svensk adress",
    emoji: "\u{1F1F8}\u{1F1EA}",
    sources: Object.freeze(["https://www.postnord.se/", "https://www.lantmateriet.se/"]),
  });

  readonly street: AddressStreet;
  readonly zipCode: SwedishAddressZipCode;
  readonly city: AddressCity;
  readonly address: Address;

  get country(): Country {
    return Country.Sweden;
  }
  /** The zip code as the country-agnostic {@link ICountryAddressZipCode} view. */
  get countryZipCode(): ICountryAddressZipCode {
    return this.zipCode;
  }
  get careOf(): string | null {
    return this.street.careOf;
  }
  get postBox(): string | null {
    return this.street.postBox;
  }
  get isPostBox(): boolean {
    return this.street.isPostBox;
  }
  get apartmentNumber(): string | null {
    return this.street.apartmentNumber;
  }
  get value(): string {
    return this.toNormalizedString();
  }
  get formatted(): string {
    return this.toString();
  }

  private constructor(
    street: AddressStreet,
    zipCode: SwedishAddressZipCode,
    city: AddressCity,
    address: Address,
  ) {
    this.street = street;
    this.zipCode = zipCode;
    this.city = city;
    this.address = address;
  }

  static tryParse(input: string | null | undefined): SwedishAddress | null;
  static tryParse(parts: {
    street: string | null | undefined;
    zipCode?: string | null;
    city?: string | null;
    country?: string | null;
  }): SwedishAddress | null;
  static tryParse(arg: unknown): SwedishAddress | null {
    const address =
      typeof arg === "object" && arg !== null
        ? Address.tryParse(arg as never)
        : Address.tryParse(arg as string | null | undefined);
    if (address === null) return null;
    return SwedishAddress.tryWrap(address);
  }

  static parse(input: string): SwedishAddress {
    const r = SwedishAddress.tryParse(input);
    if (r === null) {
      throw new Error(
        "Invalid Swedish address. Requires street, 5-digit zip code, and city within Sweden.",
      );
    }
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishAddress.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishAddress.tryParse(input);
    if (r) return r.toString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishAddress.tryParse(input);
    if (r) return r.toNormalizedString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishAddress.normalize(input) === input;
  }

  /**
   * Scans unstructured text for potential Swedish addresses.
   *
   * Results are heuristic candidates and can include false positives. Only
   * address candidates with a Swedish zip code and city are returned.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<SwedishAddress>[] {
    if (text.length === 0) return [];
    const results: TextCandidate<SwedishAddress>[] = [];

    for (const candidate of Address.findCandidatesInText(text)) {
      const value = SwedishAddress.tryWrap(candidate.value);
      if (!value) continue;
      results.push(
        new TextCandidate({
          startIndex: candidate.startIndex,
          length: candidate.length,
          originalText: candidate.originalText,
          typeName: "SwedishAddress",
          category: TextCandidateCategory.Contact,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: candidate.maskedForm,
          confidence: candidate.confidence,
          value,
        }),
      );
    }

    return results;
  }

  toNormalizedString(): string {
    return this.address.toNormalizedString();
  }

  toString(): string {
    const parts: string[] = [];
    if (this.careOf) parts.push(`c/o ${this.careOf}`);
    parts.push(this.buildStreetCoreLine());
    parts.push(`${this.zipCode.formatted} ${this.city.value}`);
    return parts.join(", ");
  }

  toMultilineString(): string {
    const lines: string[] = [];
    if (this.careOf) lines.push(`c/o ${this.careOf}`);
    lines.push(this.buildStreetCoreLine());
    lines.push(`${this.zipCode.formatted} ${this.city.value}`);
    return lines.join("\n");
  }

  private buildStreetCoreLine(): string {
    if (this.apartmentNumber) return `${this.street.street} lgh ${this.apartmentNumber}`;
    return this.street.street;
  }

  /** Wraps an already-parsed {@link Address}. Used by the country-address registry. */
  static tryWrap(address: Address): SwedishAddress | null {
    if (address.country && address.country.alpha2Code.toUpperCase() !== "SE") return null;
    if (address.zipCode === null || !address.zipCode.isSwedish) return null;
    if (address.city === null) return null;
    const swedishZip = SwedishAddressZipCode.tryParse(address.zipCode.value);
    if (swedishZip === null) return null;
    const withCountry =
      address.country !== null
        ? address
        : new Address(address.street, address.zipCode, address.city, Country.Sweden);
    return new SwedishAddress(address.street, swedishZip, address.city, withCountry);
  }
}
