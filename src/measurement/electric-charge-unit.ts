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
 * A unit of electric charge identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class ElectricChargeUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Electric Charge Unit",
    localizedName: "Laddningsenhet",
    emoji: "🔋",
    sources: Object.freeze([]),
  });

  static readonly MilliampereHour = new ElectricChargeUnit({
    symbol: "mAh",
    englishName: "milliampere-hour",
    localizedName: "milliamperetimme",
    pluralEnglish: "milliampere-hours",
    pluralSwedish: "milliamperetimmar",
    toBaseUnitFactor: factor("0.001"),
    aliases: ["milliampere hour", "milliampere hours", "milliamperehour", "milliamperehours"],
  });

  static readonly AmpereHour = new ElectricChargeUnit({
    symbol: "Ah",
    englishName: "ampere-hour",
    localizedName: "amperetimme",
    pluralEnglish: "ampere-hours",
    pluralSwedish: "amperetimmar",
    toBaseUnitFactor: factor("1"),
    aliases: [
      "ampere hour",
      "ampere hours",
      "amperehour",
      "amperehours",
      "amp-hour",
      "amp-hours",
      "amp hour",
      "amp hours",
    ],
  });

  static readonly Coulomb = new ElectricChargeUnit({
    symbol: "C",
    englishName: "coulomb",
    localizedName: "coulomb",
    pluralEnglish: "coulombs",
    pluralSwedish: "coulomb",
    toBaseUnitFactor: factor("0.0002777777777777777777777778"),
    exactRatio: [factor("1"), factor("3600")],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<ElectricChargeUnit>(
    [ElectricChargeUnit.MilliampereHour, ElectricChargeUnit.AmpereHour, ElectricChargeUnit.Coulomb],
    ElectricChargeUnit.AmpereHour,
    [ElectricChargeUnit.MilliampereHour, ElectricChargeUnit.AmpereHour],
  );

  static get all(): readonly ElectricChargeUnit[] {
    return ElectricChargeUnit.index.all;
  }

  /** The base unit: Ah. */
  static get baseUnit(): ElectricChargeUnit {
    return ElectricChargeUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly ElectricChargeUnit[] {
    return ElectricChargeUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): ElectricChargeUnit | null {
    return ElectricChargeUnit.index.tryParse(input);
  }

  static parse(input: string): ElectricChargeUnit {
    const result = ElectricChargeUnit.tryParse(input);
    if (result === null) throw new Error("Unknown electric charge unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in Ah. */
  static getNatural(baseValue: Decimal): ElectricChargeUnit {
    return ElectricChargeUnit.index.getNatural(baseValue);
  }
}
