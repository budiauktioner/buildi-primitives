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
 * A unit of area identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class AreaUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Area Unit",
    localizedName: "Ytenhet",
    emoji: "📐",
    sources: Object.freeze([]),
  });

  static readonly SquareMillimeter = new AreaUnit({
    symbol: "mm²",
    englishName: "square millimeter",
    localizedName: "kvadratmillimeter",
    pluralEnglish: "square millimeters",
    pluralSwedish: "kvadratmillimeter",
    toBaseUnitFactor: factor("0.000001"),
    aliases: ["mm2", "sq mm", "square millimetre", "square millimetres"],
  });

  static readonly SquareCentimeter = new AreaUnit({
    symbol: "cm²",
    englishName: "square centimeter",
    localizedName: "kvadratcentimeter",
    pluralEnglish: "square centimeters",
    pluralSwedish: "kvadratcentimeter",
    toBaseUnitFactor: factor("0.0001"),
    aliases: ["cm2", "sq cm", "square centimetre", "square centimetres"],
  });

  static readonly SquareMeter = new AreaUnit({
    symbol: "m²",
    englishName: "square meter",
    localizedName: "kvadratmeter",
    pluralEnglish: "square meters",
    pluralSwedish: "kvadratmeter",
    toBaseUnitFactor: factor("1"),
    aliases: ["m2", "sq m", "sqm", "square metre", "square metres"],
  });

  static readonly SquareKilometer = new AreaUnit({
    symbol: "km²",
    englishName: "square kilometer",
    localizedName: "kvadratkilometer",
    pluralEnglish: "square kilometers",
    pluralSwedish: "kvadratkilometer",
    toBaseUnitFactor: factor("1000000"),
    aliases: ["km2", "sq km", "square kilometre", "square kilometres"],
  });

  static readonly Hectare = new AreaUnit({
    symbol: "ha",
    englishName: "hectare",
    localizedName: "hektar",
    pluralEnglish: "hectares",
    pluralSwedish: "hektar",
    toBaseUnitFactor: factor("10000"),
  });

  static readonly Acre = new AreaUnit({
    symbol: "acre",
    englishName: "acre",
    localizedName: "acre",
    pluralEnglish: "acres",
    pluralSwedish: "acre",
    toBaseUnitFactor: factor("4046.8564224"),
  });

  static readonly SquareFoot = new AreaUnit({
    symbol: "sq ft",
    englishName: "square foot",
    localizedName: "kvadratfot",
    pluralEnglish: "square feet",
    pluralSwedish: "kvadratfot",
    toBaseUnitFactor: factor("0.09290304"),
    aliases: ["sqft", "square feet", "square foot"],
  });

  static readonly SquareInch = new AreaUnit({
    symbol: "sq in",
    englishName: "square inch",
    localizedName: "kvadrattum",
    pluralEnglish: "square inches",
    pluralSwedish: "kvadrattum",
    toBaseUnitFactor: factor("0.00064516"),
    aliases: ["sqin", "square inches", "square inch"],
  });

  static readonly SquareYard = new AreaUnit({
    symbol: "sq yd",
    englishName: "square yard",
    localizedName: "kvadratyard",
    pluralEnglish: "square yards",
    pluralSwedish: "kvadratyard",
    toBaseUnitFactor: factor("0.83612736"),
    aliases: ["sqyd", "square yards", "square yard"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<AreaUnit>(
    [
      AreaUnit.SquareMillimeter,
      AreaUnit.SquareCentimeter,
      AreaUnit.SquareMeter,
      AreaUnit.SquareKilometer,
      AreaUnit.Hectare,
      AreaUnit.Acre,
      AreaUnit.SquareFoot,
      AreaUnit.SquareInch,
      AreaUnit.SquareYard,
    ],
    AreaUnit.SquareMeter,
    [AreaUnit.SquareCentimeter, AreaUnit.SquareMeter, AreaUnit.Hectare, AreaUnit.SquareKilometer],
  );

  static get all(): readonly AreaUnit[] {
    return AreaUnit.index.all;
  }

  /** The base unit: m². */
  static get baseUnit(): AreaUnit {
    return AreaUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly AreaUnit[] {
    return AreaUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): AreaUnit | null {
    return AreaUnit.index.tryParse(input);
  }

  static parse(input: string): AreaUnit {
    const result = AreaUnit.tryParse(input);
    if (result === null) throw new Error("Unknown area unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in m². */
  static getNatural(baseValue: Decimal): AreaUnit {
    return AreaUnit.index.getNatural(baseValue);
  }
}
