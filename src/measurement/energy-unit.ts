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
 * A unit of energy identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class EnergyUnit extends MeasurementUnit {
  declare private readonly __energyUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Energy Unit",
    localizedName: "Energienhet",
    emoji: "⚡",
    sources: Object.freeze([]),
  });

  static readonly Joule = new EnergyUnit({
    symbol: "J",
    englishName: "joule",
    localizedName: "joule",
    pluralEnglish: "joules",
    pluralSwedish: "joule",
    toBaseUnitFactor: factor("1"),
  });

  static readonly Kilojoule = new EnergyUnit({
    symbol: "kJ",
    englishName: "kilojoule",
    localizedName: "kilojoule",
    pluralEnglish: "kilojoules",
    pluralSwedish: "kilojoule",
    toBaseUnitFactor: factor("1000"),
  });

  static readonly Megajoule = new EnergyUnit({
    symbol: "MJ",
    englishName: "megajoule",
    localizedName: "megajoule",
    pluralEnglish: "megajoules",
    pluralSwedish: "megajoule",
    toBaseUnitFactor: factor("1000000"),
  });

  static readonly Gigajoule = new EnergyUnit({
    symbol: "GJ",
    englishName: "gigajoule",
    localizedName: "gigajoule",
    pluralEnglish: "gigajoules",
    pluralSwedish: "gigajoule",
    toBaseUnitFactor: factor("1000000000"),
  });

  static readonly Terajoule = new EnergyUnit({
    symbol: "TJ",
    englishName: "terajoule",
    localizedName: "terajoule",
    pluralEnglish: "terajoules",
    pluralSwedish: "terajoule",
    toBaseUnitFactor: factor("1000000000000"),
  });

  static readonly WattHour = new EnergyUnit({
    symbol: "Wh",
    englishName: "watt-hour",
    localizedName: "wattimme",
    pluralEnglish: "watt-hours",
    pluralSwedish: "wattimmar",
    toBaseUnitFactor: factor("3600"),
    aliases: ["watthour", "watthours", "watt hour", "watt hours"],
  });

  static readonly KilowattHour = new EnergyUnit({
    symbol: "kWh",
    englishName: "kilowatt-hour",
    localizedName: "kilowattimme",
    pluralEnglish: "kilowatt-hours",
    pluralSwedish: "kilowattimmar",
    toBaseUnitFactor: factor("3600000"),
    aliases: ["kilowatthour", "kilowatthours", "kilowatt hour", "kilowatt hours"],
  });

  static readonly MegawattHour = new EnergyUnit({
    symbol: "MWh",
    englishName: "megawatt-hour",
    localizedName: "megawattimme",
    pluralEnglish: "megawatt-hours",
    pluralSwedish: "megawattimmar",
    toBaseUnitFactor: factor("3600000000"),
    aliases: ["megawatthour", "megawatthours", "megawatt hour", "megawatt hours"],
  });

  static readonly GigawattHour = new EnergyUnit({
    symbol: "GWh",
    englishName: "gigawatt-hour",
    localizedName: "gigawattimme",
    pluralEnglish: "gigawatt-hours",
    pluralSwedish: "gigawattimmar",
    toBaseUnitFactor: factor("3600000000000"),
    aliases: ["gigawatthour", "gigawatthours", "gigawatt hour", "gigawatt hours"],
  });

  static readonly TerawattHour = new EnergyUnit({
    symbol: "TWh",
    englishName: "terawatt-hour",
    localizedName: "terawattimme",
    pluralEnglish: "terawatt-hours",
    pluralSwedish: "terawattimmar",
    toBaseUnitFactor: factor("3600000000000000"),
    aliases: ["terawatthour", "terawatthours", "terawatt hour", "terawatt hours"],
  });

  static readonly Calorie = new EnergyUnit({
    symbol: "cal",
    englishName: "calorie",
    localizedName: "kalori",
    pluralEnglish: "calories",
    pluralSwedish: "kalorier",
    toBaseUnitFactor: factor("4.184"),
    aliases: ["calorie", "calories"],
  });

  static readonly Kilocalorie = new EnergyUnit({
    symbol: "kcal",
    englishName: "kilocalorie",
    localizedName: "kilokalori",
    pluralEnglish: "kilocalories",
    pluralSwedish: "kilokalorier",
    toBaseUnitFactor: factor("4184"),
    aliases: ["kilocalorie", "kilocalories"],
  });

  static readonly Btu = new EnergyUnit({
    symbol: "BTU",
    englishName: "British thermal unit",
    localizedName: "BTU",
    pluralEnglish: "British thermal units",
    pluralSwedish: "BTU",
    toBaseUnitFactor: factor("1055.05585262"),
    aliases: ["btu", "Btu"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index: MeasurementUnitIndex<EnergyUnit> = new MeasurementUnitIndex<EnergyUnit>(
    [
      EnergyUnit.Joule,
      EnergyUnit.Kilojoule,
      EnergyUnit.Megajoule,
      EnergyUnit.Gigajoule,
      EnergyUnit.Terajoule,
      EnergyUnit.WattHour,
      EnergyUnit.KilowattHour,
      EnergyUnit.MegawattHour,
      EnergyUnit.GigawattHour,
      EnergyUnit.TerawattHour,
      EnergyUnit.Calorie,
      EnergyUnit.Kilocalorie,
      EnergyUnit.Btu,
    ],
    EnergyUnit.Joule,
    [
      EnergyUnit.WattHour,
      EnergyUnit.KilowattHour,
      EnergyUnit.MegawattHour,
      EnergyUnit.GigawattHour,
      EnergyUnit.TerawattHour,
    ],
  );

  static get all(): readonly EnergyUnit[] {
    return EnergyUnit.index.all;
  }

  /** The base unit: J. */
  static get baseUnit(): EnergyUnit {
    return EnergyUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly EnergyUnit[] {
    return EnergyUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): EnergyUnit | null {
    return EnergyUnit.index.tryParse(input);
  }

  static parse(input: string): EnergyUnit {
    const result = EnergyUnit.tryParse(input);
    if (result === null) throw new Error("Unknown energy unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in J. */
  static getNatural(baseValue: Decimal): EnergyUnit {
    return EnergyUnit.index.getNatural(baseValue);
  }
}
