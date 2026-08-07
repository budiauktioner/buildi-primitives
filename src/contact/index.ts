import { registerDefaultCountryAddresses } from "./register-default-country-addresses.js";

registerDefaultCountryAddresses();

export { registerDefaultCountryAddresses } from "./register-default-country-addresses.js";
export { AddressCity } from "./address-city.js";
export { AddressStreet } from "./address-street.js";
export { AddressZipCode, maskZip } from "./address-zip-code.js";
export { Address } from "./address.js";
export { ContactAddress, ContactAddressBuilder } from "./contact-address.js";
export { PhoneCallingCode } from "./phone-calling-code.js";
export { PhoneNumber, maskPhoneNumber } from "./phone-number.js";
export { PhoneNumberTestData } from "./phone-number-test-data.js";
export { SwedishAddressZipCode } from "./swedish-address-zip-code.js";
export { SwedishAddress } from "./swedish-address.js";
export {
  CountryAddressBase,
  CountryAddressZipCodeBase,
  tryWrapCountryAddress,
} from "./country-address.js";
export type { ICountryAddress, ICountryAddressZipCode } from "./country-address.js";
export {
  maskAddress,
  maskAddressCity,
  maskAddressStreet,
  maskAddressZipCode,
  maskPhoneNumberDetailed,
  maskSwedishAddress,
  maskSwedishAddressZipCode,
} from "./contact-masking.js";
export { getGoogleMapsUrl, getBingMapsUrl, getHittaUrl } from "./contact-external-links.js";
export { getTelUri, getGoogleMapsUrlForAddress } from "./contact-lookup.js";
export * from "./country-zip-codes.js";
export * from "./country-addresses.js";
