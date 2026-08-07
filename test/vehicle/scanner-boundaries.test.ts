import { describe, expect, it } from "vitest";
import { defaultTextScanner } from "../../src/index.js";
import { EmissionRate } from "../../src/vehicle/emission-rate.js";
import { EnergyConsumption } from "../../src/vehicle/energy-consumption.js";
import { EnginePower } from "../../src/vehicle/engine-power.js";
import { EuTypeApprovalNumber } from "../../src/vehicle/eu-type-approval-number.js";
import { FuelConsumption } from "../../src/vehicle/fuel-consumption.js";
import { OperatingHours } from "../../src/vehicle/operating-hours.js";
import { SwedishVehicleRegistrationNumber } from "../../src/vehicle/swedish-vehicle-registration-number.js";
import { VehicleIdentificationNumber } from "../../src/vehicle/vehicle-identification-number.js";
import { WheelRimDimension } from "../../src/vehicle/wheel-rim-dimension.js";

const BOUNDARIES = [
  ["Unicode letter", "å"],
  ["Unicode number", "٣"],
  ["underscore", "_"],
] as const;

const VEHICLE_SCANNERS = [
  [
    "registration number",
    "ABC123",
    SwedishVehicleRegistrationNumber.findCandidatesInText.bind(SwedishVehicleRegistrationNumber),
  ],
  [
    "VIN",
    "1HGCM82633A004352",
    VehicleIdentificationNumber.findCandidatesInText.bind(VehicleIdentificationNumber),
  ],
  ["emission rate", "221 g/km", EmissionRate.findCandidatesInText.bind(EmissionRate)],
  ["wheel rim dimension", "18x8J", WheelRimDimension.findCandidatesInText.bind(WheelRimDimension)],
  ["fuel consumption", "8 l/100km", FuelConsumption.findCandidatesInText.bind(FuelConsumption)],
  [
    "energy consumption",
    "150 Wh/km",
    EnergyConsumption.findCandidatesInText.bind(EnergyConsumption),
  ],
  ["engine power", "150 hk", EnginePower.findCandidatesInText.bind(EnginePower)],
  ["operating hours", "1234 h", OperatingHours.findCandidatesInText.bind(OperatingHours)],
  [
    "EU type approval",
    "e9*2007/46*6364*09",
    EuTypeApprovalNumber.findCandidatesInText.bind(EuTypeApprovalNumber),
  ],
] as const;

describe("vehicle scanner Unicode boundaries", () => {
  it.each(
    VEHICLE_SCANNERS.flatMap(([scannerName, sample, scan]) =>
      BOUNDARIES.flatMap(([boundaryName, boundary]) => [
        [`${scannerName} after ${boundaryName}`, () => scan(`${boundary}${sample})`)] as const,
        [`${scannerName} before ${boundaryName}`, () => scan(`(${sample}${boundary}`)] as const,
      ]),
    ),
  )("does not find %s", (_name, scan) => {
    expect(scan()).toEqual([]);
  });
});

describe("vehicle scanner source spans", () => {
  it("preserves a registration number's indices and original text after sharp S", () => {
    const registration = SwedishVehicleRegistrationNumber.findCandidatesInText("ß ABC 123")[0]!;

    expect(registration.startIndex).toBe(2);
    expect(registration.length).toBe(7);
    expect(registration.originalText).toBe("ABC 123");
  });

  it("preserves a VIN's indices and original text after sharp S", () => {
    const vin = VehicleIdentificationNumber.findCandidatesInText("ß 1HGCM82633A004352")[0]!;

    expect(vin.startIndex).toBe(2);
    expect(vin.length).toBe(17);
    expect(vin.originalText).toBe("1HGCM82633A004352");
  });

  it("masks a registration span without changing adjacent source after sharp S", () => {
    const text = "före ß ABC 123 efter";

    expect(defaultTextScanner.scan(text).maskAll(text)).toBe("före ß *** *** efter");
  });

  it("masks a VIN span without changing adjacent source after sharp S", () => {
    const text = "före ß 1HGCM82633A004352 efter";

    expect(defaultTextScanner.scan(text).maskAll(text)).toBe("före ß 1HG************** efter");
  });
});
