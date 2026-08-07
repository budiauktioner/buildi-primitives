import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { Country } from "../geography/index.js";
import { AddressZipCode } from "./address-zip-code.js";
import { CountryAddressZipCodeBase, ICountryAddressZipCode } from "./country-address.js";

export interface CountryZipCodeConfig {
  englishName: string;
  localizedName: string;
  emoji: string;
  sources: readonly string[];
  country: Country;
  invalidMessage: string;
  parseRaw: (input: string) => { value: string; formatted: string } | null;
}

export interface CountryZipCodeStatic<T extends ICountryAddressZipCode> {
  readonly typeInfo: PrimitiveTypeInfo;
  readonly country: Country;
  tryParse(input: string | null | undefined): T | null;
  parse(input: string): T;
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

class CountryZipCode extends CountryAddressZipCodeBase {
  readonly _country: Country;
  constructor(value: string, formatted: string, zipCode: AddressZipCode, country: Country) {
    super(value, formatted, zipCode);
    this._country = country;
  }
  override get country(): Country {
    return this._country;
  }
}

/**
 * Build a country-specific zip code class with static `tryParse`, `parse`,
 * `isValid`, `format`, `normalize`, `isNormalized`, and an `instanceof` guard.
 */
export function defineCountryZipCode(config: CountryZipCodeConfig): {
  Class: typeof CountryZipCode;
  static: CountryZipCodeStatic<CountryZipCode>;
} {
  const typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: config.englishName,
    localizedName: config.localizedName,
    emoji: config.emoji,
    sources: Object.freeze([...config.sources]),
  });

  function tryParse(input: string | null | undefined): CountryZipCode | null {
    if (input == null || input.trim() === "") return null;
    const r = config.parseRaw(input);
    if (r === null) return null;
    const az = AddressZipCode.tryParseInternational(r.formatted, config.country);
    if (az === null) return null;
    return new CountryZipCode(r.value, r.formatted, az, config.country);
  }

  const stat: CountryZipCodeStatic<CountryZipCode> = {
    typeInfo,
    country: config.country,
    tryParse,
    parse(input: string): CountryZipCode {
      const r = tryParse(input);
      if (r === null) throw new Error(config.invalidMessage);
      return r;
    },
    isValid(input) {
      return tryParse(input) !== null;
    },
    format(input, options) {
      const r = tryParse(input);
      if (r) return r.formatted;
      if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
        return input.trim();
      }
      return null;
    },
    normalize(input, options) {
      const r = tryParse(input);
      if (r) return r.value;
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
  return { Class: CountryZipCode, static: stat };
}

const onlyDigits = (s: string): string => [...s].filter((c) => c >= "0" && c <= "9").join("");

/** Helper: digits-only with fixed length, formatted == value. */
export function fixedDigits(length: number) {
  return (input: string): { value: string; formatted: string } | null => {
    const d = onlyDigits(input);
    if (d.length !== length) return null;
    return { value: d, formatted: d };
  };
}

/** Helper: digits-only, formatted with separator at given position (e.g. NN-NNN). */
export function digitsWithSeparator(length: number, splitAt: number, sep: string) {
  return (input: string): { value: string; formatted: string } | null => {
    const d = onlyDigits(input);
    if (d.length !== length) return null;
    return { value: d, formatted: d.slice(0, splitAt) + sep + d.slice(splitAt) };
  };
}

/** Helper: fixed digits, value is digits, formatted has space at split. */
export function digitsWithSpace(length: number, splitAt: number) {
  return digitsWithSeparator(length, splitAt, " ");
}

/** Helper: digits with prefix like `LV-NNNN`, value compact (no prefix), formatted with prefix. */
export function digitsWithPrefix(length: number, prefix: string) {
  return (input: string): { value: string; formatted: string } | null => {
    const cleaned = input.toUpperCase().replace(prefix, "").replace(/[\s-]/g, "");
    const d = onlyDigits(cleaned);
    if (d.length !== length) return null;
    return { value: d, formatted: `${prefix}${d}` };
  };
}

export { onlyDigits };
