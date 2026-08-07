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
 * A unit of torque identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class TorqueUnit extends MeasurementUnit {
  declare private readonly __torqueUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Torque Unit",
    localizedName: "Vridmomentsenhet",
    emoji: "🔧",
    sources: Object.freeze([]),
  });

  static readonly NewtonMeter = new TorqueUnit({
    symbol: "Nm",
    englishName: "newton meter",
    localizedName: "newtonmeter",
    pluralEnglish: "newton meters",
    pluralSwedish: "newtonmeter",
    toBaseUnitFactor: factor("1"),
    aliases: [
      "N·m",
      "newton-meter",
      "newton-meters",
      "newton metre",
      "newton metres",
      "newton-metre",
      "newton-metres",
    ],
  });

  static readonly MillinewtonMeter = new TorqueUnit({
    symbol: "mNm",
    englishName: "millinewton meter",
    localizedName: "millinewtonmeter",
    pluralEnglish: "millinewton meters",
    pluralSwedish: "millinewtonmeter",
    toBaseUnitFactor: factor("0.001"),
    aliases: ["mN·m", "millinewton-meter", "millinewton-meters"],
  });

  static readonly KilonewtonMeter = new TorqueUnit({
    symbol: "kNm",
    englishName: "kilonewton meter",
    localizedName: "kilonewtonmeter",
    pluralEnglish: "kilonewton meters",
    pluralSwedish: "kilonewtonmeter",
    toBaseUnitFactor: factor("1000"),
    aliases: ["kN·m", "kilonewton-meter", "kilonewton-meters"],
  });

  static readonly FootPound = new TorqueUnit({
    symbol: "ft-lb",
    englishName: "foot-pound",
    localizedName: "fotpund",
    pluralEnglish: "foot-pounds",
    pluralSwedish: "fotpund",
    toBaseUnitFactor: factor("1.3558179483314004"),
    aliases: ["ft·lb", "foot-pounds", "ft lb", "ft-lbs", "ft lbs", "ftlb", "ftlbs"],
  });

  static readonly KilogramForceMeter = new TorqueUnit({
    symbol: "kgf-m",
    englishName: "kilogram-force meter",
    localizedName: "kilogramkraftmeter",
    pluralEnglish: "kilogram-force meters",
    pluralSwedish: "kilogramkraftmeter",
    toBaseUnitFactor: factor("9.80665"),
    aliases: ["kgf·m", "kgfm"],
  });

  static readonly InchPound = new TorqueUnit({
    symbol: "in-lb",
    englishName: "inch-pound",
    localizedName: "tumpund",
    pluralEnglish: "inch-pounds",
    pluralSwedish: "tumpund",
    toBaseUnitFactor: factor("0.1129848290276167"),
    aliases: ["in·lb", "in lb", "in-lbs", "in lbs"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index: MeasurementUnitIndex<TorqueUnit> = new MeasurementUnitIndex<TorqueUnit>(
    [
      TorqueUnit.NewtonMeter,
      TorqueUnit.MillinewtonMeter,
      TorqueUnit.KilonewtonMeter,
      TorqueUnit.FootPound,
      TorqueUnit.KilogramForceMeter,
      TorqueUnit.InchPound,
    ],
    TorqueUnit.NewtonMeter,
    [],
  );

  static get all(): readonly TorqueUnit[] {
    return TorqueUnit.index.all;
  }

  /** The base unit: Nm. */
  static get baseUnit(): TorqueUnit {
    return TorqueUnit.index.baseUnit;
  }

  /** Empty — this dimension has no curated display scale in .NET either. */
  static get naturalScale(): readonly TorqueUnit[] {
    return TorqueUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): TorqueUnit | null {
    return TorqueUnit.index.tryParse(input);
  }

  static parse(input: string): TorqueUnit {
    const result = TorqueUnit.tryParse(input);
    if (result === null) throw new Error("Unknown torque unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in Nm. */
  static getNatural(baseValue: Decimal): TorqueUnit {
    return TorqueUnit.index.getNatural(baseValue);
  }
}
