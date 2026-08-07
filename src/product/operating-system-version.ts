import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

/** Options shared by the string-in, string-out helpers. */
export interface OperatingSystemVersionFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const VERSION_PATTERN = /^\s*v?(\d+(?:\.\d+){0,3})\s*$/iu;

/**
 * An operating system version, e.g. `11`, `14.5`, `10.15.7` or `22.04`, with up to four numeric
 * parts. A leading `v` is accepted on input and dropped from the value.
 */
export class OperatingSystemVersion {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Operating System Version",
    localizedName: "Operativsystemversion",
    emoji: "💻",
    sources: Object.freeze([]),
  });

  /** The version string, e.g. `14.5`. */
  readonly value: string;

  /** The first part, e.g. `14` in `14.5`. */
  readonly major: number;

  /** The second part when present, e.g. `5` in `14.5`. */
  readonly minor: number | null;

  /** The third part when present, e.g. `7` in `10.15.7`. */
  readonly patch: number | null;

  /** The fourth part when present. */
  readonly build: number | null;

  private constructor(value: string, parts: readonly number[]) {
    this.value = value;
    this.major = parts[0]!;
    this.minor = parts[1] ?? null;
    this.patch = parts[2] ?? null;
    this.build = parts[3] ?? null;
  }

  static tryParse(input: string | null | undefined): OperatingSystemVersion | null {
    if (input == null || input.trim().length === 0) return null;

    const match = VERSION_PATTERN.exec(sanitizeInput(input));
    if (match === null) return null;

    const version = match[1]!;
    return new OperatingSystemVersion(
      version,
      version.split(".").map((part) => Number(part)),
    );
  }

  static parse(input: string): OperatingSystemVersion {
    const result = OperatingSystemVersion.tryParse(input);
    if (result === null) throw new Error("Invalid OS version.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return OperatingSystemVersion.tryParse(input) !== null;
  }

  /** Returns the canonical version string, e.g. `14.5`. */
  static format(
    input: string | null | undefined,
    options?: OperatingSystemVersionFormatOptions,
  ): string | null {
    const r = OperatingSystemVersion.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical version string, e.g. `14.5`. */
  static normalize(
    input: string | null | undefined,
    options?: OperatingSystemVersionFormatOptions,
  ): string | null {
    const r = OperatingSystemVersion.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && OperatingSystemVersion.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: OperatingSystemVersion | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  /** Orders numerically part by part, treating a missing part as zero. */
  compareTo(other: OperatingSystemVersion | null | undefined): number {
    if (other == null) return 1;

    const mine = [this.major, this.minor ?? 0, this.patch ?? 0, this.build ?? 0];
    const theirs = [other.major, other.minor ?? 0, other.patch ?? 0, other.build ?? 0];

    for (let i = 0; i < mine.length; i++) {
      if (mine[i]! !== theirs[i]!) return mine[i]! < theirs[i]! ? -1 : 1;
    }
    return 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: OperatingSystemVersionFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
