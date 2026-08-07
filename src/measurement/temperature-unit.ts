import { foldForUnitLookup } from "../internal/measurement-unit.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/**
 * A temperature scale identified by its symbol.
 *
 * Unlike every other unit in this namespace, temperature scales carry no
 * conversion factor: Celsius, Fahrenheit and kelvin differ by an offset as well
 * as a scale, so {@link Temperature} converts between them explicitly. That is
 * also why this class does not share the common unit machinery.
 */
export class TemperatureUnit {
  declare private readonly __temperatureUnitBrand: void;

  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Temperature Unit",
    localizedName: "Temperaturenhet",
    emoji: "🌡️",
    sources: Object.freeze([]),
  });

  private static index: Map<string, TemperatureUnit> | null = null;

  readonly symbol: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly pluralEnglish: string;
  readonly pluralSwedish: string;
  readonly aliases: readonly string[];

  private constructor(definition: {
    symbol: string;
    englishName: string;
    localizedName: string;
    pluralEnglish: string;
    pluralSwedish: string;
    aliases: readonly string[];
  }) {
    this.symbol = definition.symbol;
    this.englishName = definition.englishName;
    this.localizedName = definition.localizedName;
    this.pluralEnglish = definition.pluralEnglish;
    this.pluralSwedish = definition.pluralSwedish;
    this.aliases = Object.freeze([...definition.aliases]);

    return new Proxy(this, {
      set() {
        throw new TypeError("Measurement units are immutable.");
      },
    });
  }

  static readonly Celsius = new TemperatureUnit({
    symbol: "°C",
    englishName: "degree Celsius",
    localizedName: "grad Celsius",
    pluralEnglish: "degrees Celsius",
    pluralSwedish: "grader Celsius",
    aliases: ["C", "celsius", "grader"],
  });

  static readonly Fahrenheit = new TemperatureUnit({
    symbol: "°F",
    englishName: "degree Fahrenheit",
    localizedName: "grad Fahrenheit",
    pluralEnglish: "degrees Fahrenheit",
    pluralSwedish: "grader Fahrenheit",
    aliases: ["F", "fahrenheit"],
  });

  static readonly Kelvin = new TemperatureUnit({
    symbol: "K",
    englishName: "kelvin",
    localizedName: "kelvin",
    pluralEnglish: "kelvin",
    pluralSwedish: "kelvin",
    aliases: ["kelvin"],
  });

  private static readonly units: readonly TemperatureUnit[] = Object.freeze([
    TemperatureUnit.Celsius,
    TemperatureUnit.Fahrenheit,
    TemperatureUnit.Kelvin,
  ]);

  static {
    for (const unit of TemperatureUnit.units) Object.freeze(unit);
  }

  static get all(): readonly TemperatureUnit[] {
    return TemperatureUnit.units;
  }

  /** The SI base unit for thermodynamic temperature: kelvin. */
  static get baseUnit(): TemperatureUnit {
    return TemperatureUnit.Kelvin;
  }

  /** Resolves a scale from a symbol, name, plural or alias, case-insensitively. */
  static tryParse(input: string | null | undefined): TemperatureUnit | null {
    if (input == null) return null;
    const trimmed = input.trim();
    if (trimmed.length === 0) return null;
    return TemperatureUnit.symbolIndex().get(foldForUnitLookup(trimmed)) ?? null;
  }

  static parse(input: string): TemperatureUnit {
    const result = TemperatureUnit.tryParse(input);
    if (result === null) throw new Error("Unknown temperature unit.");
    return result;
  }

  static assertOwns(unit: unknown): asserts unit is TemperatureUnit {
    if (!TemperatureUnit.units.includes(unit as TemperatureUnit)) {
      throw new RangeError("Unit belongs to another dimension.");
    }
  }

  toString(): string {
    return this.symbol;
  }

  private static symbolIndex(): Map<string, TemperatureUnit> {
    if (TemperatureUnit.index !== null) return TemperatureUnit.index;

    const index = new Map<string, TemperatureUnit>();
    const add = (key: string, unit: TemperatureUnit): void => {
      const folded = foldForUnitLookup(key);
      if (folded.length > 0 && !index.has(folded)) index.set(folded, unit);
    };

    for (const unit of TemperatureUnit.all) {
      add(unit.symbol, unit);
      add(unit.englishName, unit);
      add(unit.localizedName, unit);
      add(unit.pluralEnglish, unit);
      add(unit.pluralSwedish, unit);
      for (const alias of unit.aliases) add(alias, unit);
    }

    TemperatureUnit.index = index;
    return index;
  }
}
