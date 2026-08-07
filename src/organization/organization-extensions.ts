import { SwedishCoordinationNumber, SwedishPersonalIdentityNumber } from "../person/index.js";
import { keepDigits } from "../internal/input-sanitization.js";
import { EuVatNumber } from "./eu-vat-number.js";
import { LeiCode } from "./lei-code.js";
import { SwedishOrganizationNumber } from "./swedish-organization-number.js";

/** Converts a PIN, coordination number, or SE VAT number to a Swedish organization number. */
export function toSwedishOrganizationNumber(
  value: SwedishPersonalIdentityNumber | SwedishCoordinationNumber | EuVatNumber,
): SwedishOrganizationNumber | null {
  if (
    value instanceof SwedishPersonalIdentityNumber ||
    value instanceof SwedishCoordinationNumber
  ) {
    return SwedishOrganizationNumber.parse(value.to12DigitString());
  }

  if (value.countryCode !== "SE") return null;
  const digits = keepDigits(value.body);
  if (digits.length !== 12 || !digits.endsWith("01")) return null;
  return SwedishOrganizationNumber.tryParse(digits.slice(0, 10));
}

/** Extracts a personal identity number from a person-based Swedish organization number or VAT number. */
export function toPersonalIdentityNumber(
  value: SwedishOrganizationNumber | EuVatNumber,
): SwedishPersonalIdentityNumber | null {
  const org = value instanceof EuVatNumber ? toSwedishOrganizationNumber(value) : value;
  if (!org?.isPerson) return null;
  return SwedishPersonalIdentityNumber.tryParse(org.to12DigitString());
}

/** Extracts a coordination number from a person-based Swedish organization number or VAT number. */
export function toCoordinationNumber(
  value: SwedishOrganizationNumber | EuVatNumber,
): SwedishCoordinationNumber | null {
  const org = value instanceof EuVatNumber ? toSwedishOrganizationNumber(value) : value;
  if (!org?.isPerson) return null;
  return SwedishCoordinationNumber.tryParse(org.to12DigitString());
}

/** Converts a Swedish organization number, PIN or coordination number to its corresponding SE VAT number. */
export function toEuVatNumber(
  value: SwedishOrganizationNumber | SwedishPersonalIdentityNumber | SwedishCoordinationNumber,
): EuVatNumber {
  const digits =
    value instanceof SwedishOrganizationNumber
      ? value.to10DigitsOnly()
      : keepDigits(value.to10DigitString());
  return EuVatNumber.parse(`SE${digits}01`);
}

/** Bolagsverket company information URL. */
export function getBolagsverketUrl(org: SwedishOrganizationNumber): URL {
  return new URL(
    `https://foretagsinfo.bolagsverket.se/sok-foretagsinformation-web/foretag/${org.to10DigitString()}`,
  );
}

/** Allabolag lookup URL using the normalized organization number. */
export function getAllabolagUrl(org: SwedishOrganizationNumber): string {
  return `https://www.allabolag.se/${org.toNormalizedString()}`;
}

/** Allabolag company information URL using the public 10-digit organization number. */
export function getAllabolagExternalUrl(org: SwedishOrganizationNumber): URL {
  return new URL(`https://www.allabolag.se/${org.to10DigitsOnly()}`);
}

/** EU VIES validation URL. */
export function toViesUrl(vat: EuVatNumber): string {
  return `https://ec.europa.eu/taxation_customs/vies/#/vat-validation/${vat.toNormalizedString()}`;
}

/** GLEIF record URL. */
export function getGleifUrl(lei: LeiCode): URL {
  return new URL(`https://search.gleif.org/#/record/${lei.toNormalizedString()}`);
}

/** GLEIF lookup URL as string. */
export function toGleifUrl(lei: LeiCode): string {
  return `https://search.gleif.org/#/record/${lei.toNormalizedString()}`;
}
