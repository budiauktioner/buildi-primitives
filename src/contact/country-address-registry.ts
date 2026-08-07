import type { Country } from "../geography/index.js";
import type { Address } from "./address.js";
import type { ICountryAddress } from "./country-address.js";

/**
 * A country-specific address implementation, registered by the module that
 * defines it.
 *
 * `Address` lives below the country-specific address types in the import graph,
 * so it cannot reference them directly. Each implementation registers itself on
 * module load instead, mirroring the static registry the .NET `Address` type
 * builds at type-initialization time.
 *
 * Registration happens in `registerDefaultCountryAddresses()`, which every
 * package entry point calls via `contact/index.ts`. Code inside this package
 * that deep-imports `address.ts` alone will only see the countries it
 * registered itself.
 */
export interface CountryAddressRegistration {
  readonly country: Country;
  readonly tryWrap: (address: Address) => ICountryAddress | null;
  readonly formatZip: (value: string) => string | null;
}

const registry = new Map<string, CountryAddressRegistration>();

/** Registration order determines the order of `Address.supportedCountryAddressTypes`. */
export function registerCountryAddress(registration: CountryAddressRegistration): void {
  registry.set(registration.country.alpha2Code.toUpperCase(), registration);
}

export function getCountryAddressRegistration(
  alpha2Code: string,
): CountryAddressRegistration | null {
  return registry.get(alpha2Code.toUpperCase()) ?? null;
}

export function getRegisteredCountryAddressCountries(): readonly Country[] {
  return Object.freeze([...registry.values()].map((r) => r.country));
}
