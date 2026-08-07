// eslint-disable-next-line @typescript-eslint/no-require-imports -- Exercises the CJS declaration condition.
import Root = require("@budiauktioner/buildi-primitives");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Exercises the CJS declaration condition.
import Measurement = require("@budiauktioner/buildi-primitives/measurement");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Exercises the CJS declaration condition.
import Product = require("@budiauktioner/buildi-primitives/product");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Exercises the CJS declaration condition.
import Vehicle = require("@budiauktioner/buildi-primitives/vehicle");

const {
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
} = Measurement;

const rootLength: Root.Length = Measurement.Length.fromMeters(1);
const measurementLength: Measurement.Length = Root.Length.fromMeters(1);
const rootLengthUnit: Root.LengthUnit = Measurement.LengthUnit.Meter;
const measurementLengthUnit: Measurement.LengthUnit = Root.LengthUnit.Meter;

rootLength.plus(measurementLength);
measurementLength.plus(rootLength);
Root.Length.create(1, measurementLengthUnit);
Measurement.Length.create(1, rootLengthUnit);

// @ts-expect-error Weight is not a root Length operand.
rootLength.plus(Measurement.Weight.fromKilograms(1));
// @ts-expect-error Root Weight is not a Measurement Length operand.
measurementLength.plus(Root.Weight.fromKilograms(1));

const rootProductOptions: Root.ScreenResolutionFormatOptions = {
  fallbackToTrimmedInputWhenInvalid: true,
};
const productOptions: Product.ScreenResolutionFormatOptions = rootProductOptions;
const rootProductOptionsAgain: Root.ScreenResolutionFormatOptions = productOptions;

const rootVehicleOptions: Root.EnginePowerFormatOptions = {
  decimals: 2,
  unit: Root.PowerUnit.Kilowatt,
};
const vehicleOptions: Vehicle.EnginePowerFormatOptions = rootVehicleOptions;
const rootVehicleOptionsAgain: Root.EnginePowerFormatOptions = vehicleOptions;

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
