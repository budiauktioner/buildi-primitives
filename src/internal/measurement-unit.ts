/**
 * Shared machinery for the `Measurement` unit classes (`LengthUnit`,
 * `PowerUnit`, and the rest).
 *
 * In .NET each of these is a hand-written class repeating the same symbol
 * index, natural-scale walk and lookup. Repetition is free there; here it would
 * be bytes shipped to a browser for all nineteen dimensions, so the shared part
 * lives once and each public unit class supplies only its table.
 *
 * Internal; not re-exported publicly.
 */

import { Decimal } from "./decimal.js";

/** The fields every unit in a dimension carries. */
export interface MeasurementUnitDefinition {
  readonly symbol: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly pluralEnglish: string;
  readonly pluralSwedish: string;
  /** Multiply a value in this unit by this factor to reach the base unit. */
  readonly toBaseUnitFactor: Decimal;
  /**
   * Exact conversion as a `[numerator, denominator]` pair, for units whose
   * factor is a repeating decimal — 1/60 for rpm, 1/3600 for coulomb, 1000/3600
   * for km/h. Multiplying by the rounded factor and dividing by it are not
   * inverses, so both directions go through the ratio instead. .NET
   * special-cases exactly these units for the same reason.
   */
  readonly exactRatio?: readonly [numerator: Decimal, denominator: Decimal];
  readonly aliases?: readonly string[];
}

export class MeasurementUnit {
  readonly symbol: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly pluralEnglish: string;
  readonly pluralSwedish: string;
  readonly toBaseUnitFactor: Decimal;
  readonly aliases: readonly string[];
  private readonly exactRatio: readonly [Decimal, Decimal] | null;

  constructor(definition: MeasurementUnitDefinition) {
    this.symbol = definition.symbol;
    this.englishName = definition.englishName;
    this.localizedName = definition.localizedName;
    this.pluralEnglish = definition.pluralEnglish;
    this.pluralSwedish = definition.pluralSwedish;
    this.toBaseUnitFactor = definition.toBaseUnitFactor;
    this.aliases = definition.aliases ?? [];
    this.exactRatio = definition.exactRatio ?? null;
  }

  /** Converts a value expressed in this unit into the dimension's base unit. */
  toBase(value: Decimal): Decimal {
    if (this.exactRatio === null) return value.times(this.toBaseUnitFactor);
    return value.times(this.exactRatio[0]).dividedBy(this.exactRatio[1]);
  }

  /** Converts a value expressed in the base unit into this unit. */
  fromBase(baseValue: Decimal): Decimal {
    if (this.exactRatio === null) return baseValue.dividedBy(this.toBaseUnitFactor);
    return baseValue.times(this.exactRatio[1]).dividedBy(this.exactRatio[0]);
  }

  toString(): string {
    return this.symbol;
  }
}

/**
 * Case-insensitive lookup over a dimension's units plus the natural-scale walk
 * used for display.
 */
export class MeasurementUnitIndex<TUnit extends MeasurementUnit> {
  private index: Map<string, TUnit> | null = null;

  constructor(
    readonly all: readonly TUnit[],
    readonly baseUnit: TUnit,
    /** Metric units ordered small to large, used to auto-scale display. */
    readonly naturalScale: readonly TUnit[],
    /**
     * Units whose symbol is deliberately left out of the index because it
     * collides case-insensitively with another unit's — `mW` against `MW`. The
     * owning class resolves those itself.
     */
    private readonly symbolsExcludedFromIndex: readonly TUnit[] = [],
  ) {}

  /**
   * Matches on symbol, English and Swedish names, plurals and aliases. Earlier
   * units win a collision, mirroring the `TryAdd` order in .NET.
   */
  tryParse(input: string | null | undefined): TUnit | null {
    if (input == null) return null;
    const trimmed = input.trim();
    if (trimmed.length === 0) return null;
    return this.symbolIndex().get(fold(trimmed)) ?? null;
  }

  /**
   * Picks the largest unit on the natural scale where the magnitude is still at
   * least one, so 1500 meters displays as `1.5 km`.
   */
  getNatural(baseValue: Decimal): TUnit {
    const magnitude = baseValue.abs();
    let result = this.naturalScale[0] ?? this.baseUnit;

    for (let i = 1; i < this.naturalScale.length; i++) {
      const candidate = this.naturalScale[i];
      if (candidate === undefined) break;
      if (magnitude.dividedBy(candidate.toBaseUnitFactor).compareTo(Decimal.one) >= 0) {
        result = candidate;
      } else break;
    }

    return result;
  }

  private symbolIndex(): Map<string, TUnit> {
    if (this.index !== null) return this.index;

    const index = new Map<string, TUnit>();
    const add = (key: string, unit: TUnit): void => {
      const normalized = fold(key);
      if (normalized.length > 0 && !index.has(normalized)) index.set(normalized, unit);
    };

    for (const unit of this.all) {
      if (!this.symbolsExcludedFromIndex.includes(unit)) add(unit.symbol, unit);
      add(unit.englishName, unit);
      add(unit.localizedName, unit);
      add(unit.pluralEnglish, unit);
      add(unit.pluralSwedish, unit);
      for (const alias of unit.aliases) add(alias, unit);
    }

    this.index = index;
    return index;
  }
}

/**
 * Case-folds a lookup key the way .NET's `StringComparer.OrdinalIgnoreCase`
 * does, by upper-casing. Lower-casing would not do: the micro sign `µ` and the
 * Greek capital mu `Μ` fold together going up but not going down, so `ΜW` would
 * stop resolving to microwatt.
 */
function fold(key: string): string {
  return key.toUpperCase();
}
