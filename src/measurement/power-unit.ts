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
 * A unit of power identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class PowerUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Power Unit",
    localizedName: "Effektenhet",
    emoji: "💡",
    sources: Object.freeze([]),
  });

  static readonly Microwatt = new PowerUnit({
    symbol: "µW",
    englishName: "microwatt",
    localizedName: "mikrowatt",
    pluralEnglish: "microwatts",
    pluralSwedish: "mikrowatt",
    toBaseUnitFactor: factor("0.000001"),
    aliases: ["uW"],
  });

  static readonly Milliwatt = new PowerUnit({
    symbol: "mW",
    englishName: "milliwatt",
    localizedName: "milliwatt",
    pluralEnglish: "milliwatts",
    pluralSwedish: "milliwatt",
    toBaseUnitFactor: factor("0.001"),
  });

  static readonly Watt = new PowerUnit({
    symbol: "W",
    englishName: "watt",
    localizedName: "watt",
    pluralEnglish: "watts",
    pluralSwedish: "watt",
    toBaseUnitFactor: factor("1"),
  });

  static readonly Kilowatt = new PowerUnit({
    symbol: "kW",
    englishName: "kilowatt",
    localizedName: "kilowatt",
    pluralEnglish: "kilowatts",
    pluralSwedish: "kilowatt",
    toBaseUnitFactor: factor("1000"),
  });

  static readonly Megawatt = new PowerUnit({
    symbol: "MW",
    englishName: "megawatt",
    localizedName: "megawatt",
    pluralEnglish: "megawatts",
    pluralSwedish: "megawatt",
    toBaseUnitFactor: factor("1000000"),
  });

  static readonly Gigawatt = new PowerUnit({
    symbol: "GW",
    englishName: "gigawatt",
    localizedName: "gigawatt",
    pluralEnglish: "gigawatts",
    pluralSwedish: "gigawatt",
    toBaseUnitFactor: factor("1000000000"),
  });

  static readonly Terawatt = new PowerUnit({
    symbol: "TW",
    englishName: "terawatt",
    localizedName: "terawatt",
    pluralEnglish: "terawatts",
    pluralSwedish: "terawatt",
    toBaseUnitFactor: factor("1000000000000"),
  });

  static readonly Horsepower = new PowerUnit({
    symbol: "HP",
    englishName: "horsepower",
    localizedName: "hästkraft",
    pluralEnglish: "horsepower",
    pluralSwedish: "hästkrafter",
    toBaseUnitFactor: factor("745.69987158227022"),
    aliases: ["hp", "horsepower", "hk", "hästkraft", "hästkrafter"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<PowerUnit>(
    [
      PowerUnit.Microwatt,
      PowerUnit.Milliwatt,
      PowerUnit.Watt,
      PowerUnit.Kilowatt,
      PowerUnit.Megawatt,
      PowerUnit.Gigawatt,
      PowerUnit.Terawatt,
      PowerUnit.Horsepower,
    ],
    PowerUnit.Watt,
    [PowerUnit.Watt, PowerUnit.Kilowatt, PowerUnit.Megawatt, PowerUnit.Gigawatt],
    [PowerUnit.Milliwatt, PowerUnit.Megawatt],
  );

  static get all(): readonly PowerUnit[] {
    return PowerUnit.index.all;
  }

  /** The base unit: W. */
  static get baseUnit(): PowerUnit {
    return PowerUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly PowerUnit[] {
    return PowerUnit.index.naturalScale;
  }

  /**
   * Resolves a unit from a symbol, name, plural or alias, case-insensitively —
   * except for `mW` and `MW`, which differ by a factor of a billion and are
   * therefore the one case-sensitive pair.
   */
  static tryParse(input: string | null | undefined): PowerUnit | null {
    if (input == null) return null;
    const trimmed = input.trim();

    if (trimmed.length === 2 && (trimmed[1] === "W" || trimmed[1] === "w")) {
      if (trimmed[0] === "m") return PowerUnit.Milliwatt;
      if (trimmed[0] === "M") return PowerUnit.Megawatt;
    }

    return PowerUnit.index.tryParse(trimmed);
  }

  static parse(input: string): PowerUnit {
    const result = PowerUnit.tryParse(input);
    if (result === null) throw new Error("Unknown power unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in W. */
  static getNatural(baseValue: Decimal): PowerUnit {
    return PowerUnit.index.getNatural(baseValue);
  }
}
