import { PrimitivesDefaults } from "../primitives-defaults.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options for {@link EuVehicleCategory.format} and {@link EuVehicleCategory.normalize}. */
export interface EuVehicleCategoryFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const CATEGORY_PATTERN = /^([MNOLTCRS])(\d)(e)?(-[A-Z]\d?)?(G)?$/iu;

const KNOWN_CATEGORIES: Readonly<Record<string, readonly [string, string]>> = Object.freeze({
  M1: ["Passenger vehicle ≤8+1 seats", "Personbil ≤8+1 passagerare"],
  M2: ["Bus/coach >8+1 seats, ≤5 t", "Buss >8+1 passagerare, ≤5 ton"],
  M3: ["Bus/coach >8+1 seats, >5 t", "Buss >8+1 passagerare, >5 ton"],
  N1: ["Light commercial vehicle ≤3.5 t", "Lätt lastbil ≤3,5 ton"],
  N2: ["Medium goods vehicle 3.5–12 t", "Lastbil 3,5–12 ton"],
  N3: ["Heavy goods vehicle >12 t", "Tung lastbil >12 ton"],
  O1: ["Light trailer ≤0.75 t", "Lätt släpvagn ≤0,75 ton"],
  O2: ["Trailer 0.75–3.5 t", "Släpvagn 0,75–3,5 ton"],
  O3: ["Trailer 3.5–10 t", "Släpvagn 3,5–10 ton"],
  O4: ["Heavy trailer >10 t", "Tung släpvagn >10 ton"],
  L1e: ["Two-wheel moped", "Tvåhjulig moped"],
  L2e: ["Three-wheel moped", "Trehjulig moped"],
  L3e: ["Two-wheel motorcycle", "Tvåhjulig motorcykel"],
  L4e: ["Motorcycle with sidecar", "Motorcykel med sidvagn"],
  L5e: ["Motor tricycle", "Motordriven trehjuling"],
  L6e: ["Light quadricycle", "Lätt fyrhjuling"],
  L7e: ["Heavy quadricycle", "Tung fyrhjuling"],
  T1: ["Standard agricultural tractor", "Standardjordbrukstraktor"],
  T2: ["Narrow-track tractor", "Smalspårig traktor"],
  T3: ["Low-clearance tractor", "Lågbyggd traktor"],
  T4: ["Special-purpose tractor", "Specialtraktor"],
  T5: ["Fast tractor", "Snabb traktor"],
  C1: ["Track-laying tractor (as T1)", "Bandtraktor (som T1)"],
  C2: ["Track-laying tractor (as T2)", "Bandtraktor (som T2)"],
  C3: ["Track-laying tractor (as T3)", "Bandtraktor (som T3)"],
  C4: ["Track-laying tractor (as T4)", "Bandtraktor (som T4)"],
  C5: ["Track-laying tractor (as T5)", "Bandtraktor (som T5)"],
  R1: ["Agricultural trailer ≤1.5 t", "Jordbrukssläpvagn ≤1,5 ton"],
  R2: ["Agricultural trailer 1.5–3.5 t", "Jordbrukssläpvagn 1,5–3,5 ton"],
  R3: ["Agricultural trailer 3.5–21 t", "Jordbrukssläpvagn 3,5–21 ton"],
  R4: ["Agricultural trailer >21 t", "Jordbrukssläpvagn >21 ton"],
  S1: ["Towed machinery ≤3.5 t", "Utbytbar dragen maskin ≤3,5 ton"],
  S2: ["Towed machinery >3.5 t", "Utbytbar dragen maskin >3,5 ton"],
});

/**
 * An EU vehicle category code (`fordonskategori`) per Regulation (EU) 2018/858 and
 * Directive 2007/46/EC, e.g. `M1`, `N1G` or `L3e-A2`.
 *
 * Sources:
 * - https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32018R0858
 * - https://www.transportstyrelsen.se/
 */
export class EuVehicleCategory {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "EU Vehicle Category",
    localizedName: "Fordonskategori",
    emoji: "🚛",
    sources: Object.freeze([
      "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32018R0858",
      "https://www.transportstyrelsen.se/",
    ]),
  });

  /** Canonical category code, e.g. `N1`, `M1G` or `L3e-A2`. */
  readonly value: string;

  /** Base category letter, e.g. `M`, `N` or `L`. */
  readonly baseCategory: string;

  /** Numeric part of the category, e.g. `1`. */
  readonly categoryNumber: number;

  /** Optional suffix such as `G` (off-road), `e` (L categories) or `e-A2`. */
  readonly suffix: string | null;

  /** English description, e.g. `Passenger vehicle ≤8+1 seats`. */
  readonly englishDescription: string;

  /** Swedish description, e.g. `Personbil ≤8+1 passagerare`. */
  readonly localizedDescription: string;

  /** `true` when the `G` suffix marks an off-road variant. */
  readonly isOffRoad: boolean;

  private constructor(
    baseCategory: string,
    categoryNumber: number,
    suffix: string | null,
    englishDescription: string,
    localizedDescription: string,
    isOffRoad: boolean,
  ) {
    this.value = `${baseCategory}${categoryNumber}${suffix ?? ""}`;
    this.baseCategory = baseCategory;
    this.categoryNumber = categoryNumber;
    this.suffix = suffix;
    this.englishDescription = englishDescription;
    this.localizedDescription = localizedDescription;
    this.isOffRoad = isOffRoad;
  }

  /** The description in the configured display language. */
  get description(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedDescription
      : this.englishDescription;
  }

  static tryParse(input: string | null | undefined): EuVehicleCategory | null {
    if (input == null || input.trim().length === 0) return null;

    const match = CATEGORY_PATTERN.exec(input.trim());
    if (match === null) return null;

    const baseLetter = match[1]!.toUpperCase();
    const number = Number(match[2]);
    const hasE = match[3] !== undefined;
    const subSuffix = match[4]?.toUpperCase() ?? null;
    const hasG = match[5] !== undefined;

    // The `e` marker belongs to the L categories and nowhere else; `G` marks an
    // off-road variant, which only M and N vehicles can be.
    if (baseLetter === "L" && !hasE) return null;
    if (baseLetter !== "L" && hasE) return null;
    if (hasG && baseLetter !== "M" && baseLetter !== "N") return null;
    if (subSuffix !== null && !hasE) return null;

    const descriptions =
      KNOWN_CATEGORIES[hasE ? `${baseLetter}${number}e` : `${baseLetter}${number}`];
    if (descriptions === undefined) return null;

    const suffix = hasE ? (subSuffix !== null ? `e${subSuffix}` : "e") : hasG ? "G" : null;

    return new EuVehicleCategory(
      baseLetter,
      number,
      suffix,
      hasG ? `${descriptions[0]} (off-road)` : descriptions[0],
      hasG ? `${descriptions[1]} (terrängfordon)` : descriptions[1],
      hasG,
    );
  }

  static parse(input: string): EuVehicleCategory {
    const result = EuVehicleCategory.tryParse(input);
    if (result === null) throw new Error("Invalid EU vehicle category.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EuVehicleCategory.tryParse(input) !== null;
  }

  /** Returns the description, e.g. `Passenger vehicle ≤8+1 seats`. */
  static format(
    input: string | null | undefined,
    options?: EuVehicleCategoryFormatOptions,
  ): string | null {
    const parsed = EuVehicleCategory.tryParse(input);
    if (parsed !== null) return parsed.description;
    return fallback(input, options);
  }

  /** Returns the canonical category code, e.g. `M1`. */
  static normalize(
    input: string | null | undefined,
    options?: EuVehicleCategoryFormatOptions,
  ): string | null {
    const parsed = EuVehicleCategory.tryParse(input);
    if (parsed !== null) return parsed.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EuVehicleCategory.normalize(input) === input;
  }

  /** Returns the canonical category code, e.g. `M1`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the canonical category code, e.g. `M1`. */
  toString(): string {
    return this.value;
  }

  equals(other: EuVehicleCategory | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: EuVehicleCategory | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: EuVehicleCategoryFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
