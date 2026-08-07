import {
  Address,
  AddressCity,
  AddressStreet,
  AddressZipCode,
  PhoneNumber,
  SwedishAddress,
  SwedishAddressZipCode,
  maskAddress,
  maskAddressCity,
  maskAddressStreet,
  maskAddressZipCode,
  maskPhoneNumber,
  maskSwedishAddress,
} from "@budiauktioner/buildi-primitives/contact";
import {
  PersonAge,
  PersonFamilyName,
  PersonFullName,
  PersonGivenName,
  SwedishCoordinationNumber,
  SwedishPersonalIdentityNumber,
  maskCoordinationNumber,
  maskFamilyName,
  maskFullName,
  maskGivenName,
  maskPersonalIdentityNumber,
} from "@budiauktioner/buildi-primitives/person";
import {
  DunsNumber,
  EuVatNumber,
  LeiCode,
  SwedishCfarNumber,
  SwedishOrganizationName,
  SwedishOrganizationNumber,
  SwedishSniCode,
  maskDunsNumber,
  maskEuVatNumber,
  maskLeiCode,
  maskSwedishCfarNumber,
  maskSwedishOrganizationNumber,
} from "@budiauktioner/buildi-primitives/organization";
import {
  Continent,
  Country,
  GeoCoordinate,
  Language,
  SwedishCounty,
  SwedishMunicipality,
  maskGeoCoordinate,
  maskLanguage,
  maskSwedishCounty,
  maskSwedishMunicipality,
} from "@budiauktioner/buildi-primitives/geography";
import { EmailAddress, Url, maskEmailAddress, maskUrl } from "@budiauktioner/buildi-primitives/web";
import {
  Currency,
  Isin,
  MoneyAmount,
  maskIsin,
  maskMoneyAmount,
} from "@budiauktioner/buildi-primitives/finance";
import {
  SwedishPropertyDesignation,
  SwedishPropertyTaxationCode,
  maskSwedishPropertyDesignation,
} from "@budiauktioner/buildi-primitives/property";
import {
  Bic,
  Iban,
  SwedishBank,
  SwedishBankAccount,
  SwedishBankAccountHolderName,
  SwedishBankClearingNumber,
  SwedishBankgiroNumber,
  SwedishBankingNumberParser,
  SwedishOcrReferenceNumber,
  SwedishPostgiroNumber,
  SwedishSwishNumber,
  maskBic,
  maskIban,
  maskSwedishBankAccount,
  maskSwedishBankAccountHolderName,
  maskSwedishBankClearingNumber,
  maskSwedishBankgiroNumber,
  maskSwedishOcrReferenceNumber,
  maskSwedishPostgiroNumber,
  maskSwedishSwishNumber,
} from "@budiauktioner/buildi-primitives/banking";

export type Category =
  | "Contact"
  | "Person"
  | "Organization"
  | "Geography"
  | "Web"
  | "Finance"
  | "Property"
  | "Banking";

export interface TypeEntry {
  readonly name: string;
  readonly category: Category;
  readonly emoji: string;
  readonly sample: string;
  readonly isValid: (input: string) => boolean;
  readonly format: (input: string) => string | null;
  readonly normalize: (input: string) => string | null;
  readonly isNormalized: (input: string) => boolean;
  readonly mask?: (input: string) => string | null;
  readonly properties?: (input: string) => readonly string[] | null;
}

function meta(
  ...items: ReadonlyArray<string | null | undefined | false>
): readonly string[] | null {
  const out = items.filter((s): s is string => typeof s === "string" && s.length > 0);
  return out.length === 0 ? null : out;
}

export const TYPE_REGISTRY: readonly TypeEntry[] = [
  // ── Contact ─────────────────────────────────────────────
  {
    name: "PhoneNumber",
    category: "Contact",
    emoji: PhoneNumber.typeInfo.emoji,
    sample: "+46 70 174 06 33",
    isValid: PhoneNumber.isValid,
    format: PhoneNumber.format,
    normalize: PhoneNumber.normalize,
    isNormalized: PhoneNumber.isNormalized,
    mask: (s) => {
      const v = PhoneNumber.tryParse(s);
      return v ? maskPhoneNumber(v) : null;
    },
    properties: (s) => {
      const v = PhoneNumber.tryParse(s);
      if (!v) return null;
      return meta(
        v.country ? `Country: ${v.country.englishName}` : null,
        `CallingCode: +${v.countryCallingCode.value}`,
        v.isMobile ? "Mobile: yes" : null,
      );
    },
  },
  {
    name: "AddressStreet",
    category: "Contact",
    emoji: AddressStreet.typeInfo.emoji,
    sample: "Storgatan 12",
    isValid: AddressStreet.isValid,
    format: AddressStreet.format,
    normalize: AddressStreet.normalize,
    isNormalized: AddressStreet.isNormalized,
    mask: (s) => {
      const v = AddressStreet.tryParse(s);
      return v ? maskAddressStreet(v) : null;
    },
    properties: (s) => {
      const v = AddressStreet.tryParse(s);
      if (!v) return null;
      return meta(
        v.streetName ? `Street: ${v.streetName}` : null,
        v.streetNumber ? `Number: ${v.streetNumber}` : null,
      );
    },
  },
  {
    name: "AddressZipCode",
    category: "Contact",
    emoji: AddressZipCode.typeInfo.emoji,
    sample: "114 53",
    isValid: AddressZipCode.isValid,
    format: AddressZipCode.format,
    normalize: AddressZipCode.normalize,
    isNormalized: AddressZipCode.isNormalized,
    mask: (s) => {
      const v = AddressZipCode.tryParse(s);
      return v ? maskAddressZipCode(v) : null;
    },
  },
  {
    name: "SwedishAddressZipCode",
    category: "Contact",
    emoji: SwedishAddressZipCode.typeInfo.emoji,
    sample: "114 53",
    isValid: SwedishAddressZipCode.isValid,
    format: SwedishAddressZipCode.format,
    normalize: SwedishAddressZipCode.normalize,
    isNormalized: SwedishAddressZipCode.isNormalized,
  },
  {
    name: "AddressCity",
    category: "Contact",
    emoji: AddressCity.typeInfo.emoji,
    sample: "Stockholm",
    isValid: AddressCity.isValid,
    format: AddressCity.format,
    normalize: AddressCity.normalize,
    isNormalized: AddressCity.isNormalized,
    mask: (s) => {
      const v = AddressCity.tryParse(s);
      return v ? maskAddressCity(v) : null;
    },
  },
  {
    name: "Address",
    category: "Contact",
    emoji: Address.typeInfo.emoji,
    sample: "Storgatan 12, 114 53 Stockholm, Sverige",
    isValid: Address.isValid,
    format: Address.format,
    normalize: Address.normalize,
    isNormalized: Address.isNormalized,
    mask: (s) => {
      const v = Address.tryParse(s);
      return v ? maskAddress(v) : null;
    },
    properties: (s) => {
      const v = Address.tryParse(s);
      if (!v) return null;
      return meta(
        v.street ? `Street: ${v.street.street}` : null,
        v.zipCode ? `Zip: ${v.zipCode.formatted}` : null,
        v.city ? `City: ${v.city.value}` : null,
        v.country ? `Country: ${v.country.englishName}` : null,
      );
    },
  },
  {
    name: "SwedishAddress",
    category: "Contact",
    emoji: SwedishAddress.typeInfo.emoji,
    sample: "Storgatan 12, 114 53 Stockholm",
    isValid: SwedishAddress.isValid,
    format: SwedishAddress.format,
    normalize: SwedishAddress.normalize,
    isNormalized: SwedishAddress.isNormalized,
    mask: (s) => {
      const v = SwedishAddress.tryParse(s);
      return v ? maskSwedishAddress(v) : null;
    },
  },

  // ── Person ──────────────────────────────────────────────
  {
    name: "SwedishPersonalIdentityNumber",
    category: "Person",
    emoji: SwedishPersonalIdentityNumber.typeInfo.emoji,
    sample: "19900807-2392",
    isValid: SwedishPersonalIdentityNumber.isValid,
    format: SwedishPersonalIdentityNumber.format,
    normalize: SwedishPersonalIdentityNumber.normalize,
    isNormalized: SwedishPersonalIdentityNumber.isNormalized,
    mask: (s) => {
      const v = SwedishPersonalIdentityNumber.tryParse(s);
      return v ? maskPersonalIdentityNumber(v) : null;
    },
    properties: (s) => {
      const v = SwedishPersonalIdentityNumber.tryParse(s);
      if (!v) return null;
      return meta(
        `Born: ${v.dateOfBirthHint.toISOString().slice(0, 10)}`,
        `Age: ${v.ageHint}`,
        `Gender: ${v.genderHint}`,
      );
    },
  },
  {
    name: "SwedishCoordinationNumber",
    category: "Person",
    emoji: SwedishCoordinationNumber.typeInfo.emoji,
    sample: "19811263-2391",
    isValid: SwedishCoordinationNumber.isValid,
    format: SwedishCoordinationNumber.format,
    normalize: SwedishCoordinationNumber.normalize,
    isNormalized: SwedishCoordinationNumber.isNormalized,
    mask: (s) => {
      const v = SwedishCoordinationNumber.tryParse(s);
      return v ? maskCoordinationNumber(v) : null;
    },
  },
  {
    name: "PersonGivenName",
    category: "Person",
    emoji: PersonGivenName.typeInfo.emoji,
    sample: "Anna Maria",
    isValid: PersonGivenName.isValid,
    format: PersonGivenName.format,
    normalize: PersonGivenName.normalize,
    isNormalized: PersonGivenName.isNormalized,
    mask: (s) => {
      const v = PersonGivenName.tryParse(s);
      return v ? maskGivenName(v) : null;
    },
  },
  {
    name: "PersonFamilyName",
    category: "Person",
    emoji: PersonFamilyName.typeInfo.emoji,
    sample: "Andersson",
    isValid: PersonFamilyName.isValid,
    format: PersonFamilyName.format,
    normalize: PersonFamilyName.normalize,
    isNormalized: PersonFamilyName.isNormalized,
    mask: (s) => {
      const v = PersonFamilyName.tryParse(s);
      return v ? maskFamilyName(v) : null;
    },
  },
  {
    name: "PersonFullName",
    category: "Person",
    emoji: PersonFullName.typeInfo.emoji,
    sample: "Anna Andersson",
    isValid: PersonFullName.isValid,
    format: PersonFullName.format,
    normalize: PersonFullName.normalize,
    isNormalized: PersonFullName.isNormalized,
    mask: (s) => {
      const v = PersonFullName.tryParse(s);
      return v ? maskFullName(v) : null;
    },
  },
  {
    name: "PersonAge",
    category: "Person",
    emoji: PersonAge.typeInfo.emoji,
    sample: "34 år",
    isValid: PersonAge.isValid,
    format: PersonAge.format,
    normalize: PersonAge.normalize,
    isNormalized: PersonAge.isNormalized,
  },

  // ── Organization ────────────────────────────────────────
  {
    name: "SwedishOrganizationNumber",
    category: "Organization",
    emoji: SwedishOrganizationNumber.typeInfo.emoji,
    sample: "556703-7485",
    isValid: SwedishOrganizationNumber.isValid,
    format: SwedishOrganizationNumber.format,
    normalize: SwedishOrganizationNumber.normalize,
    isNormalized: SwedishOrganizationNumber.isNormalized,
    mask: (s) => {
      const v = SwedishOrganizationNumber.tryParse(s);
      return v ? maskSwedishOrganizationNumber(v) : null;
    },
    properties: (s) => {
      const v = SwedishOrganizationNumber.tryParse(s);
      if (!v) return null;
      return meta(v.isPerson ? "Kind: Person" : "Kind: Legal entity");
    },
  },
  {
    name: "SwedishOrganizationName",
    category: "Organization",
    emoji: SwedishOrganizationName.typeInfo.emoji,
    sample: "Spotify AB",
    isValid: SwedishOrganizationName.isValid,
    format: SwedishOrganizationName.format,
    normalize: SwedishOrganizationName.normalize,
    isNormalized: SwedishOrganizationName.isNormalized,
  },
  {
    name: "EuVatNumber",
    category: "Organization",
    emoji: EuVatNumber.typeInfo.emoji,
    sample: "SE556703748501",
    isValid: EuVatNumber.isValid,
    format: EuVatNumber.format,
    normalize: EuVatNumber.normalize,
    isNormalized: EuVatNumber.isNormalized,
    mask: (s) => {
      const v = EuVatNumber.tryParse(s);
      return v ? maskEuVatNumber(v) : null;
    },
  },
  {
    name: "LeiCode",
    category: "Organization",
    emoji: LeiCode.typeInfo.emoji,
    sample: "549300JTOWWMNNK4SR23",
    isValid: LeiCode.isValid,
    format: LeiCode.format,
    normalize: LeiCode.normalize,
    isNormalized: LeiCode.isNormalized,
    mask: (s) => {
      const v = LeiCode.tryParse(s);
      return v ? maskLeiCode(v) : null;
    },
  },
  {
    name: "DunsNumber",
    category: "Organization",
    emoji: DunsNumber.typeInfo.emoji,
    sample: "12-345-6789",
    isValid: DunsNumber.isValid,
    format: DunsNumber.format,
    normalize: DunsNumber.normalize,
    isNormalized: DunsNumber.isNormalized,
    mask: (s) => {
      const v = DunsNumber.tryParse(s);
      return v ? maskDunsNumber(v) : null;
    },
  },
  {
    name: "SwedishCfarNumber",
    category: "Organization",
    emoji: SwedishCfarNumber.typeInfo.emoji,
    sample: "12345678",
    isValid: SwedishCfarNumber.isValid,
    format: SwedishCfarNumber.format,
    normalize: SwedishCfarNumber.normalize,
    isNormalized: SwedishCfarNumber.isNormalized,
    mask: (s) => {
      const v = SwedishCfarNumber.tryParse(s);
      return v ? maskSwedishCfarNumber(v) : null;
    },
  },
  {
    name: "SwedishSniCode",
    category: "Organization",
    emoji: SwedishSniCode.typeInfo.emoji,
    sample: "62.010",
    isValid: SwedishSniCode.isValid,
    format: SwedishSniCode.format,
    normalize: SwedishSniCode.normalize,
    isNormalized: SwedishSniCode.isNormalized,
  },

  // ── Geography ───────────────────────────────────────────
  {
    name: "Country",
    category: "Geography",
    emoji: Country.typeInfo.emoji,
    sample: "Sverige",
    isValid: Country.isValid,
    format: Country.format,
    normalize: Country.normalize,
    isNormalized: Country.isNormalized,
    properties: (s) => {
      const v = Country.tryParse(s);
      if (!v) return null;
      return meta(
        `Alpha-2: ${v.alpha2Code}`,
        `Alpha-3: ${v.alpha3Code}`,
        `Continent: ${v.continent.englishName}`,
        `Calling code: +${v.callingCode}`,
      );
    },
  },
  {
    name: "Continent",
    category: "Geography",
    emoji: Continent.typeInfo.emoji,
    sample: "Europe",
    isValid: Continent.isValid,
    format: Continent.format,
    normalize: Continent.normalize,
    isNormalized: Continent.isNormalized,
  },
  {
    name: "Language",
    category: "Geography",
    emoji: Language.typeInfo.emoji,
    sample: "sv",
    isValid: Language.isValid,
    format: Language.format,
    normalize: Language.normalize,
    isNormalized: Language.isNormalized,
    mask: (s) => {
      const v = Language.tryParse(s);
      return v ? maskLanguage(v) : null;
    },
  },
  {
    name: "SwedishCounty",
    category: "Geography",
    emoji: SwedishCounty.typeInfo.emoji,
    sample: "Stockholm",
    isValid: SwedishCounty.isValid,
    format: SwedishCounty.format,
    normalize: SwedishCounty.normalize,
    isNormalized: SwedishCounty.isNormalized,
    mask: (s) => {
      const v = SwedishCounty.tryParse(s);
      return v ? maskSwedishCounty(v) : null;
    },
  },
  {
    name: "SwedishMunicipality",
    category: "Geography",
    emoji: SwedishMunicipality.typeInfo.emoji,
    sample: "Stockholm",
    isValid: SwedishMunicipality.isValid,
    format: SwedishMunicipality.format,
    normalize: SwedishMunicipality.normalize,
    isNormalized: SwedishMunicipality.isNormalized,
    mask: (s) => {
      const v = SwedishMunicipality.tryParse(s);
      return v ? maskSwedishMunicipality(v) : null;
    },
  },
  {
    name: "GeoCoordinate",
    category: "Geography",
    emoji: GeoCoordinate.typeInfo.emoji,
    sample: "59.3293, 18.0686",
    isValid: GeoCoordinate.isValid,
    format: GeoCoordinate.format,
    normalize: GeoCoordinate.normalize,
    isNormalized: GeoCoordinate.isNormalized,
    mask: (s) => {
      const v = GeoCoordinate.tryParse(s);
      return v ? maskGeoCoordinate(v) : null;
    },
  },

  // ── Web ─────────────────────────────────────────────────
  {
    name: "EmailAddress",
    category: "Web",
    emoji: EmailAddress.typeInfo.emoji,
    sample: "user@example.com",
    isValid: EmailAddress.isValid,
    format: (s) => EmailAddress.format(s),
    normalize: (s) => EmailAddress.normalize(s),
    isNormalized: EmailAddress.isNormalized,
    mask: (s) => {
      const v = EmailAddress.tryParse(s);
      return v ? maskEmailAddress(v) : null;
    },
    properties: (s) => {
      const v = EmailAddress.tryParse(s);
      if (!v) return null;
      return meta(
        `Local: ${v.localPart}`,
        `Domain: ${v.domain}`,
        v.country ? `Country: ${v.country.englishName}` : null,
        v.provider ? `Provider: ${v.provider}` : null,
        v.isInternationalizedDomain ? `IDN: ${v.domainAscii}` : null,
      );
    },
  },
  {
    name: "Url",
    category: "Web",
    emoji: Url.typeInfo.emoji,
    sample: "https://www.example.com/path",
    isValid: Url.isValid,
    format: (s) => Url.format(s),
    normalize: (s) => Url.normalize(s),
    isNormalized: Url.isNormalized,
    mask: (s) => {
      const v = Url.tryParse(s);
      return v ? maskUrl(v) : null;
    },
    properties: (s) => {
      const v = Url.tryParse(s);
      if (!v) return null;
      return meta(
        `Scheme: ${v.scheme}`,
        v.host ? `Host: ${v.host}` : null,
        v.country ? `Country: ${v.country.englishName}` : null,
        v.isSecure ? "Secure: yes" : null,
        v.isExampleDomain ? "Example domain: yes" : null,
      );
    },
  },

  // ── Finance ─────────────────────────────────────────────
  {
    name: "Currency",
    category: "Finance",
    emoji: Currency.typeInfo.emoji,
    sample: "SEK",
    isValid: Currency.isValid,
    format: (s) => Currency.format(s),
    normalize: (s) => Currency.normalize(s),
    isNormalized: Currency.isNormalized,
    properties: (s) => {
      const v = Currency.tryParse(s);
      if (!v) return null;
      return meta(
        `Code: ${v.code}`,
        `Symbol: ${v.symbol}`,
        `English: ${v.englishName}`,
        `Svenska: ${v.localizedName}`,
        `Decimals: ${v.decimalPlaces}`,
      );
    },
  },
  {
    name: "MoneyAmount",
    category: "Finance",
    emoji: MoneyAmount.typeInfo.emoji,
    sample: "1 000,50 SEK",
    isValid: (s) => MoneyAmount.isValid(s),
    format: (s) => MoneyAmount.format(s),
    normalize: (s) => MoneyAmount.normalize(s),
    isNormalized: MoneyAmount.isNormalized,
    mask: (s) => {
      const v = MoneyAmount.tryParse(s);
      return v ? maskMoneyAmount(v) : null;
    },
    properties: (s) => {
      const v = MoneyAmount.tryParse(s);
      if (!v) return null;
      return meta(
        `Amount: ${v.amount}`,
        `Currency: ${v.currency.code}`,
        `Decimals: ${v.currency.decimalPlaces}`,
      );
    },
  },
  {
    name: "Isin",
    category: "Finance",
    emoji: Isin.typeInfo.emoji,
    sample: "SE0000108656",
    isValid: Isin.isValid,
    format: (s) => Isin.format(s),
    normalize: (s) => Isin.normalize(s),
    isNormalized: Isin.isNormalized,
    mask: (s) => {
      const v = Isin.tryParse(s);
      return v ? maskIsin(v) : null;
    },
    properties: (s) => {
      const v = Isin.tryParse(s);
      if (!v) return null;
      return meta(`Country: ${v.countryCode}`, `NSIN: ${v.nsin}`, `Check: ${v.checkDigit}`);
    },
  },

  // ── Property ────────────────────────────────────────────
  {
    name: "SwedishPropertyDesignation",
    category: "Property",
    emoji: SwedishPropertyDesignation.typeInfo.emoji,
    sample: "Stockholm Söder 75:2",
    isValid: SwedishPropertyDesignation.isValid,
    format: (s) => SwedishPropertyDesignation.format(s),
    normalize: (s) => SwedishPropertyDesignation.normalize(s),
    isNormalized: SwedishPropertyDesignation.isNormalized,
    mask: (s) => {
      const v = SwedishPropertyDesignation.tryParse(s);
      return v ? maskSwedishPropertyDesignation(v) : null;
    },
    properties: (s) => {
      const v = SwedishPropertyDesignation.tryParse(s);
      if (!v) return null;
      return meta(
        `Name: ${v.designationName}`,
        `Register: ${v.registerNumber}`,
        `Block: ${v.blockNumber}`,
        `Unit: ${v.unitNumber}`,
      );
    },
  },
  {
    name: "SwedishPropertyTaxationCode",
    category: "Property",
    emoji: SwedishPropertyTaxationCode.typeInfo.emoji,
    sample: "220",
    isValid: SwedishPropertyTaxationCode.isValid,
    format: (s) => SwedishPropertyTaxationCode.format(s),
    normalize: (s) => SwedishPropertyTaxationCode.normalize(s),
    isNormalized: SwedishPropertyTaxationCode.isNormalized,
    properties: (s) => {
      const v = SwedishPropertyTaxationCode.tryParse(s);
      if (!v) return null;
      return meta(
        `Code: ${v.code}`,
        `Category: ${v.category}`,
        v.englishDescription ? `English: ${v.englishDescription}` : null,
        v.localizedDescription ? `Svenska: ${v.localizedDescription}` : null,
      );
    },
  },

  // ── Banking ─────────────────────────────────────────────
  {
    name: "Iban",
    category: "Banking",
    emoji: Iban.typeInfo.emoji,
    sample: "SE45 5000 0000 0583 9825 7466",
    isValid: Iban.isValid,
    format: (s) => Iban.format(s),
    normalize: (s) => Iban.normalize(s),
    isNormalized: Iban.isNormalized,
    mask: (s) => {
      const v = Iban.tryParse(s);
      return v ? maskIban(v) : null;
    },
    properties: (s) => {
      const v = Iban.tryParse(s);
      if (!v) return null;
      return meta(`Country: ${v.countryCode}`, `Length: ${v.value.length}`);
    },
  },
  {
    name: "Bic",
    category: "Banking",
    emoji: Bic.typeInfo.emoji,
    sample: "NDEASESS",
    isValid: Bic.isValid,
    format: (s) => Bic.format(s),
    normalize: (s) => Bic.normalize(s),
    isNormalized: Bic.isNormalized,
    mask: (s) => {
      const v = Bic.tryParse(s);
      return v ? maskBic(v) : null;
    },
    properties: (s) => {
      const v = Bic.tryParse(s);
      if (!v) return null;
      return meta(
        `Institution: ${v.institutionCode}`,
        `Country: ${v.countryCode}`,
        `Location: ${v.locationCode}`,
        v.branchCode ? `Branch: ${v.branchCode}` : null,
        v.isPrimaryOffice ? "Primary office: yes" : null,
      );
    },
  },
  {
    name: "SwedishBankgiroNumber",
    category: "Banking",
    emoji: SwedishBankgiroNumber.typeInfo.emoji,
    sample: "5805-6201",
    isValid: SwedishBankgiroNumber.isValid,
    format: (s) => SwedishBankgiroNumber.format(s),
    normalize: (s) => SwedishBankgiroNumber.normalize(s),
    isNormalized: SwedishBankgiroNumber.isNormalized,
    mask: (s) => {
      const v = SwedishBankgiroNumber.tryParse(s);
      return v ? maskSwedishBankgiroNumber(v) : null;
    },
    properties: (s) => {
      const v = SwedishBankgiroNumber.tryParse(s);
      if (!v) return null;
      return meta(`Digits: ${v.digits}`);
    },
  },
  {
    name: "SwedishPostgiroNumber",
    category: "Banking",
    emoji: SwedishPostgiroNumber.typeInfo.emoji,
    sample: "4131300-8",
    isValid: SwedishPostgiroNumber.isValid,
    format: (s) => SwedishPostgiroNumber.format(s),
    normalize: (s) => SwedishPostgiroNumber.normalize(s),
    isNormalized: SwedishPostgiroNumber.isNormalized,
    mask: (s) => {
      const v = SwedishPostgiroNumber.tryParse(s);
      return v ? maskSwedishPostgiroNumber(v) : null;
    },
    properties: (s) => {
      const v = SwedishPostgiroNumber.tryParse(s);
      if (!v) return null;
      return meta(`Digits: ${v.digits}`);
    },
  },
  {
    name: "SwedishOcrReferenceNumber",
    category: "Banking",
    emoji: SwedishOcrReferenceNumber.typeInfo.emoji,
    sample: "12345674",
    isValid: (s) => SwedishOcrReferenceNumber.isValid(s),
    format: (s) => SwedishOcrReferenceNumber.format(s),
    normalize: (s) => SwedishOcrReferenceNumber.normalize(s),
    isNormalized: SwedishOcrReferenceNumber.isNormalized,
    mask: (s) => {
      const v = SwedishOcrReferenceNumber.tryParse(s);
      return v ? maskSwedishOcrReferenceNumber(v) : null;
    },
    properties: (s) => {
      const v = SwedishOcrReferenceNumber.tryParse(s);
      if (!v) return null;
      return meta(`Length: ${v.length}`, `Check: ${v.checkDigit}`);
    },
  },
  {
    name: "SwedishBankClearingNumber",
    category: "Banking",
    emoji: SwedishBankClearingNumber.typeInfo.emoji,
    sample: "5001",
    isValid: SwedishBankClearingNumber.isValid,
    format: (s) => SwedishBankClearingNumber.format(s),
    normalize: (s) => SwedishBankClearingNumber.normalize(s),
    isNormalized: SwedishBankClearingNumber.isNormalized,
    mask: (s) => {
      const v = SwedishBankClearingNumber.tryParse(s);
      return v ? maskSwedishBankClearingNumber(v) : null;
    },
    properties: (s) => {
      const v = SwedishBankClearingNumber.tryParse(s);
      if (!v) return null;
      return meta(`Bank: ${v.bankName}`, v.bank !== SwedishBank.Unknown ? `Enum: ${v.bank}` : null);
    },
  },
  {
    name: "SwedishBankAccount",
    category: "Banking",
    emoji: SwedishBankAccount.typeInfo.emoji,
    sample: "5001-1234567",
    isValid: SwedishBankAccount.isValid,
    format: (s) => SwedishBankAccount.format(s),
    normalize: (s) => SwedishBankAccount.normalize(s),
    isNormalized: SwedishBankAccount.isNormalized,
    mask: (s) => {
      const v = SwedishBankAccount.tryParse(s);
      return v ? maskSwedishBankAccount(v) : null;
    },
    properties: (s) => {
      const v = SwedishBankAccount.tryParse(s);
      if (!v) return null;
      return meta(
        `Clearing: ${v.clearingNumber}`,
        `Account: ${v.accountNumber}`,
        v.bankName ? `Bank: ${v.bankName}` : null,
      );
    },
  },
  {
    name: "SwedishBankAccountHolderName",
    category: "Banking",
    emoji: SwedishBankAccountHolderName.typeInfo.emoji,
    sample: "Anna Andersson",
    isValid: SwedishBankAccountHolderName.isValid,
    format: (s) => SwedishBankAccountHolderName.format(s),
    normalize: (s) => SwedishBankAccountHolderName.normalize(s),
    isNormalized: SwedishBankAccountHolderName.isNormalized,
    mask: (s) => {
      const v = SwedishBankAccountHolderName.tryParse(s);
      return v ? maskSwedishBankAccountHolderName(v) : null;
    },
    properties: (s) => {
      const v = SwedishBankAccountHolderName.tryParse(s);
      if (!v) return null;
      return meta(`HolderType: ${v.holderType}`);
    },
  },
  {
    name: "SwedishSwishNumber",
    category: "Banking",
    emoji: SwedishSwishNumber.typeInfo.emoji,
    sample: "1236652895",
    isValid: SwedishSwishNumber.isValid,
    format: (s) => SwedishSwishNumber.format(s),
    normalize: (s) => SwedishSwishNumber.normalize(s),
    isNormalized: SwedishSwishNumber.isNormalized,
    mask: (s) => {
      const v = SwedishSwishNumber.tryParse(s);
      return v ? maskSwedishSwishNumber(v) : null;
    },
    properties: (s) => {
      const v = SwedishSwishNumber.tryParse(s);
      if (!v) return null;
      return meta(
        v.isSwish123 ? "Swish 123: yes" : null,
        v.isMobileNumber ? "Mobile: yes" : null,
        v.is90Number ? "90-number: yes" : null,
      );
    },
  },
  {
    name: "SwedishBankingNumber",
    category: "Banking",
    emoji: "\u{1F4B5}",
    sample: "SE45 5000 0000 0583 9825 7466",
    isValid: (s) => SwedishBankingNumberParser.tryParse(s) !== null,
    format: (s) => SwedishBankingNumberParser.tryParse(s)?.normalizedValue ?? null,
    normalize: (s) => SwedishBankingNumberParser.tryParse(s)?.normalizedValue ?? null,
    isNormalized: (s) => {
      const r = SwedishBankingNumberParser.tryParse(s);
      return r !== null && r.normalizedValue === s;
    },
    properties: (s) => {
      const v = SwedishBankingNumberParser.tryParse(s);
      if (!v) return null;
      return meta(`Type: ${v.type}`);
    },
  },
];
