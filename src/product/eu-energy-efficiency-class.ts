import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { EnergyScale } from "./energy-scale.js";

/** Options shared by the string-in, string-out helpers. */
export interface EuEnergyEfficiencyClassFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * EU energy efficiency class (`energimärkning`) for appliance labels, covering both the
 * pre-2021 `A+++` scale and the rescaled A–G (2021) scale.
 */
export class EuEnergyEfficiencyClass {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Energy Efficiency Class",
    localizedName: "Energimärkning",
    emoji: "🏷️",
    sources: Object.freeze([
      "https://energy.ec.europa.eu/topics/energy-efficiency/energy-label-and-ecodesign/energy-label_en",
    ]),
  });

  /** Display label, e.g. `A+++`, `B`, `G`. */
  readonly label: string;

  /** Whether this value sits on the pre-2021 `A+++` scale or the rescaled A–G scale. */
  readonly scale: EnergyScale;

  /** Rank where lower is better: old scale `A+++`=0 … `G`=9, new scale `A`=0 … `G`=6. */
  readonly numericRank: number;

  private constructor(label: string, scale: EnergyScale, numericRank: number) {
    this.label = label;
    this.scale = scale;
    this.numericRank = numericRank;
  }

  static readonly APlusPlusPlus = new EuEnergyEfficiencyClass("A+++", EnergyScale.Old, 0);
  static readonly APlusPlus = new EuEnergyEfficiencyClass("A++", EnergyScale.Old, 1);
  static readonly APlus = new EuEnergyEfficiencyClass("A+", EnergyScale.Old, 2);
  static readonly A = new EuEnergyEfficiencyClass("A", EnergyScale.Old, 3);
  static readonly B = new EuEnergyEfficiencyClass("B", EnergyScale.Old, 4);
  static readonly C = new EuEnergyEfficiencyClass("C", EnergyScale.Old, 5);
  static readonly D = new EuEnergyEfficiencyClass("D", EnergyScale.Old, 6);
  static readonly E = new EuEnergyEfficiencyClass("E", EnergyScale.Old, 7);
  static readonly F = new EuEnergyEfficiencyClass("F", EnergyScale.Old, 8);
  static readonly G = new EuEnergyEfficiencyClass("G", EnergyScale.Old, 9);

  /** Rescaled EU label (2021): `A` is rank 0, `G` is rank 6. */
  static readonly NewA = new EuEnergyEfficiencyClass("A", EnergyScale.New, 0);
  static readonly NewB = new EuEnergyEfficiencyClass("B", EnergyScale.New, 1);
  static readonly NewC = new EuEnergyEfficiencyClass("C", EnergyScale.New, 2);
  static readonly NewD = new EuEnergyEfficiencyClass("D", EnergyScale.New, 3);
  static readonly NewE = new EuEnergyEfficiencyClass("E", EnergyScale.New, 4);
  static readonly NewF = new EuEnergyEfficiencyClass("F", EnergyScale.New, 5);
  static readonly NewG = new EuEnergyEfficiencyClass("G", EnergyScale.New, 6);

  /** The ten values of the pre-2021 scale, best first. */
  static get all(): readonly EuEnergyEfficiencyClass[] {
    return ALL;
  }

  /** Same as {@link label}. */
  get value(): string {
    return this.label;
  }

  /** Resolves a label. Parsing always yields a value on the pre-2021 scale. */
  static tryParse(input: string | null | undefined): EuEnergyEfficiencyClass | null {
    if (input == null) return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length < 1 || trimmed.length > 4) return null;

    return BY_LABEL.get(trimmed.toUpperCase()) ?? null;
  }

  static parse(input: string): EuEnergyEfficiencyClass {
    const result = EuEnergyEfficiencyClass.tryParse(input);
    if (result === null) throw new Error("Invalid energy efficiency class.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return EuEnergyEfficiencyClass.tryParse(input) !== null;
  }

  /** Returns the canonical label, e.g. `A+++` or `B`. */
  static format(
    input: string | null | undefined,
    options?: EuEnergyEfficiencyClassFormatOptions,
  ): string | null {
    const r = EuEnergyEfficiencyClass.tryParse(input);
    if (r !== null) return r.label;
    return fallback(input, options);
  }

  /** Returns the canonical label, e.g. `A+++` or `B`. */
  static normalize(
    input: string | null | undefined,
    options?: EuEnergyEfficiencyClassFormatOptions,
  ): string | null {
    const r = EuEnergyEfficiencyClass.tryParse(input);
    if (r !== null) return r.label;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EuEnergyEfficiencyClass.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.label;
  }

  toString(): string {
    return this.label;
  }

  /** Ranks compare across scales, so old `A` and new `D` are treated as equivalent. */
  equals(other: EuEnergyEfficiencyClass | null | undefined): boolean {
    return other != null && this.numericRank === other.numericRank;
  }

  compareTo(other: EuEnergyEfficiencyClass | null | undefined): number {
    if (other == null) return 1;
    return this.numericRank < other.numericRank ? -1 : this.numericRank > other.numericRank ? 1 : 0;
  }
}

const ALL: readonly EuEnergyEfficiencyClass[] = [
  EuEnergyEfficiencyClass.APlusPlusPlus,
  EuEnergyEfficiencyClass.APlusPlus,
  EuEnergyEfficiencyClass.APlus,
  EuEnergyEfficiencyClass.A,
  EuEnergyEfficiencyClass.B,
  EuEnergyEfficiencyClass.C,
  EuEnergyEfficiencyClass.D,
  EuEnergyEfficiencyClass.E,
  EuEnergyEfficiencyClass.F,
  EuEnergyEfficiencyClass.G,
];

const BY_LABEL = new Map<string, EuEnergyEfficiencyClass>(ALL.map((c) => [c.label, c]));

function fallback(
  input: string | null | undefined,
  options?: EuEnergyEfficiencyClassFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
