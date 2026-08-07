import { Country } from "../geography/index.js";
import { Address } from "./address.js";
import { AddressCity } from "./address-city.js";
import { AddressStreet } from "./address-street.js";
import { AddressZipCode } from "./address-zip-code.js";

/** Common interface for all country-specific zip code types. */
export interface ICountryAddressZipCode {
  readonly country: Country;
  readonly value: string;
  readonly formatted: string;
  readonly zipCode: AddressZipCode;
  toNormalizedString(): string;
  toString(): string;
}

/** Common interface for all country-specific address types. */
export interface ICountryAddress {
  readonly country: Country;
  readonly street: AddressStreet;
  readonly countryZipCode: ICountryAddressZipCode;
  readonly city: AddressCity;
  readonly address: Address;
  readonly careOf: string | null;
  readonly postBox: string | null;
  readonly isPostBox: boolean;
  readonly value: string;
  readonly formatted: string;
  toNormalizedString(): string;
  toMultilineString(): string;
  toString(): string;
}

/** Abstract base class for country-specific zip code types. */
export abstract class CountryAddressZipCodeBase implements ICountryAddressZipCode {
  readonly value: string;
  readonly formatted: string;
  readonly zipCode: AddressZipCode;

  abstract get country(): Country;

  protected constructor(value: string, formatted: string, zipCode: AddressZipCode) {
    this.value = value;
    this.formatted = formatted;
    this.zipCode = zipCode;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.formatted;
  }
}

/** Abstract base class for country-specific address types. */
export abstract class CountryAddressBase implements ICountryAddress {
  readonly street: AddressStreet;
  readonly city: AddressCity;
  readonly address: Address;

  abstract get countryZipCode(): ICountryAddressZipCode;

  get country(): Country {
    return this.address.country!;
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
  get value(): string {
    return this.toNormalizedString();
  }
  get formatted(): string {
    return this.toString();
  }

  protected constructor(street: AddressStreet, city: AddressCity, address: Address) {
    this.street = street;
    this.city = city;
    this.address = address;
  }

  toNormalizedString(): string {
    return this.address.toNormalizedString();
  }

  toString(): string {
    const parts: string[] = [];
    if (this.careOf) parts.push(`c/o ${this.careOf}`);
    parts.push(this.street.street);
    parts.push(`${this.countryZipCode.formatted} ${this.city.value}`);
    return parts.join(", ");
  }

  toMultilineString(): string {
    const lines: string[] = [];
    if (this.careOf) lines.push(`c/o ${this.careOf}`);
    lines.push(this.street.street);
    lines.push(`${this.countryZipCode.formatted} ${this.city.value}`);
    return lines.join("\n");
  }
}

/**
 * Validates and unwraps a generic {@link Address} for a specific country, then constructs
 * a typed country-specific address. Used by every `XxxAddress.tryParse` implementation.
 */
export function tryWrapCountryAddress<TZip, TAddr>(
  address: Address,
  alpha2: string,
  defaultCountry: Country,
  tryParseZip: (value: string) => TZip | null,
  factory: (street: AddressStreet, zip: TZip, city: AddressCity, address: Address) => TAddr,
): TAddr | null {
  if (address.country && address.country.alpha2Code.toUpperCase() !== alpha2.toUpperCase()) {
    return null;
  }
  if (address.zipCode === null || address.city === null) return null;
  const zip = tryParseZip(address.zipCode.value);
  if (zip === null) return null;
  const withCountry =
    address.country !== null
      ? address
      : new Address(address.street, address.zipCode, address.city, defaultCountry);
  return factory(address.street, zip, address.city, withCountry);
}
