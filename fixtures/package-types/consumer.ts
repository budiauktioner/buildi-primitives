import {
  Length as RootLength,
  LengthUnit as RootLengthUnit,
  PowerUnit as RootPowerUnit,
  Weight as RootWeight,
  type EnginePowerFormatOptions as RootEnginePowerFormatOptions,
  type ScreenResolutionFormatOptions as RootScreenResolutionFormatOptions,
} from "@budiauktioner/buildi-primitives";
import {
  Area,
  AreaUnit,
  DataSize,
  DataSizeUnit,
  ElectricCharge,
  ElectricChargeUnit,
  ElectricCurrent,
  ElectricCurrentUnit,
  Energy,
  EnergyUnit,
  FlowRate,
  FlowRateUnit,
  Frequency,
  FrequencyUnit,
  Length,
  LengthUnit,
  Luminance,
  LuminanceUnit,
  LuminousFlux,
  LuminousFluxUnit,
  Power,
  PowerUnit,
  Pressure,
  PressureUnit,
  RotationalSpeed,
  RotationalSpeedUnit,
  Speed,
  SpeedUnit,
  Temperature,
  TemperatureUnit,
  Torque,
  TorqueUnit,
  Voltage,
  VoltageUnit,
  Volume,
  VolumeUnit,
  Weight,
  WeightUnit,
} from "@budiauktioner/buildi-primitives/measurement";
import type { ScreenResolutionFormatOptions } from "@budiauktioner/buildi-primitives/product";
import type { EnginePowerFormatOptions } from "@budiauktioner/buildi-primitives/vehicle";

const rootLength: RootLength = Length.fromMeters(1);
const measurementLength: Length = RootLength.fromMeters(1);
const rootLengthUnit: RootLengthUnit = LengthUnit.Meter;
const measurementLengthUnit: LengthUnit = RootLengthUnit.Meter;

rootLength.plus(measurementLength);
measurementLength.plus(rootLength);
RootLength.create(1, measurementLengthUnit);
Length.create(1, rootLengthUnit);

// @ts-expect-error Weight is not a root Length operand.
rootLength.plus(Weight.fromKilograms(1));
// @ts-expect-error Root Weight is not a Measurement Length operand.
measurementLength.plus(RootWeight.fromKilograms(1));

const rootProductOptions: RootScreenResolutionFormatOptions = {
  fallbackToTrimmedInputWhenInvalid: true,
};
const productOptions: ScreenResolutionFormatOptions = rootProductOptions;
const rootProductOptionsAgain: RootScreenResolutionFormatOptions = productOptions;

const rootVehicleOptions: RootEnginePowerFormatOptions = {
  decimals: 2,
  unit: RootPowerUnit.Kilowatt,
};
const vehicleOptions: EnginePowerFormatOptions = rootVehicleOptions;
const rootVehicleOptionsAgain: RootEnginePowerFormatOptions = vehicleOptions;

void rootProductOptionsAgain;
void rootVehicleOptionsAgain;

Area.create(1, AreaUnit.baseUnit);
DataSize.create(1, DataSizeUnit.baseUnit);
ElectricCharge.create(1, ElectricChargeUnit.baseUnit);
ElectricCurrent.create(1, ElectricCurrentUnit.baseUnit);
Energy.create(1, EnergyUnit.baseUnit);
FlowRate.create(1, FlowRateUnit.baseUnit);
Frequency.create(1, FrequencyUnit.baseUnit);
Length.create(1, LengthUnit.baseUnit);
Luminance.create(1, LuminanceUnit.baseUnit);
LuminousFlux.create(1, LuminousFluxUnit.baseUnit);
Power.create(1, PowerUnit.baseUnit);
Pressure.create(1, PressureUnit.baseUnit);
RotationalSpeed.create(1, RotationalSpeedUnit.baseUnit);
Speed.create(1, SpeedUnit.baseUnit);
Temperature.create(1, TemperatureUnit.Celsius);
Torque.create(1, TorqueUnit.baseUnit);
Voltage.create(1, VoltageUnit.baseUnit);
Volume.create(1, VolumeUnit.baseUnit);
Weight.create(1, WeightUnit.baseUnit);

Length.fromMeters(1).times(2).dividedBy(2);

// @ts-expect-error LengthUnit is not an AreaUnit.
Area.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a DataSizeUnit.
DataSize.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not an ElectricChargeUnit.
ElectricCharge.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not an ElectricCurrentUnit.
ElectricCurrent.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not an EnergyUnit.
Energy.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a FlowRateUnit.
FlowRate.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a FrequencyUnit.
Frequency.create(1, LengthUnit.Meter);
// @ts-expect-error WeightUnit is not a LengthUnit.
Length.create(1, WeightUnit.Kilogram);
// @ts-expect-error LengthUnit is not a LuminanceUnit.
Luminance.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a LuminousFluxUnit.
LuminousFlux.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a PowerUnit.
Power.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a PressureUnit.
Pressure.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a RotationalSpeedUnit.
RotationalSpeed.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a SpeedUnit.
Speed.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a TemperatureUnit.
Temperature.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a TorqueUnit.
Torque.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a VoltageUnit.
Voltage.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a VolumeUnit.
Volume.create(1, LengthUnit.Meter);
// @ts-expect-error LengthUnit is not a WeightUnit.
Weight.create(1, LengthUnit.Meter);
