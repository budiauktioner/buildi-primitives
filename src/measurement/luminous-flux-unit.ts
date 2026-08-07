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
 * A unit of luminous flux identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class LuminousFluxUnit extends MeasurementUnit {
  declare private readonly __luminousFluxUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Luminous Flux Unit",
    localizedName: "Ljusflödesenhet",
    emoji: "💡",
    sources: Object.freeze([]),
  });

  static readonly Lumen = new LuminousFluxUnit({
    symbol: "lm",
    englishName: "lumen",
    localizedName: "lumen",
    pluralEnglish: "lumens",
    pluralSwedish: "lumen",
    toBaseUnitFactor: factor("1"),
  });

  static readonly Kilolumen = new LuminousFluxUnit({
    symbol: "klm",
    englishName: "kilolumen",
    localizedName: "kilolumen",
    pluralEnglish: "kilolumens",
    pluralSwedish: "kilolumen",
    toBaseUnitFactor: factor("1000"),
    aliases: ["Klm", "kLm"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index: MeasurementUnitIndex<LuminousFluxUnit> =
    new MeasurementUnitIndex<LuminousFluxUnit>(
      [LuminousFluxUnit.Lumen, LuminousFluxUnit.Kilolumen],
      LuminousFluxUnit.Lumen,
      [LuminousFluxUnit.Lumen, LuminousFluxUnit.Kilolumen],
    );

  static get all(): readonly LuminousFluxUnit[] {
    return LuminousFluxUnit.index.all;
  }

  /** The base unit: lm. */
  static get baseUnit(): LuminousFluxUnit {
    return LuminousFluxUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly LuminousFluxUnit[] {
    return LuminousFluxUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): LuminousFluxUnit | null {
    return LuminousFluxUnit.index.tryParse(input);
  }

  static parse(input: string): LuminousFluxUnit {
    const result = LuminousFluxUnit.tryParse(input);
    if (result === null) throw new Error("Unknown luminous flux unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in lm. */
  static getNatural(baseValue: Decimal): LuminousFluxUnit {
    return LuminousFluxUnit.index.getNatural(baseValue);
  }
}
