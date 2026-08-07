import { afterEach, describe, expect, it } from "vitest";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";
import { defaultTextScanner } from "../../src/index.js";
import { ValidationErrorReason } from "../../src/validation/validation-error-reason.js";
import { EuVehicleCategory } from "../../src/vehicle/eu-vehicle-category.js";
import { SwedishVehicleRegistrationNumber } from "../../src/vehicle/swedish-vehicle-registration-number.js";
import { VehicleIdentificationNumber } from "../../src/vehicle/vehicle-identification-number.js";

/**
 * The behaviour the .NET vectors cannot reach: structured validation, derived
 * properties, the display language switch, and the aggregate scanner.
 */

afterEach(() => {
  PrimitivesDefaults.reset();
});

describe("VehicleIdentificationNumber", () => {
  it("splits a VIN into its ISO 3779 sections", () => {
    const vin = VehicleIdentificationNumber.parse("WBA3A5C55CF256789");

    expect(vin.wmi).toBe("WBA");
    expect(vin.vds).toBe("3A5C5");
    expect(vin.checkDigit).toBe("5");
    expect(vin.vis).toBe("CF256789");
    expect(vin.modelYearCode).toBe("C");
    expect(vin.assemblyPlantCode).toBe("F");
    expect(vin.sequentialNumber).toBe("256789");
  });

  it("maps the model year code to both years of the 30-year cycle", () => {
    expect([...VehicleIdentificationNumber.parse("WBA3A5C55CF256789").modelYears]).toEqual([
      1982, 2012,
    ]);
    expect([...VehicleIdentificationNumber.parse("1HGCM82633A004352").modelYears]).toEqual([
      2003, 2033,
    ]);
  });

  it("reports whether the MOD-11 check digit holds", () => {
    expect(VehicleIdentificationNumber.parse("1HGCM82633A004352").hasValidCheckDigit).toBe(true);
    expect(VehicleIdentificationNumber.parse("YV1DZ8256C2123456").hasValidCheckDigit).toBe(false);
  });

  it.each([
    [null, ValidationErrorReason.InputIsEmpty],
    ["   ", ValidationErrorReason.InputIsEmpty],
    ["W".repeat(31), ValidationErrorReason.InputTooLong],
    ["WBA3A5C55CF25678", ValidationErrorReason.InvalidLength],
    ["WBA3A5C55CF25678I", ValidationErrorReason.InvalidCharacters],
  ])("explains why %j is not a VIN", (input, reason) => {
    const result = VehicleIdentificationNumber.validate(input);

    expect(result.isValid).toBe(false);
    expect(result.issues.map((i) => i.reason)).toEqual([reason]);
  });

  it("reports a well-formed VIN as valid", () => {
    const result = VehicleIdentificationNumber.validate("wba3a5c55cf256789");

    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});

describe("SwedishVehicleRegistrationNumber", () => {
  it("derives the tax payment month from the number", () => {
    const classic = SwedishVehicleRegistrationNumber.parse("ABC 123");
    expect(classic.isNewFormat).toBe(false);
    expect(classic.taxPaymentDigit).toBe(3);
    expect(classic.taxPaymentMonth).toBe(6);

    // In the 2019 format the last character is a letter, so the digit before it counts.
    const modern = SwedishVehicleRegistrationNumber.parse("ABC 12A");
    expect(modern.isNewFormat).toBe(true);
    expect(modern.taxPaymentDigit).toBe(2);
    expect(modern.taxPaymentMonth).toBe(5);
  });

  it.each([
    [null, ValidationErrorReason.InputIsEmpty],
    ["ABC 12", ValidationErrorReason.InvalidLength],
    ["IQV 123", ValidationErrorReason.InvalidFormat],
    ["ABC 12O", ValidationErrorReason.InvalidFormat],
  ])("explains why %j is not a registration number", (input, reason) => {
    const result = SwedishVehicleRegistrationNumber.validate(input);

    expect(result.isValid).toBe(false);
    expect(result.issues.map((i) => i.reason)).toEqual([reason]);
  });
});

describe("EuVehicleCategory", () => {
  it("follows the display language", () => {
    const category = EuVehicleCategory.parse("N1G");

    PrimitivesDefaults.uiCulture = "en-US";
    expect(category.description).toBe("Light commercial vehicle ≤3.5 t (off-road)");

    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(category.description).toBe("Lätt lastbil ≤3,5 ton (terrängfordon)");
  });

  it("rejects suffixes the category cannot carry", () => {
    expect(EuVehicleCategory.isValid("L3")).toBe(false);
    expect(EuVehicleCategory.isValid("M1e")).toBe(false);
    expect(EuVehicleCategory.isValid("O1G")).toBe(false);
    expect(EuVehicleCategory.isValid("M1-A2")).toBe(false);
  });
});

describe("defaultTextScanner", () => {
  it("finds vehicle candidates through the typed accessors", () => {
    const result = defaultTextScanner.scan(
      "Volvo V60, ABC 123, VIN YV1DZ8256C2123456, däck 205/55R16 91V, " +
        "fälg 18 x 8 J, bultmönster 5 x 114.3, typgodkännande e9*2007/46*6364*09.",
    );

    expect(result.vehicleRegistrationNumbers.map((c) => c.value.value)).toEqual(["ABC123"]);
    expect(result.vehicleIdentificationNumbers.map((c) => c.value.value)).toEqual([
      "YV1DZ8256C2123456",
    ]);
    expect(result.tireDimensions.map((c) => c.value.value)).toEqual(["205/55R16 91V"]);
    expect(result.wheelRimDimensions.map((c) => c.value.value)).toEqual(["18x8J"]);
    expect(result.boltPatterns.map((c) => c.value.value)).toEqual(["5x114.3"]);
    expect(result.euTypeApprovalNumbers.map((c) => c.value.value)).toEqual(["e9*2007/46*6364*09"]);
  });

  it("masks vehicle identifiers in place", () => {
    const masked = defaultTextScanner
      .scan("Reg ABC 123 och chassinummer YV1DZ8256C2123456.")
      .maskAll("Reg ABC 123 och chassinummer YV1DZ8256C2123456.");

    expect(masked).toBe("Reg *** *** och chassinummer YV1**************.");
  });
});
