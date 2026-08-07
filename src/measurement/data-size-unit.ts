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
 * A unit of data size identified by its symbol.
 * Each unit carries English and Swedish names, singular and plural forms, and an
 * exact conversion factor to the base unit.
 */
export class DataSizeUnit extends MeasurementUnit {
  declare private readonly __dataSizeUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Data Size Unit",
    localizedName: "Datastorleksenhet",
    emoji: "💾",
    sources: Object.freeze([]),
  });

  static readonly Byte = new DataSizeUnit({
    symbol: "B",
    englishName: "byte",
    localizedName: "byte",
    pluralEnglish: "bytes",
    pluralSwedish: "byte",
    toBaseUnitFactor: factor("1"),
    aliases: ["byte", "bytes"],
  });

  static readonly Kilobyte = new DataSizeUnit({
    symbol: "KB",
    englishName: "kilobyte",
    localizedName: "kilobyte",
    pluralEnglish: "kilobytes",
    pluralSwedish: "kilobyte",
    toBaseUnitFactor: factor("1000"),
    aliases: ["kilobyte", "kilobytes"],
  });

  static readonly Megabyte = new DataSizeUnit({
    symbol: "MB",
    englishName: "megabyte",
    localizedName: "megabyte",
    pluralEnglish: "megabytes",
    pluralSwedish: "megabyte",
    toBaseUnitFactor: factor("1000000"),
    aliases: ["megabyte", "megabytes"],
  });

  static readonly Gigabyte = new DataSizeUnit({
    symbol: "GB",
    englishName: "gigabyte",
    localizedName: "gigabyte",
    pluralEnglish: "gigabytes",
    pluralSwedish: "gigabyte",
    toBaseUnitFactor: factor("1000000000"),
    aliases: ["gigabyte", "gigabytes"],
  });

  static readonly Terabyte = new DataSizeUnit({
    symbol: "TB",
    englishName: "terabyte",
    localizedName: "terabyte",
    pluralEnglish: "terabytes",
    pluralSwedish: "terabyte",
    toBaseUnitFactor: factor("1000000000000"),
    aliases: ["terabyte", "terabytes"],
  });

  static readonly Petabyte = new DataSizeUnit({
    symbol: "PB",
    englishName: "petabyte",
    localizedName: "petabyte",
    pluralEnglish: "petabytes",
    pluralSwedish: "petabyte",
    toBaseUnitFactor: factor("1000000000000000"),
    aliases: ["petabyte", "petabytes"],
  });

  static readonly Exabyte = new DataSizeUnit({
    symbol: "EB",
    englishName: "exabyte",
    localizedName: "exabyte",
    pluralEnglish: "exabytes",
    pluralSwedish: "exabyte",
    toBaseUnitFactor: factor("1000000000000000000"),
    aliases: ["exabyte", "exabytes"],
  });

  static readonly Kibibyte = new DataSizeUnit({
    symbol: "KiB",
    englishName: "kibibyte",
    localizedName: "kibibyte",
    pluralEnglish: "kibibytes",
    pluralSwedish: "kibibyte",
    toBaseUnitFactor: factor("1024"),
    aliases: ["kibibyte", "kibibytes"],
  });

  static readonly Mebibyte = new DataSizeUnit({
    symbol: "MiB",
    englishName: "mebibyte",
    localizedName: "mebibyte",
    pluralEnglish: "mebibytes",
    pluralSwedish: "mebibyte",
    toBaseUnitFactor: factor("1048576"),
    aliases: ["mebibyte", "mebibytes"],
  });

  static readonly Gibibyte = new DataSizeUnit({
    symbol: "GiB",
    englishName: "gibibyte",
    localizedName: "gibibyte",
    pluralEnglish: "gibibytes",
    pluralSwedish: "gibibyte",
    toBaseUnitFactor: factor("1073741824"),
    aliases: ["gibibyte", "gibibytes"],
  });

  static readonly Tebibyte = new DataSizeUnit({
    symbol: "TiB",
    englishName: "tebibyte",
    localizedName: "tebibyte",
    pluralEnglish: "tebibytes",
    pluralSwedish: "tebibyte",
    toBaseUnitFactor: factor("1099511627776"),
    aliases: ["tebibyte", "tebibytes"],
  });

  static readonly Pebibyte = new DataSizeUnit({
    symbol: "PiB",
    englishName: "pebibyte",
    localizedName: "pebibyte",
    pluralEnglish: "pebibytes",
    pluralSwedish: "pebibyte",
    toBaseUnitFactor: factor("1125899906842624"),
    aliases: ["pebibyte", "pebibytes"],
  });

  static readonly Exbibyte = new DataSizeUnit({
    symbol: "EiB",
    englishName: "exbibyte",
    localizedName: "exbibyte",
    pluralEnglish: "exbibytes",
    pluralSwedish: "exbibyte",
    toBaseUnitFactor: factor("1152921504606846976"),
    aliases: ["exbibyte", "exbibytes"],
  });

  /** @internal Shared lookup and natural-scale walk. */
  static readonly index: MeasurementUnitIndex<DataSizeUnit> =
    new MeasurementUnitIndex<DataSizeUnit>(
      [
        DataSizeUnit.Byte,
        DataSizeUnit.Kilobyte,
        DataSizeUnit.Megabyte,
        DataSizeUnit.Gigabyte,
        DataSizeUnit.Terabyte,
        DataSizeUnit.Petabyte,
        DataSizeUnit.Exabyte,
        DataSizeUnit.Kibibyte,
        DataSizeUnit.Mebibyte,
        DataSizeUnit.Gibibyte,
        DataSizeUnit.Tebibyte,
        DataSizeUnit.Pebibyte,
        DataSizeUnit.Exbibyte,
      ],
      DataSizeUnit.Byte,
      [
        DataSizeUnit.Byte,
        DataSizeUnit.Kilobyte,
        DataSizeUnit.Megabyte,
        DataSizeUnit.Gigabyte,
        DataSizeUnit.Terabyte,
        DataSizeUnit.Petabyte,
        DataSizeUnit.Exabyte,
      ],
    );

  static get all(): readonly DataSizeUnit[] {
    return DataSizeUnit.index.all;
  }

  /** The base unit: B. */
  static get baseUnit(): DataSizeUnit {
    return DataSizeUnit.index.baseUnit;
  }

  /** Units ordered small to large, used to auto-scale display. */
  static get naturalScale(): readonly DataSizeUnit[] {
    return DataSizeUnit.index.naturalScale;
  }

  /** Resolves a unit from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): DataSizeUnit | null {
    return DataSizeUnit.index.tryParse(input);
  }

  static parse(input: string): DataSizeUnit {
    const result = DataSizeUnit.tryParse(input);
    if (result === null) throw new Error("Unknown data size unit.");
    return result;
  }

  /** Returns the most human-readable unit for a value in B. */
  static getNatural(baseValue: Decimal): DataSizeUnit {
    return DataSizeUnit.index.getNatural(baseValue);
  }
}
