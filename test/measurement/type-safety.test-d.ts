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
} from "../../src/measurement/index.js";

// Every unit class is nominally distinct.
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

// Every multiplicative quantity rejects a foreign quantity operand.
// @ts-expect-error Length is not an Area operand.
Area.create(1, AreaUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a DataSize operand.
DataSize.create(1, DataSizeUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not an ElectricCharge operand.
ElectricCharge.create(1, ElectricChargeUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not an ElectricCurrent operand.
ElectricCurrent.create(1, ElectricCurrentUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not an Energy operand.
Energy.create(1, EnergyUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a FlowRate operand.
FlowRate.create(1, FlowRateUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a Frequency operand.
Frequency.create(1, FrequencyUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Weight is not a Length operand.
Length.fromMeters(1).plus(Weight.fromKilograms(1));
// @ts-expect-error Length is not a Luminance operand.
Luminance.create(1, LuminanceUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a LuminousFlux operand.
LuminousFlux.create(1, LuminousFluxUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a Power operand.
Power.create(1, PowerUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a Pressure operand.
Pressure.create(1, PressureUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a RotationalSpeed operand.
RotationalSpeed.create(1, RotationalSpeedUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a Speed operand.
Speed.create(1, SpeedUnit.baseUnit).plus(Length.fromMeters(1));
// Temperature has a separate affine path and accepts only Temperature in difference.
// @ts-expect-error Length is not a Temperature operand.
Temperature.create(1, TemperatureUnit.Celsius).difference(Length.fromMeters(1));
// @ts-expect-error Length is not a Torque operand.
Torque.create(1, TorqueUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a Voltage operand.
Voltage.create(1, VoltageUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a Volume operand.
Volume.create(1, VolumeUnit.baseUnit).plus(Length.fromMeters(1));
// @ts-expect-error Length is not a Weight operand.
Weight.create(1, WeightUnit.baseUnit).plus(Length.fromMeters(1));
