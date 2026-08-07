import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { SwedishCoordinationNumber, SwedishPersonalIdentityNumber } from "../person/index.js";
import { DunsNumber } from "./duns-number.js";
import { EuVatNumber } from "./eu-vat-number.js";
import { LeiCode } from "./lei-code.js";
import { toSwedishOrganizationNumber } from "./organization-extensions.js";
import { SwedishOrganizationIdentifierType } from "./swedish-organization-identifier-type.js";
import { SwedishOrganizationNumber } from "./swedish-organization-number.js";
import { SwedishOrganizationType } from "./swedish-organization-type.js";

const MAX_INPUT_LENGTH = 30;

export interface SwedishOrganizationIdentifier {
  readonly type: SwedishOrganizationIdentifierType;
  readonly organizationTypeHintCertain: SwedishOrganizationType;
  readonly organizationTypeHintBestGuess: SwedishOrganizationType;
  readonly normalizedValue: string;
  readonly swedishOrganizationNumber: SwedishOrganizationNumber | null;
  readonly euVatNumber: EuVatNumber | null;
  readonly dunsNumber: DunsNumber | null;
  readonly leiCode: LeiCode | null;
}

interface ParseOptions {
  readonly organizationName?: string | null;
  readonly isPrivatePerson?: boolean | null;
}

function unknownResult(): SwedishOrganizationIdentifier {
  return {
    type: SwedishOrganizationIdentifierType.Unknown,
    organizationTypeHintCertain: SwedishOrganizationType.Unknown,
    organizationTypeHintBestGuess: SwedishOrganizationType.Unknown,
    normalizedValue: "",
    swedishOrganizationNumber: null,
    euVatNumber: null,
    dunsNumber: null,
    leiCode: null,
  };
}

/** Unified parser for Swedish organization, VAT, DUNS and LEI identifiers. */
export class SwedishOrganizationIdentifierParser {
  static tryParse(
    input: string | null | undefined,
    options?: ParseOptions,
  ): SwedishOrganizationIdentifier | null {
    if (input == null || input.trim() === "") return null;
    const sanitized = sanitizeInput(input).trim();
    if (sanitized.length > MAX_INPUT_LENGTH) return null;

    const isSwedishDefault = PrimitivesDefaults.countryAlpha2Code === "SE";
    if (isSwedishDefault) {
      const se = tryParseSwedishOrg(sanitized, options);
      if (se) return se;
      const vat = tryParseVat(sanitized, options);
      if (vat) return vat;
    } else {
      const vat = tryParseVat(sanitized, options);
      if (vat) return vat;
      const se = tryParseSwedishOrg(sanitized, options);
      if (se) return se;
    }

    const duns = DunsNumber.tryParse(sanitized);
    if (duns) {
      return {
        ...unknownResult(),
        type: SwedishOrganizationIdentifierType.DunsNumber,
        normalizedValue: duns.digits,
        dunsNumber: duns,
      };
    }

    const lei = LeiCode.tryParse(sanitized);
    if (lei) {
      return {
        ...unknownResult(),
        type: SwedishOrganizationIdentifierType.LeiCode,
        normalizedValue: lei.value,
        leiCode: lei,
      };
    }

    return null;
  }

  static parse(input: string, options?: ParseOptions): SwedishOrganizationIdentifier {
    const r = SwedishOrganizationIdentifierParser.tryParse(input, options);
    if (!r) throw new Error("Could not parse input as a known organization/identity number.");
    return r;
  }

  static tryParseForCountry(
    input: string | null | undefined,
    countryCode: string | null | undefined,
    options?: ParseOptions,
  ): SwedishOrganizationIdentifier | null {
    if (input == null || input.trim() === "" || countryCode == null || countryCode.trim() === "") {
      return null;
    }
    const normalizedCountryCode = countryCode.toUpperCase();

    if (normalizedCountryCode === "SE") {
      const seOrg = SwedishOrganizationNumber.tryParse(input);
      if (seOrg) return buildSwedishOrgResult(seOrg, options);
    }

    const vat = EuVatNumber.tryParseForCountry(input, normalizedCountryCode);
    if (vat) return buildVatResult(vat, options);

    return null;
  }

  static parseForCountry(
    input: string,
    countryCode: string,
    options?: ParseOptions,
  ): SwedishOrganizationIdentifier {
    const r = SwedishOrganizationIdentifierParser.tryParseForCountry(input, countryCode, options);
    if (!r) {
      throw new Error(
        `Could not parse input as a known organization/identity number for country ${countryCode}.`,
      );
    }
    return r;
  }
}

function tryParseSwedishOrg(
  input: string,
  options?: ParseOptions,
): SwedishOrganizationIdentifier | null {
  const seOrg = SwedishOrganizationNumber.tryParse(input);
  if (!seOrg) return null;
  return buildSwedishOrgResult(seOrg, options);
}

function buildSwedishOrgResult(
  seOrg: SwedishOrganizationNumber,
  options?: ParseOptions,
): SwedishOrganizationIdentifier {
  let type = SwedishOrganizationIdentifierType.SwedishOrganizationNumber;
  if (seOrg.isPerson) {
    const twelve = seOrg.to12DigitString();
    if (SwedishPersonalIdentityNumber.tryParse(twelve)) {
      type = SwedishOrganizationIdentifierType.SwedishPersonalIdentityNumber;
    } else if (SwedishCoordinationNumber.tryParse(twelve)) {
      type = SwedishOrganizationIdentifierType.SwedishCoordinationNumber;
    }
  }
  const hint = seOrg.getSwedishOrganizationTypeHint(
    options?.organizationName ?? null,
    options?.isPrivatePerson ?? null,
  );
  return {
    ...unknownResult(),
    type,
    organizationTypeHintCertain: hint.certain,
    organizationTypeHintBestGuess: hint.bestGuess,
    normalizedValue: seOrg.to12DigitString(),
    swedishOrganizationNumber: seOrg,
  };
}

function tryParseVat(input: string, options?: ParseOptions): SwedishOrganizationIdentifier | null {
  const vat = EuVatNumber.tryParse(input);
  if (!vat) return null;
  return buildVatResult(vat, options);
}

function buildVatResult(vat: EuVatNumber, options?: ParseOptions): SwedishOrganizationIdentifier {
  let certain = SwedishOrganizationType.Unknown;
  let bestGuess = SwedishOrganizationType.Unknown;
  const seOrg = toSwedishOrganizationNumber(vat);
  if (seOrg) {
    const hint = seOrg.getSwedishOrganizationTypeHint(
      options?.organizationName ?? null,
      options?.isPrivatePerson ?? null,
    );
    certain = hint.certain;
    bestGuess = hint.bestGuess;
  }

  return {
    ...unknownResult(),
    type: SwedishOrganizationIdentifierType.EuVatNumber,
    organizationTypeHintCertain: certain,
    organizationTypeHintBestGuess: bestGuess,
    normalizedValue: vat.countryCode + vat.body,
    euVatNumber: vat,
  };
}
