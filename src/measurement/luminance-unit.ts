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
 * A unit of luminance identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class LuminanceUnit extends MeasurementUnit {
  declare private readonly __luminanceUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Luminance Unit",
    localizedName: "Luminansenhet",
    emoji: "🔆",
    sources: Object.freeze([]),
  });

  static readonly CandelaPerSquareMetre = new LuminanceUnit({
    symbol: "cd/m²",
    englishName: "candela per square metre",
    localizedName: "candela per kvadratmeter",
    pluralEnglish: "candela per square metre",
    pluralSwedish: "candela per kvadratmeter",
    toBaseUnitFactor: factor("1"),
    aliases: ["cd/m2", "cd m-2", "cd*m-2", "cd/sqm", "cdm2", "cd/m²", "Cd/m²", "Cd/m2"],
  });

  static readonly Nit = new LuminanceUnit({
    symbol: "nit",
    englishName: "nit",
    localizedName: "nit",
    pluralEnglish: "nits",
    pluralSwedish: "nit",
    toBaseUnitFactor: factor("1"),
    aliases: ["Nit", "NITS", "nits"],
  });

  static readonly KilocandelaPerSquareMetre = new LuminanceUnit({
    symbol: "kcd/m²",
    englishName: "kilocandela per square metre",
    localizedName: "kilocandela per kvadratmeter",
    pluralEnglish: "kilocandela per square metre",
    pluralSwedish: "kilocandela per kvadratmeter",
    toBaseUnitFactor: factor("1000"),
    aliases: ["kcd/m2", "kcdm2", "Kcd/m²", "Kcd/m2"],
  });

  static readonly Kilonit = new LuminanceUnit({
    symbol: "knit",
    englishName: "kilonit",
    localizedName: "kilonit",
    pluralEnglish: "kilonits",
    pluralSwedish: "kilonit",
    toBaseUnitFactor: factor("1000"),
    aliases: ["Knit", "KNIT", "kilonits"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index: MeasurementUnitIndex<LuminanceUnit> =
    new MeasurementUnitIndex<LuminanceUnit>(
      [
        LuminanceUnit.CandelaPerSquareMetre,
        LuminanceUnit.Nit,
        LuminanceUnit.KilocandelaPerSquareMetre,
        LuminanceUnit.Kilonit,
      ],
      LuminanceUnit.CandelaPerSquareMetre,
      [LuminanceUnit.CandelaPerSquareMetre, LuminanceUnit.KilocandelaPerSquareMetre],
    );

  static get all(): readonly LuminanceUnit[] {
    return LuminanceUnit.index.all;
  }

  /** The base unit: cd/m². */
  static get baseUnit(): LuminanceUnit {
    return LuminanceUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly LuminanceUnit[] {
    return LuminanceUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): LuminanceUnit | null {
    return LuminanceUnit.index.tryParse(input);
  }

  static parse(input: string): LuminanceUnit {
    const result = LuminanceUnit.tryParse(input);
    if (result === null) throw new Error("Unknown luminance unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in cd/m². */
  static getNatural(baseValue: Decimal): LuminanceUnit {
    return LuminanceUnit.index.getNatural(baseValue);
  }
}
