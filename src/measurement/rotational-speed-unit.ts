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
 * A unit of rotational speed identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class RotationalSpeedUnit extends MeasurementUnit {
  declare private readonly __rotationalSpeedUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Rotational Speed Unit",
    localizedName: "Varvtalsenhet",
    emoji: "🔄",
    sources: Object.freeze([]),
  });

  static readonly Rpm = new RotationalSpeedUnit({
    symbol: "rpm",
    englishName: "revolution per minute",
    localizedName: "varv per minut",
    pluralEnglish: "revolutions per minute",
    pluralSwedish: "varv per minut",
    toBaseUnitFactor: factor("1"),
    aliases: ["RPM", "r/min", "rev/min", "varv/min", "v/min", "vpm"],
  });

  static readonly Rps = new RotationalSpeedUnit({
    symbol: "rps",
    englishName: "revolution per second",
    localizedName: "varv per sekund",
    pluralEnglish: "revolutions per second",
    pluralSwedish: "varv per sekund",
    toBaseUnitFactor: factor("60"),
    aliases: ["RPS", "r/s", "rev/s", "varv/s"],
  });

  static readonly RadiansPerSecond = new RotationalSpeedUnit({
    symbol: "rad/s",
    englishName: "radian per second",
    localizedName: "radian per sekund",
    pluralEnglish: "radians per second",
    pluralSwedish: "radianer per sekund",
    toBaseUnitFactor: factor("9.5492965855137"),
    aliases: ["rad/sec"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index: MeasurementUnitIndex<RotationalSpeedUnit> =
    new MeasurementUnitIndex<RotationalSpeedUnit>(
      [RotationalSpeedUnit.Rpm, RotationalSpeedUnit.Rps, RotationalSpeedUnit.RadiansPerSecond],
      RotationalSpeedUnit.Rpm,
      [],
    );

  static get all(): readonly RotationalSpeedUnit[] {
    return RotationalSpeedUnit.index.all;
  }

  /** The base unit: rpm. */
  static get baseUnit(): RotationalSpeedUnit {
    return RotationalSpeedUnit.index.baseUnit;
  }

  /** Empty — this dimension has no curated display scale in .NET either. */
  static get naturalScale(): readonly RotationalSpeedUnit[] {
    return RotationalSpeedUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): RotationalSpeedUnit | null {
    return RotationalSpeedUnit.index.tryParse(input);
  }

  static parse(input: string): RotationalSpeedUnit {
    const result = RotationalSpeedUnit.tryParse(input);
    if (result === null) throw new Error("Unknown rotational speed unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in rpm. */
  static getNatural(baseValue: Decimal): RotationalSpeedUnit {
    return RotationalSpeedUnit.index.getNatural(baseValue);
  }
}
