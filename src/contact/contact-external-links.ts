import { Address } from "./address.js";
import { PhoneNumber } from "./phone-number.js";
import { SwedishAddress } from "./swedish-address.js";

/** Google Maps search URL for an address. */
export function getGoogleMapsUrl(address: Address | SwedishAddress): URL {
  return new URL(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.toString())}`,
  );
}

/** Bing Maps search URL for an address. */
export function getBingMapsUrl(address: Address | SwedishAddress): URL {
  return new URL(`https://www.bing.com/maps?q=${encodeURIComponent(address.toString())}`);
}

/** Hitta.se search URL for a phone number. */
export function getHittaUrl(phone: PhoneNumber): URL {
  return new URL(
    `https://www.hitta.se/sök?vad=${encodeURIComponent(phone.toInternationalString())}`,
  );
}
