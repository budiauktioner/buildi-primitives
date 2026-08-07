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
 * A unit of voltage identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class VoltageUnit extends MeasurementUnit {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Voltage Unit",
    localizedName: "Spänningsenhet",
    emoji: "🔌",
    sources: Object.freeze([]),
  });

  static readonly Microvolt = new VoltageUnit({
    symbol: "µV",
    englishName: "microvolt",
    localizedName: "mikrovolt",
    pluralEnglish: "microvolts",
    pluralSwedish: "mikrovolt",
    toBaseUnitFactor: factor("0.000001"),
    aliases: ["uV"],
  });

  static readonly Millivolt = new VoltageUnit({
    symbol: "mV",
    englishName: "millivolt",
    localizedName: "millivolt",
    pluralEnglish: "millivolts",
    pluralSwedish: "millivolt",
    toBaseUnitFactor: factor("0.001"),
  });

  static readonly Volt = new VoltageUnit({
    symbol: "V",
    englishName: "volt",
    localizedName: "volt",
    pluralEnglish: "volts",
    pluralSwedish: "volt",
    toBaseUnitFactor: factor("1"),
  });

  static readonly Kilovolt = new VoltageUnit({
    symbol: "kV",
    englishName: "kilovolt",
    localizedName: "kilovolt",
    pluralEnglish: "kilovolts",
    pluralSwedish: "kilovolt",
    toBaseUnitFactor: factor("1000"),
  });

  static readonly Megavolt = new VoltageUnit({
    symbol: "MV",
    englishName: "megavolt",
    localizedName: "megavolt",
    pluralEnglish: "megavolts",
    pluralSwedish: "megavolt",
    toBaseUnitFactor: factor("1000000"),
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index = new MeasurementUnitIndex<VoltageUnit>(
    [
      VoltageUnit.Microvolt,
      VoltageUnit.Millivolt,
      VoltageUnit.Volt,
      VoltageUnit.Kilovolt,
      VoltageUnit.Megavolt,
    ],
    VoltageUnit.Volt,
    [VoltageUnit.Millivolt, VoltageUnit.Volt, VoltageUnit.Kilovolt],
    [VoltageUnit.Millivolt, VoltageUnit.Megavolt],
  );

  static get all(): readonly VoltageUnit[] {
    return VoltageUnit.index.all;
  }

  /** The base unit: V. */
  static get baseUnit(): VoltageUnit {
    return VoltageUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly VoltageUnit[] {
    return VoltageUnit.index.naturalScale;
  }

  /**
   * Resolves a unit from a symbol, name, plural or alias, case-insensitively —
   * except for `mV` and `MV`, which differ by a factor of a billion and are
   * therefore the one case-sensitive pair.
   */
  static tryParse(input: string | null | undefined): VoltageUnit | null {
    if (input == null) return null;
    const trimmed = input.trim();

    if (trimmed.length === 2 && (trimmed[1] === "V" || trimmed[1] === "v")) {
      if (trimmed[0] === "m") return VoltageUnit.Millivolt;
      if (trimmed[0] === "M") return VoltageUnit.Megavolt;
    }

    return VoltageUnit.index.tryParse(trimmed);
  }

  static parse(input: string): VoltageUnit {
    const result = VoltageUnit.tryParse(input);
    if (result === null) throw new Error("Unknown voltage unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in V. */
  static getNatural(baseValue: Decimal): VoltageUnit {
    return VoltageUnit.index.getNatural(baseValue);
  }
}
