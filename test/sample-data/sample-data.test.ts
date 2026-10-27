import { describe, expect, it } from "vitest";
import {
  BankingSampleData,
  ContactSampleData,
  FinanceSampleData,
  GeographySampleData,
  OrganizationSampleData,
  PropertySampleData,
  VehicleSampleData,
  WebSampleData,
} from "../../src/sample-data/index.js";

describe("sample data", () => {
  it("exposes contact samples", () => {
    expect(ContactSampleData.PhoneNumber.systembolaget.toE164String()).toContain("+46");
    expect(ContactSampleData.PhoneNumber.all.length).toBeGreaterThanOrEqual(1);
  });

  it("exposes geography samples", () => {
    expect(GeographySampleData.SwedishCounty.stockholm.toString()).toBe("Stockholms län");
    expect(GeographySampleData.SwedishMunicipality.stockholm.toString()).toBe("Stockholm");
    expect(GeographySampleData.Language.swedish.toNormalizedString()).toBe("sv");
    expect(GeographySampleData.GeoCoordinate.stockholm.toNormalizedString()).toBe(
      "59.3293, 18.0686",
    );
  });

  it("exposes organization samples", () => {
    expect(OrganizationSampleData.OrganizationNumber.budiAB.toString()).toBe("559246-0421");
    expect(OrganizationSampleData.EuVatNumber.budiAB.toString()).toBe("SE559246042101");
    expect(OrganizationSampleData.ElfCode.aktiebolag.toNormalizedString()).toBe("XTIQ");
    expect(OrganizationSampleData.SwedishSniCode.budiAB.toString()).toBe("47.917");
  });

  it("exposes web samples", () => {
    expect(WebSampleData.EmailAddress.example.value).toBe("user@example.com");
    expect(WebSampleData.EmailAddress.all.length).toBeGreaterThanOrEqual(1);
    expect(WebSampleData.Url.example.host).toBe("example.com");
    expect(WebSampleData.Url.all.length).toBeGreaterThanOrEqual(1);
  });

  it("exposes property samples", () => {
    expect(PropertySampleData.SwedishPropertyDesignation.uppsalaDomkyrka.value).toBe(
      "Uppsala Fjärdingen 22:1",
    );
    expect(PropertySampleData.SwedishPropertyDesignation.all.length).toBeGreaterThanOrEqual(1);
    expect(PropertySampleData.SwedishPropertyTaxationCode.smahusBebyggd.code).toBe("220");
    expect(PropertySampleData.SwedishPropertyTaxationCode.all.length).toBeGreaterThanOrEqual(1);
  });

  it("exposes vehicle samples", () => {
    expect(VehicleSampleData.WatercraftIdentificationNumber.iso10087Example.formatted).toBe(
      "NL-HXAB7A33G506",
    );
    expect(VehicleSampleData.WatercraftIdentificationNumber.unitedStatesExample.value).toBe(
      "ZZZ00001A020",
    );
    expect(VehicleSampleData.WatercraftIdentificationNumber.all.length).toBeGreaterThanOrEqual(2);
  });

  it("exposes banking samples", () => {
    expect(BankingSampleData.Iban.swedishGeneric.value).toBe("SE4550000000058398257466");
    expect(BankingSampleData.Iban.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.Bic.nordea.code).toBe("NDEASESS");
    expect(BankingSampleData.Bic.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.SwedishBankgiroNumber.budiAB.formatted).toBe("235-9321");
    expect(BankingSampleData.SwedishBankgiroNumber.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.SwedishPostgiroNumber.vattenfall.formatted).toBe("4131300-8");
    expect(BankingSampleData.SwedishPostgiroNumber.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.SwedishOcrReferenceNumber.generic.value).toBe("12345674");
    expect(BankingSampleData.SwedishOcrReferenceNumber.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.SwedishBankClearingNumber.seb.digits).toBe("5001");
    expect(BankingSampleData.SwedishBankClearingNumber.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.SwedishBankAccount.seb.formatted).toBe("5001-1234567");
    expect(BankingSampleData.SwedishBankAccount.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.SwedishBankAccountHolderName.person.value).toBe("Anna Andersson");
    expect(BankingSampleData.SwedishBankAccountHolderName.all.length).toBeGreaterThanOrEqual(1);
    expect(BankingSampleData.SwedishSwishNumber.rodaKorset.value).toBe("1236652895");
    expect(BankingSampleData.SwedishSwishNumber.all.length).toBeGreaterThanOrEqual(1);
  });

  it("exposes finance samples", () => {
    expect(FinanceSampleData.Currency.sek.code).toBe("SEK");
    expect(FinanceSampleData.Currency.all.length).toBeGreaterThanOrEqual(1);
    expect(FinanceSampleData.Isin.ericsson.value).toBe("SE0000108656");
    expect(FinanceSampleData.Isin.all.length).toBeGreaterThanOrEqual(1);
    expect(FinanceSampleData.MoneyAmount.oneThousandSek.amount).toBe(1000);
    expect(FinanceSampleData.MoneyAmount.all.length).toBeGreaterThanOrEqual(1);
  });
});
