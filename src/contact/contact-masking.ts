import { Address } from "./address.js";
import { AddressCity } from "./address-city.js";
import { AddressStreet } from "./address-street.js";
import { AddressZipCode } from "./address-zip-code.js";
import { PhoneNumber } from "./phone-number.js";
import { SwedishAddress } from "./swedish-address.js";
import { SwedishAddressZipCode } from "./swedish-address-zip-code.js";

const MASK = "*";

/** Mask each digit in a zip code while preserving spaces, e.g. `114 53` → `*** **`. */
export function maskAddressZipCode(zip: AddressZipCode): string {
  return [...zip.formatted].map((c) => (c === " " ? " " : MASK)).join("");
}

/** Mask Swedish zip code (delegates to the wrapped `AddressZipCode`). */
export function maskSwedishAddressZipCode(zip: SwedishAddressZipCode): string {
  return maskAddressZipCode(zip.zipCode);
}

/** Mask city name showing only the first character, e.g. `Stockholm` → `S********`. */
export function maskAddressCity(city: AddressCity): string {
  const v = city.value;
  if (v.length <= 1) return MASK.repeat(v.length);
  return v[0]! + MASK.repeat(v.length - 1);
}

/** Mask street keeping street name but masking the house number, e.g. `Storgatan 12` → `Storgatan **`. */
export function maskAddressStreet(street: AddressStreet): string {
  if (street.streetName === null) return MASK.repeat(street.street.length);
  if (street.streetNumber === null) return street.streetName;
  return `${street.streetName} ${MASK.repeat(street.streetNumber.length)}`;
}

/**
 * Mask a complete address, preserving street name, city, and country while masking
 * house number, apartment number, and zip code.
 */
export function maskAddress(address: Address): string {
  let out = "";
  if (address.careOf) out += `c/o ${maskKeepFirst(address.careOf, 1)}, `;
  if (address.isPostBox && address.postBox) {
    out += `Box ${MASK.repeat(address.postBox.length)}`;
  } else {
    if (address.street.streetName !== null) out += address.street.streetName;
    else out += address.street.street;
    if (address.street.streetNumber !== null) {
      out += ` ${MASK.repeat(address.street.streetNumber.length)}`;
    }
    if (address.apartmentNumber) {
      out += ` lgh ${MASK.repeat(address.apartmentNumber.length)}`;
    }
  }
  if (address.zipCode !== null) {
    out += ", ";
    out += maskAddressZipCode(address.zipCode);
  }
  if (address.city !== null) {
    out += address.zipCode !== null ? " " : ", ";
    out += address.city.value;
  }
  if (address.country !== null) {
    out += ", ";
    out += address.country.localizedName;
  }
  return out;
}

/** Mask a Swedish address (delegates to the wrapped generic `Address`). */
export function maskSwedishAddress(address: SwedishAddress): string {
  return maskAddress(address.address);
}

/**
 * Mask a phone number, keeping country/area code prefix and the last
 * `visibleDigitsAtEnd` digits visible.
 */
export function maskPhoneNumberDetailed(phone: PhoneNumber, visibleDigitsAtEnd = 2): string {
  const formatted = phone.toString();

  let visiblePrefix: number;
  if (phone.isSwedish) {
    const local = phone.toLocalString();
    const dash = local.indexOf("-");
    visiblePrefix = dash > 0 ? countDigits(local.slice(0, dash)) : 3;
  } else {
    visiblePrefix = phone.countryCallingCode.value.length;
  }

  const totalDigits = countDigits(formatted);
  const revealEnd = Math.min(
    Math.max(0, visibleDigitsAtEnd),
    Math.max(0, totalDigits - visiblePrefix),
  );
  const maskEnd = totalDigits - revealEnd;

  let digitIdx = 0;
  let out = "";
  for (const c of formatted) {
    if (c >= "0" && c <= "9") {
      if (digitIdx >= visiblePrefix && digitIdx < maskEnd) out += MASK;
      else out += c;
      digitIdx++;
    } else {
      out += c;
    }
  }
  return out;
}

function countDigits(s: string): number {
  let n = 0;
  for (const c of s) if (c >= "0" && c <= "9") n++;
  return n;
}

function maskKeepFirst(value: string, visible: number): string {
  if (value.length <= visible) return value;
  return value.slice(0, visible) + MASK.repeat(value.length - visible);
}
