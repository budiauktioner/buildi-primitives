import { describe, expect, it } from "vitest";
import { Decimal, DecimalDivisionByZeroError } from "../../src/internal/decimal.js";
import { MeasurementUnit, MeasurementUnitIndex } from "../../src/internal/measurement-unit.js";
import type { MeasurementUnitDefinition } from "../../src/internal/measurement-unit.js";
import { Quantity, tryParseQuantity } from "../../src/internal/quantity.js";
import {
  Area,
  DataSize,
  ElectricCharge,
  ElectricCurrent,
  Energy,
  FlowRate,
  Frequency,
  Length,
  LengthUnit,
  Luminance,
  LuminousFlux,
  Power,
  Pressure,
  RotationalSpeed,
  Speed,
  Temperature,
  Torque,
  Voltage,
  Volume,
  Weight,
  WeightUnit,
} from "../../src/measurement/index.js";
import vectors from "./quantity-dotnet-vectors.json" with { type: "json" };

/**
 * Exercises the Phase 0 foundation — decimal, measurement splitter, unit index
 * and quantity base — against output captured from the .NET `Length` type.
 *
 * `Length` itself is not ported yet, so this fixture mirrors `LengthUnit`'s
 * real table. When the public type lands it should replace the fixture without
 * changing a single expectation.
 */

function factor(literal: string): Decimal {
  const parsed = Decimal.parse(literal);
  if (parsed === null) throw new Error(`Bad factor: ${literal}`);
  return parsed;
}

class TestMeasurementUnit extends MeasurementUnit {
  constructor(definition: MeasurementUnitDefinition) {
    super(definition);
  }
}

const nanometer = new TestMeasurementUnit({
  symbol: "nm",
  englishName: "nanometer",
  localizedName: "nanometer",
  pluralEnglish: "nanometers",
  pluralSwedish: "nanometer",
  toBaseUnitFactor: factor("0.000000001"),
  aliases: ["nanometre", "nanometres"],
});
const micrometer = new TestMeasurementUnit({
  symbol: "µm",
  englishName: "micrometer",
  localizedName: "mikrometer",
  pluralEnglish: "micrometers",
  pluralSwedish: "mikrometer",
  toBaseUnitFactor: factor("0.000001"),
  aliases: ["micrometre", "micrometres", "um"],
});
const millimeter = new TestMeasurementUnit({
  symbol: "mm",
  englishName: "millimeter",
  localizedName: "millimeter",
  pluralEnglish: "millimeters",
  pluralSwedish: "millimeter",
  toBaseUnitFactor: factor("0.001"),
  aliases: ["millimetre", "millimetres"],
});
const centimeter = new TestMeasurementUnit({
  symbol: "cm",
  englishName: "centimeter",
  localizedName: "centimeter",
  pluralEnglish: "centimeters",
  pluralSwedish: "centimeter",
  toBaseUnitFactor: factor("0.01"),
  aliases: ["centimetre", "centimetres"],
});
const decimeter = new TestMeasurementUnit({
  symbol: "dm",
  englishName: "decimeter",
  localizedName: "decimeter",
  pluralEnglish: "decimeters",
  pluralSwedish: "decimeter",
  toBaseUnitFactor: factor("0.1"),
  aliases: ["decimetre", "decimetres"],
});
const meter = new TestMeasurementUnit({
  symbol: "m",
  englishName: "meter",
  localizedName: "meter",
  pluralEnglish: "meters",
  pluralSwedish: "meter",
  toBaseUnitFactor: factor("1"),
  aliases: ["metre", "metres"],
});
const kilometer = new TestMeasurementUnit({
  symbol: "km",
  englishName: "kilometer",
  localizedName: "kilometer",
  pluralEnglish: "kilometers",
  pluralSwedish: "kilometer",
  toBaseUnitFactor: factor("1000"),
  aliases: ["kilometre", "kilometres"],
});
const inch = new TestMeasurementUnit({
  symbol: "in",
  englishName: "inch",
  localizedName: "tum",
  pluralEnglish: "inches",
  pluralSwedish: "tum",
  toBaseUnitFactor: factor("0.0254"),
  aliases: ["inch", "inches", '"', "tum"],
});
const foot = new TestMeasurementUnit({
  symbol: "ft",
  englishName: "foot",
  localizedName: "fot",
  pluralEnglish: "feet",
  pluralSwedish: "fot",
  toBaseUnitFactor: factor("0.3048"),
  aliases: ["foot", "feet", "fot"],
});
const yard = new TestMeasurementUnit({
  symbol: "yd",
  englishName: "yard",
  localizedName: "yard",
  pluralEnglish: "yards",
  pluralSwedish: "yard",
  toBaseUnitFactor: factor("0.9144"),
  aliases: ["yard", "yards"],
});
const mile = new TestMeasurementUnit({
  symbol: "mi",
  englishName: "mile",
  localizedName: "engelsk mil",
  pluralEnglish: "miles",
  pluralSwedish: "engelska mil",
  toBaseUnitFactor: factor("1609.344"),
  aliases: ["mile", "miles"],
});
const nauticalMile = new TestMeasurementUnit({
  symbol: "nmi",
  englishName: "nautical mile",
  localizedName: "nautisk mil",
  pluralEnglish: "nautical miles",
  pluralSwedish: "nautiska mil",
  toBaseUnitFactor: factor("1852"),
  aliases: ["nautical mile", "nautical miles", "sjömil", "NM"],
});
const swedishMile = new TestMeasurementUnit({
  symbol: "mil",
  englishName: "Swedish mile",
  localizedName: "mil",
  pluralEnglish: "Swedish miles",
  pluralSwedish: "mil",
  toBaseUnitFactor: factor("10000"),
});

const lengthUnits = new MeasurementUnitIndex(
  [
    nanometer,
    micrometer,
    millimeter,
    centimeter,
    decimeter,
    meter,
    kilometer,
    inch,
    foot,
    yard,
    mile,
    nauticalMile,
    swedishMile,
  ],
  meter,
  [millimeter, centimeter, meter, kilometer],
);

/** `nm` is nanometer, so the uppercase `NM` for nautical mile is case-sensitive. */
function resolveLengthUnit(suffix: string): MeasurementUnit | null {
  if (suffix.trim() === "NM") return nauticalMile;
  return lengthUnits.tryParse(suffix);
}

class TestLength extends Quantity<MeasurementUnit> {
  protected get units(): MeasurementUnitIndex<MeasurementUnit> {
    return lengthUnits;
  }

  protected withBaseValue(baseValue: Decimal, unit: MeasurementUnit): this {
    return new TestLength(baseValue, unit) as this;
  }

  static tryParse(input: string | null | undefined): TestLength | null {
    const parsed = tryParseQuantity(input, lengthUnits, resolveLengthUnit);
    return parsed === null ? null : new TestLength(parsed.baseValue, parsed.unit);
  }

  static format(input: string | null | undefined, fallback = false): string | null {
    const parsed = TestLength.tryParse(input);
    if (parsed !== null) return parsed.toString();
    return fallback && input != null && input.trim().length > 0 ? input.trim() : null;
  }

  static normalize(input: string | null | undefined, fallback = false): string | null {
    const parsed = TestLength.tryParse(input);
    if (parsed !== null) return parsed.toNormalizedString();
    if (!fallback || input == null || input.trim().length === 0) return null;
    return input.trim();
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && TestLength.normalize(input) === input;
  }
}

interface Vector {
  input: string;
  valid: string;
  toString?: string;
  normalized?: string;
  natural?: string;
  natural2?: string;
  originalUnit?: string;
  meters?: string;
  inKm?: string;
  inFt3?: string;
  format: string | null;
  formatFallback: string | null;
  normalize: string | null;
  isNormalized: string;
}

const cases = vectors.cases as unknown as Vector[];

describe("quantity foundation against .NET Length vectors", () => {
  it("covers the generated cases", () => {
    expect(cases.length).toBeGreaterThan(40);
  });

  it.each(cases.map((c) => [c.input, c] as const))("matches .NET for %j", (_input, vector) => {
    const parsed = TestLength.tryParse(vector.input);

    expect(parsed !== null).toBe(vector.valid === "true");

    if (parsed !== null) {
      expect(parsed.toString()).toBe(vector.toString);
      expect(parsed.toNormalizedString()).toBe(vector.normalized);
      expect(parsed.toNaturalString()).toBe(vector.natural);
      expect(parsed.toNaturalString(2)).toBe(vector.natural2);
      expect(parsed.originalUnit.symbol).toBe(vector.originalUnit);
      expect(parsed.inDecimal(meter).toString()).toBe(vector.meters);
      expect(parsed.toStringInUnit(kilometer)).toBe(vector.inKm);
      expect(parsed.toStringInUnit(foot, 3)).toBe(vector.inFt3);
    }

    expect(TestLength.format(vector.input)).toBe(vector.format);
    expect(TestLength.format(vector.input, true)).toBe(vector.formatFallback);
    expect(TestLength.normalize(vector.input)).toBe(vector.normalize);
    expect(TestLength.isNormalized(vector.input)).toBe(vector.isNormalized === "true");
  });

  it.each(vectors.natural as unknown as string[][])(
    "picks the natural unit for %s m",
    (meters, expectedSymbol, expectedString) => {
      const parsed = TestLength.tryParse(`${meters} m`);
      expect(parsed).not.toBeNull();
      expect(parsed!.naturalUnit.symbol).toBe(expectedSymbol);
      expect(parsed!.toNaturalString()).toBe(expectedString);
    },
  );
});

describe("quantity arithmetic and comparison", () => {
  it("adds and subtracts in the base unit", () => {
    const a = TestLength.tryParse("1 km")!;
    const b = TestLength.tryParse("500 m")!;

    expect(a.plus(b).toNormalizedString()).toBe("1500 m");
    expect(a.minus(b).toNormalizedString()).toBe("500 m");
  });

  it("keeps the left operand's unit for display", () => {
    const a = TestLength.tryParse("1 km")!;
    const b = TestLength.tryParse("500 m")!;
    expect(a.plus(b).toString()).toBe("1.5 km");
  });

  it("scales exactly", () => {
    const length = TestLength.tryParse("3 ft")!;
    expect(length.times(Decimal.parse("2")!).toNormalizedString()).toBe("1.8288 m");
    expect(length.dividedBy(Decimal.parse("2")!).toNormalizedString()).toBe("0.4572 m");
    expect(length.negated().toNormalizedString()).toBe("-0.9144 m");
  });

  it("compares across units", () => {
    const kilometer1 = TestLength.tryParse("1 km")!;
    const meters1000 = TestLength.tryParse("1000 m")!;
    const meters999 = TestLength.tryParse("999 m")!;

    expect(kilometer1.equals(meters1000)).toBe(true);
    expect(kilometer1.compareTo(meters1000)).toBe(0);
    expect(kilometer1.isGreaterThan(meters999)).toBe(true);
    expect(meters999.isLessThan(kilometer1)).toBe(true);
    expect(kilometer1.compareTo(null)).toBe(1);
    expect(kilometer1.equals(null)).toBe(false);
  });
});

describe("public quantity invariants", () => {
  it("accepts number scalars", () => {
    expect(Length.fromFeet(3).times(2).toNormalizedString()).toBe("1.8288 m");
    expect(Length.fromFeet(3).dividedBy(2).toNormalizedString()).toBe("0.4572 m");
  });

  it("rejects addition and subtraction across dimensions at runtime", () => {
    expect(() => Length.fromMeters(1).plus(Weight.fromKilograms(2) as never)).toThrow(RangeError);
    expect(() => Length.fromMeters(1).minus(Weight.fromKilograms(2) as never)).toThrow(RangeError);
  });

  it("rejects comparison across dimensions at runtime", () => {
    expect(() => Length.fromMeters(1).compareTo(Weight.fromKilograms(1) as never)).toThrow(
      RangeError,
    );
  });

  it("does not consider equal base values from different dimensions equal", () => {
    expect(Length.fromMeters(1).equals(Weight.fromKilograms(1) as never)).toBe(false);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.MAX_VALUE])(
    "rejects unrepresentable scalar %s",
    (scalar) => {
      expect(() => Length.fromMeters(1).times(scalar)).toThrow(RangeError);
      expect(() => Length.fromMeters(1).dividedBy(scalar)).toThrow(RangeError);
    },
  );

  it("rejects division by a zero scalar", () => {
    expect(() => Length.fromMeters(1).dividedBy(0)).toThrow(DecimalDivisionByZeroError);
  });

  it.each([
    ["Area", () => Area.create(1, WeightUnit.Gram as never)],
    ["DataSize", () => DataSize.create(1, WeightUnit.Gram as never)],
    ["ElectricCharge", () => ElectricCharge.create(1, WeightUnit.Gram as never)],
    ["ElectricCurrent", () => ElectricCurrent.create(1, WeightUnit.Gram as never)],
    ["Energy", () => Energy.create(1, WeightUnit.Gram as never)],
    ["FlowRate", () => FlowRate.create(1, WeightUnit.Gram as never)],
    ["Frequency", () => Frequency.create(1, WeightUnit.Gram as never)],
    ["Length", () => Length.create(1, WeightUnit.Gram as never)],
    ["Luminance", () => Luminance.create(1, WeightUnit.Gram as never)],
    ["LuminousFlux", () => LuminousFlux.create(1, WeightUnit.Gram as never)],
    ["Power", () => Power.create(1, WeightUnit.Gram as never)],
    ["Pressure", () => Pressure.create(1, WeightUnit.Gram as never)],
    ["RotationalSpeed", () => RotationalSpeed.create(1, WeightUnit.Gram as never)],
    ["Speed", () => Speed.create(1, WeightUnit.Gram as never)],
    ["Temperature", () => Temperature.create(1, WeightUnit.Gram as never)],
    ["Torque", () => Torque.create(1, WeightUnit.Gram as never)],
    ["Voltage", () => Voltage.create(1, WeightUnit.Gram as never)],
    ["Volume", () => Volume.create(1, WeightUnit.Gram as never)],
    ["Weight", () => Weight.create(1, LengthUnit.Meter as never)],
  ] as const)("rejects foreign units in %s.create", (_name, create) => {
    expect(create).toThrow(RangeError);
  });

  it("freezes unit instances and indexes", () => {
    expect(Object.isFrozen(LengthUnit.Meter)).toBe(true);
    expect(Object.isFrozen(LengthUnit.all)).toBe(true);
    expect(() => Reflect.set(LengthUnit.Meter, "symbol", "broken")).toThrow(TypeError);
  });
});

describe("unit index", () => {
  it.each([
    ["km", "km"],
    ["KM", "km"],
    ["kilometer", "km"],
    ["kilometres", "km"],
    ["tum", "in"],
    ["sjömil", "nmi"],
    ["mil", "mil"],
  ])("resolves %j to %s", (input, expected) => {
    expect(lengthUnits.tryParse(input)?.symbol).toBe(expected);
  });

  it.each([null, undefined, "", "   ", "parsec"])("rejects %j", (input) => {
    expect(lengthUnits.tryParse(input)).toBeNull();
  });

  it("keeps nm as nanometer while NM is nautical mile", () => {
    expect(lengthUnits.tryParse("nm")?.symbol).toBe("nm");
    expect(resolveLengthUnit("NM")?.symbol).toBe("nmi");
  });
});
