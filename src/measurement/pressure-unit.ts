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
 * A unit of pressure identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class PressureUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Pressure Unit",
    localizedName: "Tryckenhet",
    emoji: "🎯",
    sources: Object.freeze([]),
  });

  static readonly Pascal = new PressureUnit({
    symbol: "Pa",
    englishName: "pascal",
    localizedName: "pascal",
    pluralEnglish: "pascals",
    pluralSwedish: "pascal",
    toBaseUnitFactor: factor("1"),
  });

  static readonly Hectopascal = new PressureUnit({
    symbol: "hPa",
    englishName: "hectopascal",
    localizedName: "hektopascal",
    pluralEnglish: "hectopascals",
    pluralSwedish: "hektopascal",
    toBaseUnitFactor: factor("100"),
  });

  static readonly Kilopascal = new PressureUnit({
    symbol: "kPa",
    englishName: "kilopascal",
    localizedName: "kilopascal",
    pluralEnglish: "kilopascals",
    pluralSwedish: "kilopascal",
    toBaseUnitFactor: factor("1000"),
  });

  static readonly Megapascal = new PressureUnit({
    symbol: "MPa",
    englishName: "megapascal",
    localizedName: "megapascal",
    pluralEnglish: "megapascals",
    pluralSwedish: "megapascal",
    toBaseUnitFactor: factor("1000000"),
  });

  static readonly Gigapascal = new PressureUnit({
    symbol: "GPa",
    englishName: "gigapascal",
    localizedName: "gigapascal",
    pluralEnglish: "gigapascals",
    pluralSwedish: "gigapascal",
    toBaseUnitFactor: factor("1000000000"),
  });

  static readonly Bar = new PressureUnit({
    symbol: "bar",
    englishName: "bar",
    localizedName: "bar",
    pluralEnglish: "bars",
    pluralSwedish: "bar",
    toBaseUnitFactor: factor("100000"),
  });

  static readonly Millibar = new PressureUnit({
    symbol: "mbar",
    englishName: "millibar",
    localizedName: "millibar",
    pluralEnglish: "millibars",
    pluralSwedish: "millibar",
    toBaseUnitFactor: factor("100"),
  });

  static readonly Psi = new PressureUnit({
    symbol: "PSI",
    englishName: "psi",
    localizedName: "psi",
    pluralEnglish: "psi",
    pluralSwedish: "psi",
    toBaseUnitFactor: factor("6894.757293168"),
    aliases: ["psi", "lb/in²", "pounds per square inch"],
  });

  static readonly Atmosphere = new PressureUnit({
    symbol: "atm",
    englishName: "atmosphere",
    localizedName: "atmosfär",
    pluralEnglish: "atmospheres",
    pluralSwedish: "atmosfärer",
    toBaseUnitFactor: factor("101325"),
  });

  static readonly MillimeterOfMercury = new PressureUnit({
    symbol: "mmHg",
    englishName: "millimeter of mercury",
    localizedName: "millimeter kvicksilver",
    pluralEnglish: "millimeters of mercury",
    pluralSwedish: "millimeter kvicksilver",
    toBaseUnitFactor: factor("133.322387415"),
    aliases: ["mm Hg", "torr", "millimetre of mercury", "millimetres of mercury"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<PressureUnit>(
    [
      PressureUnit.Pascal,
      PressureUnit.Hectopascal,
      PressureUnit.Kilopascal,
      PressureUnit.Megapascal,
      PressureUnit.Gigapascal,
      PressureUnit.Bar,
      PressureUnit.Millibar,
      PressureUnit.Psi,
      PressureUnit.Atmosphere,
      PressureUnit.MillimeterOfMercury,
    ],
    PressureUnit.Pascal,
    [
      PressureUnit.Pascal,
      PressureUnit.Hectopascal,
      PressureUnit.Kilopascal,
      PressureUnit.Bar,
      PressureUnit.Megapascal,
    ],
  );

  static get all(): readonly PressureUnit[] {
    return PressureUnit.index.all;
  }

  /** The base unit: Pa. */
  static get baseUnit(): PressureUnit {
    return PressureUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly PressureUnit[] {
    return PressureUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): PressureUnit | null {
    return PressureUnit.index.tryParse(input);
  }

  static parse(input: string): PressureUnit {
    const result = PressureUnit.tryParse(input);
    if (result === null) throw new Error("Unknown pressure unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in Pa. */
  static getNatural(baseValue: Decimal): PressureUnit {
    return PressureUnit.index.getNatural(baseValue);
  }
}
