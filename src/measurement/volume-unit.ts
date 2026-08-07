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
 * A unit of volume identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class VolumeUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Volume Unit",
    localizedName: "Volymenhet",
    emoji: "🧪",
    sources: Object.freeze([]),
  });

  static readonly Microliter = new VolumeUnit({
    symbol: "µL",
    englishName: "microliter",
    localizedName: "mikroliter",
    pluralEnglish: "microliters",
    pluralSwedish: "mikroliter",
    toBaseUnitFactor: factor("0.000001"),
    aliases: ["µl", "ul", "microlitre", "microlitres"],
  });

  static readonly Milliliter = new VolumeUnit({
    symbol: "mL",
    englishName: "milliliter",
    localizedName: "milliliter",
    pluralEnglish: "milliliters",
    pluralSwedish: "milliliter",
    toBaseUnitFactor: factor("0.001"),
    aliases: ["ml", "millilitre", "millilitres"],
  });

  static readonly Centiliter = new VolumeUnit({
    symbol: "cL",
    englishName: "centiliter",
    localizedName: "centiliter",
    pluralEnglish: "centiliters",
    pluralSwedish: "centiliter",
    toBaseUnitFactor: factor("0.01"),
    aliases: ["cl", "centilitre", "centilitres"],
  });

  static readonly Deciliter = new VolumeUnit({
    symbol: "dL",
    englishName: "deciliter",
    localizedName: "deciliter",
    pluralEnglish: "deciliters",
    pluralSwedish: "deciliter",
    toBaseUnitFactor: factor("0.1"),
    aliases: ["dl", "decilitre", "decilitres"],
  });

  static readonly Liter = new VolumeUnit({
    symbol: "L",
    englishName: "liter",
    localizedName: "liter",
    pluralEnglish: "liters",
    pluralSwedish: "liter",
    toBaseUnitFactor: factor("1"),
    aliases: ["litre", "litres"],
  });

  static readonly Hectoliter = new VolumeUnit({
    symbol: "hL",
    englishName: "hectoliter",
    localizedName: "hektoliter",
    pluralEnglish: "hectoliters",
    pluralSwedish: "hektoliter",
    toBaseUnitFactor: factor("100"),
    aliases: ["hl", "hectolitre", "hectolitres"],
  });

  static readonly CubicMeter = new VolumeUnit({
    symbol: "m³",
    englishName: "cubic meter",
    localizedName: "kubikmeter",
    pluralEnglish: "cubic meters",
    pluralSwedish: "kubikmeter",
    toBaseUnitFactor: factor("1000"),
    aliases: ["m3", "cbm", "kubikmeter", "cubic metre", "cubic metres"],
  });

  static readonly Gallon = new VolumeUnit({
    symbol: "gal",
    englishName: "gallon",
    localizedName: "gallon",
    pluralEnglish: "gallons",
    pluralSwedish: "gallon",
    toBaseUnitFactor: factor("3.785411784"),
    aliases: ["gallon", "gallons"],
  });

  static readonly Pint = new VolumeUnit({
    symbol: "pt",
    englishName: "pint",
    localizedName: "pint",
    pluralEnglish: "pints",
    pluralSwedish: "pint",
    toBaseUnitFactor: factor("0.473176473"),
  });

  static readonly FluidOunce = new VolumeUnit({
    symbol: "fl oz",
    englishName: "fluid ounce",
    localizedName: "vätskeans",
    pluralEnglish: "fluid ounces",
    pluralSwedish: "vätskeans",
    toBaseUnitFactor: factor("0.0295735296"),
    aliases: ["fluid ounce", "fluid ounces", "floz"],
  });

  static readonly Cup = new VolumeUnit({
    symbol: "cup",
    englishName: "cup",
    localizedName: "kopp",
    pluralEnglish: "cups",
    pluralSwedish: "koppar",
    toBaseUnitFactor: factor("0.2365882365"),
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<VolumeUnit>(
    [
      VolumeUnit.Microliter,
      VolumeUnit.Milliliter,
      VolumeUnit.Centiliter,
      VolumeUnit.Deciliter,
      VolumeUnit.Liter,
      VolumeUnit.Hectoliter,
      VolumeUnit.CubicMeter,
      VolumeUnit.Gallon,
      VolumeUnit.Pint,
      VolumeUnit.FluidOunce,
      VolumeUnit.Cup,
    ],
    VolumeUnit.Liter,
    [VolumeUnit.Milliliter, VolumeUnit.Deciliter, VolumeUnit.Liter, VolumeUnit.CubicMeter],
  );

  static get all(): readonly VolumeUnit[] {
    return VolumeUnit.index.all;
  }

  /** The base unit: L. */
  static get baseUnit(): VolumeUnit {
    return VolumeUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly VolumeUnit[] {
    return VolumeUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): VolumeUnit | null {
    return VolumeUnit.index.tryParse(input);
  }

  static parse(input: string): VolumeUnit {
    const result = VolumeUnit.tryParse(input);
    if (result === null) throw new Error("Unknown volume unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in L. */
  static getNatural(baseValue: Decimal): VolumeUnit {
    return VolumeUnit.index.getNatural(baseValue);
  }
}
