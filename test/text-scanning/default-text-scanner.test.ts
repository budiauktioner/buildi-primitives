import { describe, expect, it } from "vitest";
import { TextCandidateCategory, defaultTextScanner } from "../../src/index.js";

describe("defaultTextScanner", () => {
  it("registers all implemented findCandidatesInText scanners from the root entry", () => {
    const registered = defaultTextScanner.registered.map((r) => r.typeName).sort();

    expect(registered).toEqual([
      "Address",
      "AddressZipCode",
      "Area",
      "Bic",
      "BoltPattern",
      "Color",
      "Country",
      "DataSize",
      "DunsNumber",
      "ElectricCharge",
      "ElectricCurrent",
      "ElectricalPhase",
      "EmailAddress",
      "EmissionRate",
      "Energy",
      "EnginePower",
      "EuTypeApprovalNumber",
      "EuVatNumber",
      "EuroEmissionClass",
      "FlowRate",
      "Frequency",
      "FuelConsumption",
      "Gtin12",
      "Gtin13",
      "Gtin14",
      "Gtin8",
      "Iban",
      "IpRating",
      "Isin",
      "LeiCode",
      "Length",
      "Luminance",
      "LuminousFlux",
      "OperatingHours",
      "Percentage",
      "PhoneNumber",
      "Power",
      "Pressure",
      "Refrigerant",
      "RotationalSpeed",
      "ScreenResolution",
      "ScreenSize",
      "SoundLevel",
      "Speed",
      "SwedishAddress",
      "SwedishBankAccount",
      "SwedishBankgiroNumber",
      "SwedishCoordinationNumber",
      "SwedishCounty",
      "SwedishDrivingLicenseCategory",
      "SwedishEcoVehicleClassification",
      "SwedishMunicipality",
      "SwedishOcrReferenceNumber",
      "SwedishOrganizationNumber",
      "SwedishPersonalIdentityNumber",
      "SwedishPostgiroNumber",
      "SwedishPropertyDesignation",
      "SwedishSwishNumber",
      "SwedishVehicleRegistrationNumber",
      "Temperature",
      "TireDimension",
      "Torque",
      "Url",
      "VehicleIdentificationNumber",
      "Voltage",
      "Volume",
      "WatercraftIdentificationNumber",
      "Weight",
      "WheelRimDimension",
    ]);
  });

  it("finds candidates from several namespaces", () => {
    const text =
      "Ring +46 70 174 06 33, VAT SE559246042101, land Sverige, län Stockholm och adress Storgatan 12, 114 53 Stockholm.";
    const result = defaultTextScanner.scan(text);

    expect(result.byTypeName("Address").length).toBe(1);
    expect(result.byTypeName("SwedishAddress").length).toBe(1);
    expect(result.byTypeName("PhoneNumber").length).toBe(1);
    expect(result.byTypeName("EuVatNumber").length).toBe(1);
    expect(result.byTypeName("Country").length).toBeGreaterThanOrEqual(1);
    expect(
      result.countByCategory(TextCandidateCategory.OrganizationIdentifier),
    ).toBeGreaterThanOrEqual(1);
  });

  it("typed accessors return the same candidates as byTypeName", () => {
    const text =
      "Kontakt: info@example.com, https://example.com, tel +46 70 174 06 33, " +
      "orgnr 559246-0421, moms SE559246042101, IBAN SE4550000000058398257466, " +
      "BIC NDEASESS, bankgiro 5110-8348, plusgiro 4131300-8, ISIN SE0000108656, " +
      "LEI 549300T5RZ1HA5HZ3109, DUNS 350827673, personnummer 199001011234, " +
      "land Sverige, län Stockholm, fastighet Uppsala Fjärdingen 22:1, " +
      "adress Storgatan 12, 114 53 Stockholm.";
    const result = defaultTextScanner.scan(text);

    const pairs: ReadonlyArray<readonly [readonly { typeName: string }[], string]> = [
      [result.emails, "EmailAddress"],
      [result.urls, "Url"],
      [result.phoneNumbers, "PhoneNumber"],
      [result.zipCodes, "AddressZipCode"],
      [result.addresses, "Address"],
      [result.swedishAddresses, "SwedishAddress"],
      [result.personalIdentityNumbers, "SwedishPersonalIdentityNumber"],
      [result.coordinationNumbers, "SwedishCoordinationNumber"],
      [result.organizationNumbers, "SwedishOrganizationNumber"],
      [result.euVatNumbers, "EuVatNumber"],
      [result.leiCodes, "LeiCode"],
      [result.dunsNumbers, "DunsNumber"],
      [result.ibans, "Iban"],
      [result.bics, "Bic"],
      [result.bankgiroNumbers, "SwedishBankgiroNumber"],
      [result.postgiroNumbers, "SwedishPostgiroNumber"],
      [result.bankAccounts, "SwedishBankAccount"],
      [result.ocrReferences, "SwedishOcrReferenceNumber"],
      [result.swedishSwishNumbers, "SwedishSwishNumber"],
      [result.isins, "Isin"],
      [result.countries, "Country"],
      [result.counties, "SwedishCounty"],
      [result.municipalities, "SwedishMunicipality"],
      [result.propertyDesignations, "SwedishPropertyDesignation"],
      [result.areas, "Area"],
      [result.dataSizes, "DataSize"],
      [result.electricCharges, "ElectricCharge"],
      [result.electricCurrents, "ElectricCurrent"],
      [result.energies, "Energy"],
      [result.flowRates, "FlowRate"],
      [result.frequencies, "Frequency"],
      [result.lengths, "Length"],
      [result.luminances, "Luminance"],
      [result.luminousFluxes, "LuminousFlux"],
      [result.percentages, "Percentage"],
      [result.powers, "Power"],
      [result.soundLevels, "SoundLevel"],
      [result.pressures, "Pressure"],
      [result.rotationalSpeeds, "RotationalSpeed"],
      [result.speeds, "Speed"],
      [result.temperatures, "Temperature"],
      [result.torques, "Torque"],
      [result.voltages, "Voltage"],
      [result.volumes, "Volume"],
      [result.weights, "Weight"],
      [result.vehicleRegistrationNumbers, "SwedishVehicleRegistrationNumber"],
      [result.vehicleIdentificationNumbers, "VehicleIdentificationNumber"],
      [result.watercraftIdentificationNumbers, "WatercraftIdentificationNumber"],
      [result.operatingHourValues, "OperatingHours"],
      [result.boltPatterns, "BoltPattern"],
      [result.wheelRimDimensions, "WheelRimDimension"],
      [result.tireDimensions, "TireDimension"],
      [result.euTypeApprovalNumbers, "EuTypeApprovalNumber"],
      [result.enginePowers, "EnginePower"],
      [result.fuelConsumptions, "FuelConsumption"],
      [result.emissionRates, "EmissionRate"],
      [result.euroEmissionClasses, "EuroEmissionClass"],
      [result.swedishEcoVehicleClassifications, "SwedishEcoVehicleClassification"],
      [result.drivingLicenseCategories, "SwedishDrivingLicenseCategory"],
      [result.gtin8s, "Gtin8"],
      [result.gtin12s, "Gtin12"],
      [result.gtin13s, "Gtin13"],
      [result.gtin14s, "Gtin14"],
      [result.ipRatings, "IpRating"],
      [result.electricalPhases, "ElectricalPhase"],
      [result.refrigerants, "Refrigerant"],
      [result.colors, "Color"],
      [result.screenResolutions, "ScreenResolution"],
      [result.screenSizes, "ScreenSize"],
    ];

    for (const [candidates, typeName] of pairs) {
      expect(candidates.map((c) => c.typeName)).toEqual(
        result.byTypeName(typeName).map((c) => c.typeName),
      );
    }

    expect(result.emails.length).toBe(1);
    expect(result.ibans.length).toBe(1);
    expect(result.organizationNumbers.length).toBeGreaterThanOrEqual(1);
    expect(result.emails[0]?.value.value).toBe("info@example.com");
  });

  it("has a typed accessor for every registered scanner", () => {
    const accessorTypeNames = new Set([
      "EmailAddress",
      "Url",
      "PhoneNumber",
      "AddressZipCode",
      "Address",
      "SwedishAddress",
      "SwedishPersonalIdentityNumber",
      "SwedishCoordinationNumber",
      "SwedishOrganizationNumber",
      "EuVatNumber",
      "LeiCode",
      "DunsNumber",
      "Iban",
      "Bic",
      "SwedishBankgiroNumber",
      "SwedishPostgiroNumber",
      "SwedishBankAccount",
      "SwedishOcrReferenceNumber",
      "SwedishSwishNumber",
      "Isin",
      "Country",
      "SwedishCounty",
      "SwedishMunicipality",
      "SwedishPropertyDesignation",
      "Area",
      "DataSize",
      "ElectricCharge",
      "ElectricCurrent",
      "Energy",
      "FlowRate",
      "Frequency",
      "Length",
      "Luminance",
      "LuminousFlux",
      "Percentage",
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
      "SwedishVehicleRegistrationNumber",
      "VehicleIdentificationNumber",
      "WatercraftIdentificationNumber",
      "OperatingHours",
      "BoltPattern",
      "WheelRimDimension",
      "TireDimension",
      "EuTypeApprovalNumber",
      "EnginePower",
      "FuelConsumption",
      "EmissionRate",
      "EuroEmissionClass",
      "SwedishEcoVehicleClassification",
      "SwedishDrivingLicenseCategory",
      "Gtin8",
      "Gtin12",
      "Gtin13",
      "Gtin14",
      "IpRating",
      "ElectricalPhase",
      "Refrigerant",
      "Color",
      "ScreenResolution",
      "ScreenSize",
    ]);

    for (const registered of defaultTextScanner.registered) {
      expect(accessorTypeNames).toContain(registered.typeName);
    }
  });
});
