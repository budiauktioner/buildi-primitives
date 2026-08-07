import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { Country } from "../geography/index.js";
import { Address } from "./address.js";
import { AddressCity } from "./address-city.js";
import { AddressStreet } from "./address-street.js";
import {
  CountryAddressBase,
  ICountryAddress,
  ICountryAddressZipCode,
  tryWrapCountryAddress,
} from "./country-address.js";
import { CountryZipCodeStatic } from "./country-zip-code-factory.js";

export interface CountryAddressConfig<TZip extends ICountryAddressZipCode> {
  englishName: string;
  localizedName: string;
  emoji: string;
  sources: readonly string[];
  country: Country;
  invalidMessage: string;
  zipCode: CountryZipCodeStatic<TZip>;
}

class CountryAddress<TZip extends ICountryAddressZipCode> extends CountryAddressBase {
  readonly zipCode: TZip;
  constructor(street: AddressStreet, zipCode: TZip, city: AddressCity, address: Address) {
    super(street, city, address);
    this.zipCode = zipCode;
  }
  override get countryZipCode(): ICountryAddressZipCode {
    return this.zipCode;
  }
}

export interface CountryAddressStatic<TZip extends ICountryAddressZipCode> {
  readonly typeInfo: PrimitiveTypeInfo;
  readonly country: Country;
  /** The country's zip-code type. Used by the country-address registry. */
  readonly zipCodeType: CountryZipCodeStatic<TZip>;
  /** Wraps an already-parsed {@link Address}. Used by the country-address registry. */
  tryWrap(address: Address): (ICountryAddress & { readonly zipCode: TZip }) | null;
  tryParse(input: string | null | undefined): (ICountryAddress & { readonly zipCode: TZip }) | null;
  tryParseStructured(parts: {
    street: string | null | undefined;
    zipCode?: string | null;
    city?: string | null;
    country?: string | null;
  }): (ICountryAddress & { readonly zipCode: TZip }) | null;
  parse(input: string): ICountryAddress;
  isValid(input: string | null | undefined): boolean;
  format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null;
  normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null;
  isNormalized(input: string | null | undefined): boolean;
}

export function defineCountryAddress<TZip extends ICountryAddressZipCode>(
  config: CountryAddressConfig<TZip>,
): CountryAddressStatic<TZip> {
  const typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: config.englishName,
    localizedName: config.localizedName,
    emoji: config.emoji,
    sources: Object.freeze([...config.sources]),
  });

  const tryWrap = (address: Address): CountryAddress<TZip> | null =>
    tryWrapCountryAddress(
      address,
      config.country.alpha2Code,
      config.country,
      (v) => config.zipCode.tryParse(v),
      (s, z, c, a) => new CountryAddress<TZip>(s, z, c, a),
    );

  const tryParse = (input: string | null | undefined): CountryAddress<TZip> | null => {
    const a = Address.tryParse(input);
    if (a === null) return null;
    return tryWrap(a);
  };

  const stat: CountryAddressStatic<TZip> = {
    typeInfo,
    country: config.country,
    zipCodeType: config.zipCode,
    tryWrap,
    tryParse,
    tryParseStructured(parts) {
      const a = Address.tryParse(parts);
      if (a === null) return null;
      return tryWrap(a);
    },
    parse(input) {
      const r = tryParse(input);
      if (r === null) throw new Error(config.invalidMessage);
      return r;
    },
    isValid(input) {
      return tryParse(input) !== null;
    },
    format(input, options) {
      const r = tryParse(input);
      if (r) return r.toString();
      if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
        return input.trim();
      }
      return null;
    },
    normalize(input, options) {
      const r = tryParse(input);
      if (r) return r.toNormalizedString();
      if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
        const t = input.trim();
        return t.length > 0 ? t : null;
      }
      return null;
    },
    isNormalized(input) {
      return input != null && stat.normalize(input) === input;
    },
  };
  return stat;
}
