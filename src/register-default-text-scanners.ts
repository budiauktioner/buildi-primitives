import { Address } from "./contact/address.js";
import { AddressZipCode } from "./contact/address-zip-code.js";
import { PhoneNumber } from "./contact/phone-number.js";
import { SwedishAddress } from "./contact/swedish-address.js";
import { Country } from "./geography/country.js";
import { SwedishCounty } from "./geography/swedish-county.js";
import { SwedishMunicipality } from "./geography/swedish-municipality.js";
import { DunsNumber } from "./organization/duns-number.js";
import { EuVatNumber } from "./organization/eu-vat-number.js";
import { LeiCode } from "./organization/lei-code.js";
import { SwedishOrganizationNumber } from "./organization/swedish-organization-number.js";
import { SwedishCoordinationNumber } from "./person/swedish-coordination-number.js";
import { SwedishPersonalIdentityNumber } from "./person/swedish-personal-identity-number.js";
import { TextCandidateCategory } from "./text-scanning/text-candidate-category.js";
import { defaultTextScanner } from "./text-scanning/text-scanner.js";
import { EmailAddress } from "./web/email-address.js";
import { Url } from "./web/url.js";
import { Isin } from "./finance/isin.js";
import { SwedishPropertyDesignation } from "./property/swedish-property-designation.js";
import { Iban } from "./banking/iban.js";
import { Bic } from "./banking/bic.js";
import { SwedishBankgiroNumber } from "./banking/swedish-bankgiro-number.js";
import { SwedishPostgiroNumber } from "./banking/swedish-postgiro-number.js";
import { SwedishOcrReferenceNumber } from "./banking/swedish-ocr-reference-number.js";
import { SwedishBankAccount } from "./banking/swedish-bank-account.js";
import { SwedishSwishNumber } from "./banking/swedish-swish-number.js";
import { Length } from "./measurement/length.js";

let registered = false;

/** Registers every built-in `findCandidatesInText` implementation on the shared scanner. */
export function registerDefaultTextScanners(): void {
  if (registered) return;
  registered = true;

  defaultTextScanner.register({
    typeName: "Address",
    category: TextCandidateCategory.Contact,
    scan: Address.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "AddressZipCode",
    category: TextCandidateCategory.Contact,
    scan: AddressZipCode.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "PhoneNumber",
    category: TextCandidateCategory.Contact,
    scan: PhoneNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishAddress",
    category: TextCandidateCategory.Contact,
    scan: SwedishAddress.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "Country",
    category: TextCandidateCategory.Geography,
    scan: Country.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishCounty",
    category: TextCandidateCategory.Geography,
    scan: SwedishCounty.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishMunicipality",
    category: TextCandidateCategory.Geography,
    scan: SwedishMunicipality.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "SwedishPersonalIdentityNumber",
    category: TextCandidateCategory.PersonalIdentifier,
    scan: SwedishPersonalIdentityNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishCoordinationNumber",
    category: TextCandidateCategory.PersonalIdentifier,
    scan: SwedishCoordinationNumber.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "SwedishOrganizationNumber",
    category: TextCandidateCategory.OrganizationIdentifier,
    scan: SwedishOrganizationNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "EuVatNumber",
    category: TextCandidateCategory.OrganizationIdentifier,
    scan: EuVatNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "DunsNumber",
    category: TextCandidateCategory.OrganizationIdentifier,
    scan: DunsNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "LeiCode",
    category: TextCandidateCategory.OrganizationIdentifier,
    scan: LeiCode.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "EmailAddress",
    category: TextCandidateCategory.Contact,
    scan: EmailAddress.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "Url",
    category: TextCandidateCategory.Contact,
    scan: Url.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "Isin",
    category: TextCandidateCategory.Financial,
    scan: Isin.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "SwedishPropertyDesignation",
    category: TextCandidateCategory.Property,
    scan: SwedishPropertyDesignation.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "Iban",
    category: TextCandidateCategory.Financial,
    scan: Iban.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "Bic",
    category: TextCandidateCategory.Financial,
    scan: Bic.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishBankgiroNumber",
    category: TextCandidateCategory.Financial,
    scan: SwedishBankgiroNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishPostgiroNumber",
    category: TextCandidateCategory.Financial,
    scan: SwedishPostgiroNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishOcrReferenceNumber",
    category: TextCandidateCategory.Financial,
    scan: SwedishOcrReferenceNumber.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishBankAccount",
    category: TextCandidateCategory.Financial,
    scan: SwedishBankAccount.findCandidatesInText,
  });
  defaultTextScanner.register({
    typeName: "SwedishSwishNumber",
    category: TextCandidateCategory.Financial,
    scan: SwedishSwishNumber.findCandidatesInText,
  });

  defaultTextScanner.register({
    typeName: "Length",
    category: TextCandidateCategory.Measurement,
    scan: Length.findCandidatesInText,
  });
}
