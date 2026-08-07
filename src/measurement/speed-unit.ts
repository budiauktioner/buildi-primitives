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
 * A unit of speed identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class SpeedUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Speed Unit",
    localizedName: "Hastighetsenhet",
    emoji: "🏎️",
    sources: Object.freeze([]),
  });

  static readonly MetersPerSecond = new SpeedUnit({
    symbol: "m/s",
    englishName: "meter per second",
    localizedName: "meter per sekund",
    pluralEnglish: "meters per second",
    pluralSwedish: "meter per sekund",
    toBaseUnitFactor: factor("1"),
  });

  static readonly KilometersPerHour = new SpeedUnit({
    symbol: "km/h",
    englishName: "kilometer per hour",
    localizedName: "kilometer per timme",
    pluralEnglish: "kilometers per hour",
    pluralSwedish: "kilometer per timme",
    toBaseUnitFactor: factor("0.2777777777777777777777777778"),
    exactRatio: [factor("1000"), factor("3600")],
    aliases: ["kmh", "km/t", "kph", "kilometre per hour", "kilometres per hour"],
  });

  static readonly MilesPerHour = new SpeedUnit({
    symbol: "mph",
    englishName: "mile per hour",
    localizedName: "miles per timme",
    pluralEnglish: "miles per hour",
    pluralSwedish: "miles per timme",
    toBaseUnitFactor: factor("0.44704"),
    aliases: ["miles per hour"],
  });

  static readonly FeetPerSecond = new SpeedUnit({
    symbol: "ft/s",
    englishName: "foot per second",
    localizedName: "fot per sekund",
    pluralEnglish: "feet per second",
    pluralSwedish: "fot per sekund",
    toBaseUnitFactor: factor("0.3048"),
  });

  static readonly Knot = new SpeedUnit({
    symbol: "kn",
    englishName: "knot",
    localizedName: "knop",
    pluralEnglish: "knots",
    pluralSwedish: "knop",
    toBaseUnitFactor: factor("0.5144444444444444444444444444"),
    aliases: ["knot", "knots", "knop", "kt"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<SpeedUnit>(
    [
      SpeedUnit.MetersPerSecond,
      SpeedUnit.KilometersPerHour,
      SpeedUnit.MilesPerHour,
      SpeedUnit.FeetPerSecond,
      SpeedUnit.Knot,
    ],
    SpeedUnit.MetersPerSecond,
    [],
  );

  static get all(): readonly SpeedUnit[] {
    return SpeedUnit.index.all;
  }

  /** The base unit: m/s. */
  static get baseUnit(): SpeedUnit {
    return SpeedUnit.index.baseUnit;
  }

  /** Empty — this dimension has no curated display scale in .NET either. */
  static get naturalScale(): readonly SpeedUnit[] {
    return SpeedUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): SpeedUnit | null {
    return SpeedUnit.index.tryParse(input);
  }

  static parse(input: string): SpeedUnit {
    const result = SpeedUnit.tryParse(input);
    if (result === null) throw new Error("Unknown speed unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in m/s. */
  static getNatural(baseValue: Decimal): SpeedUnit {
    return SpeedUnit.index.getNatural(baseValue);
  }
}
