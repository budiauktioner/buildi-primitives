import { Decimal } from "../internal/decimal.js";
import { MeasurementUnit, MeasurementUnitIndex } from "../internal/measurement-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

function factor(literal: string): Decimal {
  const parsed = Decimal.parse(literal);
  /* c8 ignore next */
  if (parsed === null) throw new Error(`Invalid conversion factor: ${literal}`);
  return parsed;
}

/**
 * A unit of length identified by its symbol. Each unit carries English and
 * Swedish names, singular and plural forms, and an exact conversion factor to
 * the base SI unit (meter).
 */
export class LengthUnit extends MeasurementUnit {
  declare private readonly __lengthUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Length Unit",
    localizedName: "Längdenhet",
    emoji: "📏",
    sources: Object.freeze([]),
  });

  static readonly Nanometer = new LengthUnit({
    symbol: "nm",
    englishName: "nanometer",
    localizedName: "nanometer",
    pluralEnglish: "nanometers",
    pluralSwedish: "nanometer",
    toBaseUnitFactor: factor("0.000000001"),
    aliases: ["nanometre", "nanometres"],
  });

  static readonly Micrometer = new LengthUnit({
    symbol: "µm",
    englishName: "micrometer",
    localizedName: "mikrometer",
    pluralEnglish: "micrometers",
    pluralSwedish: "mikrometer",
    toBaseUnitFactor: factor("0.000001"),
    aliases: ["micrometre", "micrometres", "um"],
  });

  static readonly Millimeter = new LengthUnit({
    symbol: "mm",
    englishName: "millimeter",
    localizedName: "millimeter",
    pluralEnglish: "millimeters",
    pluralSwedish: "millimeter",
    toBaseUnitFactor: factor("0.001"),
    aliases: ["millimetre", "millimetres"],
  });

  static readonly Centimeter = new LengthUnit({
    symbol: "cm",
    englishName: "centimeter",
    localizedName: "centimeter",
    pluralEnglish: "centimeters",
    pluralSwedish: "centimeter",
    toBaseUnitFactor: factor("0.01"),
    aliases: ["centimetre", "centimetres"],
  });

  static readonly Decimeter = new LengthUnit({
    symbol: "dm",
    englishName: "decimeter",
    localizedName: "decimeter",
    pluralEnglish: "decimeters",
    pluralSwedish: "decimeter",
    toBaseUnitFactor: factor("0.1"),
    aliases: ["decimetre", "decimetres"],
  });

  static readonly Meter = new LengthUnit({
    symbol: "m",
    englishName: "meter",
    localizedName: "meter",
    pluralEnglish: "meters",
    pluralSwedish: "meter",
    toBaseUnitFactor: factor("1"),
    aliases: ["metre", "metres"],
  });

  static readonly Kilometer = new LengthUnit({
    symbol: "km",
    englishName: "kilometer",
    localizedName: "kilometer",
    pluralEnglish: "kilometers",
    pluralSwedish: "kilometer",
    toBaseUnitFactor: factor("1000"),
    aliases: ["kilometre", "kilometres"],
  });

  static readonly Inch = new LengthUnit({
    symbol: "in",
    englishName: "inch",
    localizedName: "tum",
    pluralEnglish: "inches",
    pluralSwedish: "tum",
    toBaseUnitFactor: factor("0.0254"),
    aliases: ["inch", "inches", '"', "tum"],
  });

  static readonly Foot = new LengthUnit({
    symbol: "ft",
    englishName: "foot",
    localizedName: "fot",
    pluralEnglish: "feet",
    pluralSwedish: "fot",
    toBaseUnitFactor: factor("0.3048"),
    aliases: ["foot", "feet", "fot"],
  });

  static readonly Yard = new LengthUnit({
    symbol: "yd",
    englishName: "yard",
    localizedName: "yard",
    pluralEnglish: "yards",
    pluralSwedish: "yard",
    toBaseUnitFactor: factor("0.9144"),
    aliases: ["yard", "yards"],
  });

  static readonly Mile = new LengthUnit({
    symbol: "mi",
    englishName: "mile",
    localizedName: "engelsk mil",
    pluralEnglish: "miles",
    pluralSwedish: "engelska mil",
    toBaseUnitFactor: factor("1609.344"),
    aliases: ["mile", "miles"],
  });

  static readonly NauticalMile = new LengthUnit({
    symbol: "nmi",
    englishName: "nautical mile",
    localizedName: "nautisk mil",
    pluralEnglish: "nautical miles",
    pluralSwedish: "nautiska mil",
    toBaseUnitFactor: factor("1852"),
    aliases: ["nautical mile", "nautical miles", "sjömil", "NM"],
  });

  /** The Swedish `mil`, which is 10 km — not the international mile. */
  static readonly SwedishMile = new LengthUnit({
    symbol: "mil",
    englishName: "Swedish mile",
    localizedName: "mil",
    pluralEnglish: "Swedish miles",
    pluralSwedish: "mil",
    toBaseUnitFactor: factor("10000"),
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index: MeasurementUnitIndex<LengthUnit> = new MeasurementUnitIndex<LengthUnit>(
    [
      LengthUnit.Nanometer,
      LengthUnit.Micrometer,
      LengthUnit.Millimeter,
      LengthUnit.Centimeter,
      LengthUnit.Decimeter,
      LengthUnit.Meter,
      LengthUnit.Kilometer,
      LengthUnit.Inch,
      LengthUnit.Foot,
      LengthUnit.Yard,
      LengthUnit.Mile,
      LengthUnit.NauticalMile,
      LengthUnit.SwedishMile,
    ],
    LengthUnit.Meter,
    [LengthUnit.Millimeter, LengthUnit.Centimeter, LengthUnit.Meter, LengthUnit.Kilometer],
  );

  static get all(): readonly LengthUnit[] {
    return LengthUnit.index.all;
  }

  /** The base SI unit: meter. */
  static get baseUnit(): LengthUnit {
    return LengthUnit.index.baseUnit;
  }

  /**
   * Metric units ordered small to large, used to auto-scale display. Imperial
   * and niche units are excluded.
   */
  static get naturalScale(): readonly LengthUnit[] {
    return LengthUnit.index.naturalScale;
  }

  /**
   * Resolves a unit from a symbol, name, plural or alias, case-insensitively.
   *
   * `NM` is the one case-sensitive exception: uppercase means nautical mile,
   * while `nm` is nanometer.
   */
  static tryParse(input: string | null | undefined): LengthUnit | null {
    if (input == null) return null;
    if (input.trim() === "NM") return LengthUnit.NauticalMile;
    return LengthUnit.index.tryParse(input);
  }

  static parse(input: string): LengthUnit {
    const result = LengthUnit.tryParse(input);
    if (result === null) throw new Error("Unknown length unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in meters. */
  static getNatural(meters: Decimal): LengthUnit {
    return LengthUnit.index.getNatural(meters);
  }
}
