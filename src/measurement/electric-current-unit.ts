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
 * A unit of electric current identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class ElectricCurrentUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Electric Current Unit",
    localizedName: "Strömenhet",
    emoji: "⚡",
    sources: Object.freeze([]),
  });

  static readonly Microampere = new ElectricCurrentUnit({
    symbol: "µA",
    englishName: "microampere",
    localizedName: "mikroampere",
    pluralEnglish: "microamperes",
    pluralSwedish: "mikroampere",
    toBaseUnitFactor: factor("0.000001"),
    aliases: ["uA"],
  });

  static readonly Milliampere = new ElectricCurrentUnit({
    symbol: "mA",
    englishName: "milliampere",
    localizedName: "milliampere",
    pluralEnglish: "milliamperes",
    pluralSwedish: "milliampere",
    toBaseUnitFactor: factor("0.001"),
  });

  static readonly Ampere = new ElectricCurrentUnit({
    symbol: "A",
    englishName: "ampere",
    localizedName: "ampere",
    pluralEnglish: "amperes",
    pluralSwedish: "ampere",
    toBaseUnitFactor: factor("1"),
    aliases: ["amp", "amps"],
  });

  static readonly Kiloampere = new ElectricCurrentUnit({
    symbol: "kA",
    englishName: "kiloampere",
    localizedName: "kiloampere",
    pluralEnglish: "kiloamperes",
    pluralSwedish: "kiloampere",
    toBaseUnitFactor: factor("1000"),
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<ElectricCurrentUnit>(
    [
      ElectricCurrentUnit.Microampere,
      ElectricCurrentUnit.Milliampere,
      ElectricCurrentUnit.Ampere,
      ElectricCurrentUnit.Kiloampere,
    ],
    ElectricCurrentUnit.Ampere,
    [ElectricCurrentUnit.Milliampere, ElectricCurrentUnit.Ampere, ElectricCurrentUnit.Kiloampere],
  );

  static get all(): readonly ElectricCurrentUnit[] {
    return ElectricCurrentUnit.index.all;
  }

  /** The base unit: A. */
  static get baseUnit(): ElectricCurrentUnit {
    return ElectricCurrentUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly ElectricCurrentUnit[] {
    return ElectricCurrentUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): ElectricCurrentUnit | null {
    return ElectricCurrentUnit.index.tryParse(input);
  }

  static parse(input: string): ElectricCurrentUnit {
    const result = ElectricCurrentUnit.tryParse(input);
    if (result === null) throw new Error("Unknown electric current unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in A. */
  static getNatural(baseValue: Decimal): ElectricCurrentUnit {
    return ElectricCurrentUnit.index.getNatural(baseValue);
  }
}
