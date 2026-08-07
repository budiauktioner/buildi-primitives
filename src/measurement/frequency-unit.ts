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
 * A unit of frequency identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class FrequencyUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Frequency Unit",
    localizedName: "Frekvensenhet",
    emoji: "📡",
    sources: Object.freeze([]),
  });

  static readonly Hertz = new FrequencyUnit({
    symbol: "Hz",
    englishName: "hertz",
    localizedName: "hertz",
    pluralEnglish: "hertz",
    pluralSwedish: "hertz",
    toBaseUnitFactor: factor("1"),
  });

  static readonly Kilohertz = new FrequencyUnit({
    symbol: "kHz",
    englishName: "kilohertz",
    localizedName: "kilohertz",
    pluralEnglish: "kilohertz",
    pluralSwedish: "kilohertz",
    toBaseUnitFactor: factor("1000"),
  });

  static readonly Megahertz = new FrequencyUnit({
    symbol: "MHz",
    englishName: "megahertz",
    localizedName: "megahertz",
    pluralEnglish: "megahertz",
    pluralSwedish: "megahertz",
    toBaseUnitFactor: factor("1000000"),
  });

  static readonly Gigahertz = new FrequencyUnit({
    symbol: "GHz",
    englishName: "gigahertz",
    localizedName: "gigahertz",
    pluralEnglish: "gigahertz",
    pluralSwedish: "gigahertz",
    toBaseUnitFactor: factor("1000000000"),
  });

  static readonly Terahertz = new FrequencyUnit({
    symbol: "THz",
    englishName: "terahertz",
    localizedName: "terahertz",
    pluralEnglish: "terahertz",
    pluralSwedish: "terahertz",
    toBaseUnitFactor: factor("1000000000000"),
  });

  static readonly RevolutionsPerMinute = new FrequencyUnit({
    symbol: "rpm",
    englishName: "revolution per minute",
    localizedName: "varv per minut",
    pluralEnglish: "revolutions per minute",
    pluralSwedish: "varv per minut",
    toBaseUnitFactor: factor("0.0166666666666666666666666667"),
    exactRatio: [factor("1"), factor("60")],
    aliases: ["RPM", "rev/min", "varv/min", "r/min"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<FrequencyUnit>(
    [
      FrequencyUnit.Hertz,
      FrequencyUnit.Kilohertz,
      FrequencyUnit.Megahertz,
      FrequencyUnit.Gigahertz,
      FrequencyUnit.Terahertz,
      FrequencyUnit.RevolutionsPerMinute,
    ],
    FrequencyUnit.Hertz,
    [
      FrequencyUnit.Hertz,
      FrequencyUnit.Kilohertz,
      FrequencyUnit.Megahertz,
      FrequencyUnit.Gigahertz,
      FrequencyUnit.Terahertz,
    ],
  );

  static get all(): readonly FrequencyUnit[] {
    return FrequencyUnit.index.all;
  }

  /** The base unit: Hz. */
  static get baseUnit(): FrequencyUnit {
    return FrequencyUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly FrequencyUnit[] {
    return FrequencyUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): FrequencyUnit | null {
    return FrequencyUnit.index.tryParse(input);
  }

  static parse(input: string): FrequencyUnit {
    const result = FrequencyUnit.tryParse(input);
    if (result === null) throw new Error("Unknown frequency unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in Hz. */
  static getNatural(baseValue: Decimal): FrequencyUnit {
    return FrequencyUnit.index.getNatural(baseValue);
  }
}
