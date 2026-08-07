import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { OperatingSystemName } from "./operating-system-name.js";
import { OperatingSystemVersion } from "./operating-system-version.js";

/** Options shared by the string-in, string-out helpers. */
export interface OperatingSystemInfoFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * An operating system name with an optional version, e.g. `Windows 11`, `macOS 14.5` or
 * `Ubuntu 22.04`. The name is matched greedily from the longest prefix, so multi-word names such
 * as `Arch Linux` are not mistaken for a shorter one followed by a version.
 */
export class OperatingSystemInfo {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Operating System",
    localizedName: "Operativsystem",
    emoji: "💻",
    sources: Object.freeze([]),
  });

  /** The operating system name. */
  readonly name: OperatingSystemName;

  /** The version when the input carried one, otherwise `null`. */
  readonly version: OperatingSystemVersion | null;

  /** Display form, e.g. `Windows 11`. */
  readonly value: string;

  private constructor(name: OperatingSystemName, version: OperatingSystemVersion | null) {
    this.name = name;
    this.version = version;
    this.value = version === null ? name.value : `${name.value} ${version.value}`;
  }

  static tryParse(input: string | null | undefined): OperatingSystemInfo | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();

    for (let i = text.length; i >= 1; i--) {
      const name = OperatingSystemName.tryParse(text.slice(0, i).trimEnd());
      if (name === null) continue;

      const rest = text.slice(i).trim();
      if (rest.length === 0) return new OperatingSystemInfo(name, null);

      const version = OperatingSystemVersion.tryParse(rest);
      if (version !== null) return new OperatingSystemInfo(name, version);
    }

    return null;
  }

  static parse(input: string): OperatingSystemInfo {
    const result = OperatingSystemInfo.tryParse(input);
    if (result === null) throw new Error("Invalid operating system.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return OperatingSystemInfo.tryParse(input) !== null;
  }

  /** Returns the canonical display form, e.g. `Windows 11`. */
  static format(
    input: string | null | undefined,
    options?: OperatingSystemInfoFormatOptions,
  ): string | null {
    const r = OperatingSystemInfo.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical display form, e.g. `Windows 11`. */
  static normalize(
    input: string | null | undefined,
    options?: OperatingSystemInfoFormatOptions,
  ): string | null {
    const r = OperatingSystemInfo.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && OperatingSystemInfo.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: OperatingSystemInfo | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: OperatingSystemInfo | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: OperatingSystemInfoFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
