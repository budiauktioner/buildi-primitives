import { Address } from "./address.js";
import { PhoneNumber } from "./phone-number.js";
import { SwedishAddress } from "./swedish-address.js";

/** Returns a `tel:` URI, e.g. `tel:0046701740633`. */
export function getTelUri(phone: PhoneNumber): string {
  return `tel:${phone.toNormalizedString()}`;
}

/** Google Maps search URL for an address. */
export function getGoogleMapsUrlForAddress(address: Address | SwedishAddress): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.toString())}`;
}
