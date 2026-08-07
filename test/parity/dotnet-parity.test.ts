import { describe, expect, it } from "vitest";
import * as primitives from "../../src/index.js";

/**
 * Guards the public surface against the .NET package `Buildi.Primitives`, which
 * is the behavioural specification for this port.
 *
 * The expectations below are transcribed from the public types of
 * https://github.com/BudiAuktioner/Buildi.Primitives at version 0.21.0. The
 * `Vehicle` and `Product` namespaces are covered by test/vehicle and
 * test/product instead, which compare against fixtures captured from .NET.
 *
 * When bumping the .NET baseline, re-derive these lists from that source rather
 * than from this file.
 */

const exported = primitives as unknown as Record<string, unknown>;

const COUNTRY_ADDRESS_PREFIXES = [
  "Austrian",
  "Belgian",
  "British",
  "Bulgarian",
  "Croatian",
  "Cypriot",
  "Czech",
  "Danish",
  "Dutch",
  "Estonian",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Hungarian",
  "Icelandic",
  "Irish",
  "Italian",
  "Latvian",
  "Liechtenstein",
  "Lithuanian",
  "Luxembourgish",
  "Maltese",
  "Norwegian",
  "Polish",
  "Portuguese",
  "Romanian",
  "Slovak",
  "Slovenian",
  "Spanish",
  "Swiss",
] as const;

/** .NET public types per namespace that must exist as runtime exports. */
const EXPECTED_TYPES: Readonly<Record<string, readonly string[]>> = {
  Organization: [
    "DunsNumber",
    "ElfCode",
    "EuOrganizationName",
    "EuVatNumber",
    "LeiCode",
    "SwedishCfarNumber",
    "SwedishOrganizationIdentifierParser",
    "SwedishOrganizationIdentifierType",
    "SwedishOrganizationName",
    "SwedishOrganizationNumber",
    "SwedishOrganizationType",
    "SwedishSniCode",
  ],
  Banking: [
    "BankAccountHolderType",
    "Bic",
    "Iban",
    "OcrReferenceControlType",
    "OcrReferenceOptions",
    "SwedishBank",
    "SwedishBankAccount",
    "SwedishBankAccountHolderName",
    "SwedishBankClearingNumber",
    "SwedishBankgiroNumber",
    "SwedishBankingNumber",
    "SwedishBankingNumberParser",
    "SwedishBankingNumberType",
    "SwedishOcrReferenceNumber",
    "SwedishPostgiroNumber",
    "SwedishSwishNumber",
  ],
  Person: [
    "PersonAge",
    "PersonFamilyName",
    "PersonFullName",
    "PersonGivenName",
    "SwedishCoordinationNumber",
    "SwedishPersonalIdentityNumber",
  ],
  Geography: [
    "Continent",
    "Country",
    "CountryCapital",
    "GeoCoordinate",
    "Language",
    "SwedishCounty",
    "SwedishMunicipality",
    "TextDirection",
    "WritingScript",
  ],
  Finance: ["Currency", "ExchangeRates", "Isin", "MoneyAmount"],
  Web: ["EmailAddress", "PublicEmailProvider", "Url"],
  Property: [
    "SwedishPropertyDesignation",
    "SwedishPropertyTaxationCategory",
    "SwedishPropertyTaxationCode",
  ],
  // Partially ported — see PARITY.md. The standalone types (Count, Percentage,
  // SoundLevel, Year, YearMonth) remain.
  Measurement: [
    "Area",
    "AreaUnit",
    "DataSize",
    "DataSizeUnit",
    "ElectricCharge",
    "ElectricChargeUnit",
    "ElectricCurrent",
    "ElectricCurrentUnit",
    "Energy",
    "EnergyUnit",
    "FlowRate",
    "FlowRateUnit",
    "Frequency",
    "FrequencyUnit",
    "Length",
    "LengthUnit",
    "Luminance",
    "LuminanceUnit",
    "LuminousFlux",
    "LuminousFluxUnit",
    "Count",
    "Percentage",
    "Power",
    "PowerUnit",
    "Pressure",
    "PressureUnit",
    "RotationalSpeed",
    "RotationalSpeedUnit",
    "SoundLevel",
    "SoundWeighting",
    "Speed",
    "SpeedUnit",
    "Temperature",
    "TemperatureUnit",
    "TemperatureDelta",
    "Torque",
    "TorqueUnit",
    "Voltage",
    "VoltageUnit",
    "Volume",
    "VolumeUnit",
    "Weight",
    "WeightUnit",
    "Year",
    "YearMonth",
  ],
  Validation: ["ValidationErrorReason", "ValidationIssue", "ValidationResult"],
  TextScanning: [
    "TextCandidate",
    "TextCandidateCategory",
    "TextMatchConfidence",
    "TextScanResult",
    "TextScanner",
  ],
  Contact: [
    "Address",
    "AddressCity",
    "AddressStreet",
    "AddressZipCode",
    "ContactAddress",
    "ContactAddressBuilder",
    "CountryAddressBase",
    "CountryAddressZipCodeBase",
    "PhoneCallingCode",
    "PhoneNumber",
    "PhoneNumberTestData",
    "SwedishAddress",
    "SwedishAddressZipCode",
    ...COUNTRY_ADDRESS_PREFIXES.map((p) => `${p}Address`),
    ...COUNTRY_ADDRESS_PREFIXES.map((p) => `${p}AddressZipCode`),
  ],
};

/** .NET `ToMaskedString` overloads, as module-level functions in this port. */
const EXPECTED_MASKING_FUNCTIONS = [
  "maskAddress",
  "maskAddressCity",
  "maskAddressStreet",
  "maskAddressZipCode",
  "maskBic",
  "maskCoordinationNumber",
  "maskDunsNumber",
  "maskEmailAddress",
  "maskEuOrganizationName",
  "maskEuVatNumber",
  "maskFamilyName",
  "maskFullName",
  "maskGeoCoordinate",
  "maskGivenName",
  "maskIban",
  "maskArea",
  "maskDataSize",
  "maskElectricCharge",
  "maskElectricCurrent",
  "maskEnergy",
  "maskFlowRate",
  "maskFrequency",
  "maskIsin",
  "maskLanguage",
  "maskLength",
  "maskLuminance",
  "maskLuminousFlux",
  "maskPower",
  "maskPressure",
  "maskRotationalSpeed",
  "maskSoundLevel",
  "maskSpeed",
  "maskTemperature",
  "maskTorque",
  "maskVoltage",
  "maskVolume",
  "maskWeight",
  "maskYear",
  "maskYearMonth",
  "maskLeiCode",
  "maskMoneyAmount",
  "maskCount",
  "maskPercentage",
  "maskPersonAge",
  "maskPersonalIdentityNumber",
  "maskPhoneNumber",
  "maskSwedishAddress",
  "maskSwedishAddressZipCode",
  "maskSwedishBankAccount",
  "maskSwedishBankAccountHolderName",
  "maskSwedishBankClearingNumber",
  "maskSwedishBankgiroNumber",
  "maskSwedishCfarNumber",
  "maskSwedishCounty",
  "maskSwedishMunicipality",
  "maskSwedishOcrReferenceNumber",
  "maskSwedishOrganizationName",
  "maskSwedishOrganizationNumber",
  "maskSwedishPostgiroNumber",
  "maskSwedishPropertyDesignation",
  "maskUrl",
] as const;

/** .NET types exposing `static ValidationResult Validate(string?)`, ported namespaces only. */
const EXPECTED_VALIDATE_TYPES = [
  "Bic",
  "EmailAddress",
  "EuVatNumber",
  "Iban",
  "SwedishBankAccount",
  "SwedishBankClearingNumber",
  "SwedishBankgiroNumber",
  "SwedishCoordinationNumber",
  "SwedishOcrReferenceNumber",
  "SwedishOrganizationNumber",
  "SwedishPersonalIdentityNumber",
  "SwedishPostgiroNumber",
] as const;

/** .NET types exposing `FindCandidatesInText`, ported namespaces only. */
const EXPECTED_SCANNABLE_TYPES = [
  "Address",
  "AddressZipCode",
  "Bic",
  "Country",
  "DunsNumber",
  "EmailAddress",
  "EuVatNumber",
  "Iban",
  "Area",
  "DataSize",
  "ElectricCharge",
  "ElectricCurrent",
  "Energy",
  "FlowRate",
  "Frequency",
  "Isin",
  "Length",
  "LeiCode",
  "Luminance",
  "LuminousFlux",
  "Percentage",
  "PhoneNumber",
  "Power",
  "Pressure",
  "RotationalSpeed",
  "SoundLevel",
  "Speed",
  "Temperature",
  "Torque",
  "Voltage",
  "Volume",
  "Weight",
  "SwedishAddress",
  "SwedishBankAccount",
  "SwedishBankgiroNumber",
  "SwedishCoordinationNumber",
  "SwedishCounty",
  "SwedishMunicipality",
  "SwedishOcrReferenceNumber",
  "SwedishOrganizationNumber",
  "SwedishPersonalIdentityNumber",
  "SwedishPostgiroNumber",
  "SwedishPropertyDesignation",
  "SwedishSwishNumber",
  "Url",
] as const;

/** `TextScanResult` typed accessors covering every scannable ported type. */
const EXPECTED_SCAN_RESULT_ACCESSORS = [
  "addresses",
  "bankAccounts",
  "bankgiroNumbers",
  "bics",
  "coordinationNumbers",
  "counties",
  "countries",
  "dunsNumbers",
  "emails",
  "euVatNumbers",
  "ibans",
  "isins",
  "leiCodes",
  "municipalities",
  "ocrReferences",
  "organizationNumbers",
  "personalIdentityNumbers",
  "phoneNumbers",
  "postgiroNumbers",
  "propertyDesignations",
  "swedishAddresses",
  "swedishSwishNumbers",
  "urls",
  "zipCodes",
] as const;

describe(".NET parity — ported namespaces", () => {
  for (const [namespace, types] of Object.entries(EXPECTED_TYPES)) {
    it.each(types)(`${namespace} exports %s`, (typeName) => {
      expect(exported[typeName]).toBeDefined();
    });
  }

  it.each(EXPECTED_MASKING_FUNCTIONS)("exports masking function %s", (name) => {
    expect(typeof exported[name]).toBe("function");
  });

  it.each(EXPECTED_VALIDATE_TYPES)("%s exposes static validate()", (typeName) => {
    const type = exported[typeName] as { validate?: unknown };
    expect(typeof type.validate).toBe("function");
  });

  it.each(EXPECTED_SCANNABLE_TYPES)("%s exposes static findCandidatesInText()", (typeName) => {
    const type = exported[typeName] as { findCandidatesInText?: unknown };
    expect(typeof type.findCandidatesInText).toBe("function");
  });

  it.each(EXPECTED_SCANNABLE_TYPES)("%s is registered on the default scanner", (typeName) => {
    const registered = primitives.defaultTextScanner.registered.map((r) => r.typeName);
    expect(registered).toContain(typeName);
  });

  it.each(EXPECTED_SCAN_RESULT_ACCESSORS)("TextScanResult exposes %s", (accessor) => {
    const result = primitives.defaultTextScanner.scan("");
    expect(result[accessor as keyof typeof result]).toEqual([]);
  });

  it("every ported type exposes the common static API", () => {
    const skip = new Set([
      // Aggregate parsers and enum-like helpers without the value-object shape.
      "SwedishOrganizationIdentifierParser",
      "SwedishBankingNumberParser",
      "SwedishBankingNumber",
      "SwedishBank",
      "OcrReferenceOptions",
      "PhoneNumberTestData",
      "ContactAddress",
      "ContactAddressBuilder",
      "CountryAddressBase",
      "CountryAddressZipCodeBase",
      "ExchangeRates",
      "TextCandidate",
      "TextScanResult",
      "TextScanner",
      "ValidationIssue",
      "ValidationResult",
      // Plain data record in .NET too; only reachable via `Country.capital`.
      "CountryCapital",
      // Measurement unit lookups. These expose tryParse/parse only in .NET —
      // there is nothing to format or normalize about a unit itself.
      "AreaUnit",
      "DataSizeUnit",
      "ElectricChargeUnit",
      "ElectricCurrentUnit",
      "EnergyUnit",
      "FlowRateUnit",
      "FrequencyUnit",
      "LengthUnit",
      "LuminanceUnit",
      "LuminousFluxUnit",
      "PowerUnit",
      "PressureUnit",
      "RotationalSpeedUnit",
      "SpeedUnit",
      "TemperatureUnit",
      "TemperatureDelta",
      "TorqueUnit",
      "VoltageUnit",
      "VolumeUnit",
      "WeightUnit",
      // Enums / const objects.
      "SoundWeighting",
      "BankAccountHolderType",
      "OcrReferenceControlType",
      "SwedishBankingNumberType",
      "SwedishOrganizationIdentifierType",
      "SwedishOrganizationType",
      "SwedishPropertyTaxationCategory",
      "Continent",
      "TextDirection",
      "WritingScript",
      "PublicEmailProvider",
      "TextCandidateCategory",
      "TextMatchConfidence",
      "ValidationErrorReason",
    ]);

    const missing: string[] = [];
    for (const types of Object.values(EXPECTED_TYPES)) {
      for (const typeName of types) {
        if (skip.has(typeName)) continue;
        const type = exported[typeName] as Record<string, unknown>;
        for (const member of ["tryParse", "parse", "isValid", "format", "normalize"]) {
          if (typeof type[member] !== "function") missing.push(`${typeName}.${member}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});

describe(".NET parity — every namespace is ported", () => {
  // Sentinels for the namespaces that landed last. Their per-namespace suites in
  // test/vehicle and test/product run against fixtures captured from .NET.
  it.each(["Gtin13", "StorageCapacity", "VehicleIdentificationNumber"])(
    "%s resolves from the root entry",
    (typeName) => {
      expect(exported[typeName]).toBeDefined();
    },
  );
});
