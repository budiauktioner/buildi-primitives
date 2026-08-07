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
      "Country",
      "DataSize",
      "DunsNumber",
      "ElectricCharge",
      "ElectricCurrent",
      "EmailAddress",
      "Energy",
      "EuVatNumber",
      "FlowRate",
      "Frequency",
      "Iban",
      "Isin",
      "LeiCode",
      "Length",
      "Luminance",
      "LuminousFlux",
      "PhoneNumber",
      "Power",
      "Pressure",
      "RotationalSpeed",
      "Speed",
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
      "Torque",
      "Url",
      "Voltage",
      "Volume",
      "Weight",
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
      [result.powers, "Power"],
      [result.pressures, "Pressure"],
      [result.rotationalSpeeds, "RotationalSpeed"],
      [result.speeds, "Speed"],
      [result.torques, "Torque"],
      [result.voltages, "Voltage"],
      [result.volumes, "Volume"],
      [result.weights, "Weight"],
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
      "Power",
      "Pressure",
      "RotationalSpeed",
      "Speed",
      "Torque",
      "Voltage",
      "Volume",
      "Weight",
    ]);

    for (const registered of defaultTextScanner.registered) {
      expect(accessorTypeNames).toContain(registered.typeName);
    }
  });
});
