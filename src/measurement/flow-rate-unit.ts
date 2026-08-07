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
 * A unit of flow rate identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class FlowRateUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Flow Rate Unit",
    localizedName: "Flödesenhet",
    emoji: "🌊",
    sources: Object.freeze([]),
  });

  static readonly LitersPerSecond = new FlowRateUnit({
    symbol: "L/s",
    englishName: "liter per second",
    localizedName: "liter per sekund",
    pluralEnglish: "liters per second",
    pluralSwedish: "liter per sekund",
    toBaseUnitFactor: factor("60"),
    aliases: ["l/s"],
  });

  static readonly LitersPerMinute = new FlowRateUnit({
    symbol: "L/min",
    englishName: "liter per minute",
    localizedName: "liter per minut",
    pluralEnglish: "liters per minute",
    pluralSwedish: "liter per minut",
    toBaseUnitFactor: factor("1"),
    aliases: ["l/min"],
  });

  static readonly LitersPerHour = new FlowRateUnit({
    symbol: "L/h",
    englishName: "liter per hour",
    localizedName: "liter per timme",
    pluralEnglish: "liters per hour",
    pluralSwedish: "liter per timme",
    toBaseUnitFactor: factor("0.0166666666666666666666666667"),
    exactRatio: [factor("1"), factor("60")],
    aliases: ["l/h", "l/timme", "liter/timme", "liter/h"],
  });

  static readonly CubicMetersPerHour = new FlowRateUnit({
    symbol: "m³/h",
    englishName: "cubic meter per hour",
    localizedName: "kubikmeter per timme",
    pluralEnglish: "cubic meters per hour",
    pluralSwedish: "kubikmeter per timme",
    toBaseUnitFactor: factor("16.666666666666666666666666667"),
    exactRatio: [factor("1000"), factor("60")],
    aliases: ["m3/h", "m³/tim", "m3/tim", "cbm/h"],
  });

  static readonly CubicMetersPerMinute = new FlowRateUnit({
    symbol: "m³/min",
    englishName: "cubic meter per minute",
    localizedName: "kubikmeter per minut",
    pluralEnglish: "cubic meters per minute",
    pluralSwedish: "kubikmeter per minut",
    toBaseUnitFactor: factor("1000"),
    aliases: ["m3/min"],
  });

  static readonly GallonsPerMinute = new FlowRateUnit({
    symbol: "gal/min",
    englishName: "gallon per minute",
    localizedName: "gallon per minut",
    pluralEnglish: "gallons per minute",
    pluralSwedish: "gallon per minut",
    toBaseUnitFactor: factor("3.785411784"),
    aliases: ["gpm", "GPM"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<FlowRateUnit>(
    [
      FlowRateUnit.LitersPerSecond,
      FlowRateUnit.LitersPerMinute,
      FlowRateUnit.LitersPerHour,
      FlowRateUnit.CubicMetersPerHour,
      FlowRateUnit.CubicMetersPerMinute,
      FlowRateUnit.GallonsPerMinute,
    ],
    FlowRateUnit.LitersPerMinute,
    [FlowRateUnit.LitersPerHour, FlowRateUnit.LitersPerMinute, FlowRateUnit.CubicMetersPerHour],
  );

  static get all(): readonly FlowRateUnit[] {
    return FlowRateUnit.index.all;
  }

  /** The base unit: L/min. */
  static get baseUnit(): FlowRateUnit {
    return FlowRateUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly FlowRateUnit[] {
    return FlowRateUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): FlowRateUnit | null {
    return FlowRateUnit.index.tryParse(input);
  }

  static parse(input: string): FlowRateUnit {
    const result = FlowRateUnit.tryParse(input);
    if (result === null) throw new Error("Unknown flow rate unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in L/min. */
  static getNatural(baseValue: Decimal): FlowRateUnit {
    return FlowRateUnit.index.getNatural(baseValue);
  }
}
