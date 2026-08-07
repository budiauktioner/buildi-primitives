import { Country } from "../geography/index.js";
import * as A from "./country-addresses.js";
import { registerCountryAddress } from "./country-address-registry.js";
import { SwedishAddress } from "./swedish-address.js";
import { SwedishAddressZipCode } from "./swedish-address-zip-code.js";

let registered = false;

/**
 * Registers every built-in country-specific address type so that
 * `Address.asCountryAddress()` and `Address.supportedCountryAddressTypes`
 * resolve them.
 *
 * This is an explicit call rather than module-load side effects because the
 * package declares `sideEffects: false`; a bundler is free to drop a module
 * that is only imported for its side effects.
 */
export function registerDefaultCountryAddresses(): void {
  if (registered) return;
  registered = true;

  // Sweden first, matching the .NET registry order.
  registerCountryAddress({
    country: Country.Sweden,
    tryWrap: (address) => SwedishAddress.tryWrap(address),
    formatZip: (value) => SwedishAddressZipCode.format(value),
  });

  for (const countryAddress of [
    A.NorwegianAddress,
    A.FinnishAddress,
    A.DanishAddress,
    A.GermanAddress,
    A.PolishAddress,
    A.EstonianAddress,
    A.LithuanianAddress,
    A.RomanianAddress,
    A.BulgarianAddress,
    A.LatvianAddress,
    A.CzechAddress,
    A.SpanishAddress,
    A.DutchAddress,
    A.GreekAddress,
    A.ItalianAddress,
    A.SlovenianAddress,
    A.CroatianAddress,
    A.PortugueseAddress,
    A.HungarianAddress,
    A.FrenchAddress,
    A.SlovakAddress,
    A.BelgianAddress,
    A.BritishAddress,
    A.AustrianAddress,
    A.CypriotAddress,
    A.IcelandicAddress,
    A.SwissAddress,
    A.IrishAddress,
    A.LuxembourgishAddress,
    A.MalteseAddress,
    A.LiechtensteinAddress,
  ]) {
    registerCountryAddress({
      country: countryAddress.country,
      tryWrap: (address) => countryAddress.tryWrap(address),
      formatZip: (value) => countryAddress.zipCodeType.format(value),
    });
  }
}
