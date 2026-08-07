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
 * A unit of weight identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class WeightUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Weight Unit",
    localizedName: "Viktenhet",
    emoji: "⚖️",
    sources: Object.freeze([]),
  });

  static readonly Microgram = new WeightUnit({
    symbol: "µg",
    englishName: "microgram",
    localizedName: "mikrogram",
    pluralEnglish: "micrograms",
    pluralSwedish: "mikrogram",
    toBaseUnitFactor: factor("0.000000001"),
    aliases: ["ug"],
  });

  static readonly Milligram = new WeightUnit({
    symbol: "mg",
    englishName: "milligram",
    localizedName: "milligram",
    pluralEnglish: "milligrams",
    pluralSwedish: "milligram",
    toBaseUnitFactor: factor("0.000001"),
  });

  static readonly Gram = new WeightUnit({
    symbol: "g",
    englishName: "gram",
    localizedName: "gram",
    pluralEnglish: "grams",
    pluralSwedish: "gram",
    toBaseUnitFactor: factor("0.001"),
  });

  static readonly Hectogram = new WeightUnit({
    symbol: "hg",
    englishName: "hectogram",
    localizedName: "hektogram",
    pluralEnglish: "hectograms",
    pluralSwedish: "hektogram",
    toBaseUnitFactor: factor("0.1"),
    aliases: ["hekto"],
  });

  static readonly Kilogram = new WeightUnit({
    symbol: "kg",
    englishName: "kilogram",
    localizedName: "kilogram",
    pluralEnglish: "kilograms",
    pluralSwedish: "kilogram",
    toBaseUnitFactor: factor("1"),
    aliases: ["kilo", "kilos"],
  });

  static readonly MetricTon = new WeightUnit({
    symbol: "t",
    englishName: "metric ton",
    localizedName: "ton",
    pluralEnglish: "metric tons",
    pluralSwedish: "ton",
    toBaseUnitFactor: factor("1000"),
    aliases: ["ton", "tonne", "tonnes", "metric ton", "metric tons"],
  });

  static readonly Pound = new WeightUnit({
    symbol: "lb",
    englishName: "pound",
    localizedName: "pund",
    pluralEnglish: "pounds",
    pluralSwedish: "pund",
    toBaseUnitFactor: factor("0.45359237"),
    aliases: ["pound", "pounds", "lbs"],
  });

  static readonly Ounce = new WeightUnit({
    symbol: "oz",
    englishName: "ounce",
    localizedName: "uns",
    pluralEnglish: "ounces",
    pluralSwedish: "uns",
    toBaseUnitFactor: factor("0.028349523125"),
    aliases: ["ounce", "ounces"],
  });

  static readonly Stone = new WeightUnit({
    symbol: "st",
    englishName: "stone",
    localizedName: "stone",
    pluralEnglish: "stones",
    pluralSwedish: "stone",
    toBaseUnitFactor: factor("6.35029318"),
    aliases: ["stone", "stones"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<WeightUnit>(
    [
      WeightUnit.Microgram,
      WeightUnit.Milligram,
      WeightUnit.Gram,
      WeightUnit.Hectogram,
      WeightUnit.Kilogram,
      WeightUnit.MetricTon,
      WeightUnit.Pound,
      WeightUnit.Ounce,
      WeightUnit.Stone,
    ],
    WeightUnit.Kilogram,
    [WeightUnit.Milligram, WeightUnit.Gram, WeightUnit.Kilogram, WeightUnit.MetricTon],
  );

  static get all(): readonly WeightUnit[] {
    return WeightUnit.index.all;
  }

  /** The base unit: kg. */
  static get baseUnit(): WeightUnit {
    return WeightUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly WeightUnit[] {
    return WeightUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): WeightUnit | null {
    return WeightUnit.index.tryParse(input);
  }

  static parse(input: string): WeightUnit {
    const result = WeightUnit.tryParse(input);
    if (result === null) throw new Error("Unknown weight unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in kg. */
  static getNatural(baseValue: Decimal): WeightUnit {
    return WeightUnit.index.getNatural(baseValue);
  }
}
