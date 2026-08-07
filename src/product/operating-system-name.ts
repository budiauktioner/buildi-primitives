import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { OperatingSystemFamily } from "./operating-system-family.js";

/** Options shared by the string-in, string-out helpers. */
export interface OperatingSystemNameFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/** Canonical name, family and the aliases that resolve to it. */
const KNOWN_SYSTEMS: readonly (readonly [string, OperatingSystemFamily, readonly string[]])[] = [
  ["None", OperatingSystemFamily.None, ["no os", "without os", "inget os", "inget operativsystem"]],
  ["Windows", OperatingSystemFamily.Windows, ["win", "microsoft windows", "ms windows"]],
  ["macOS", OperatingSystemFamily.MacOS, ["macos", "mac os", "mac os x", "os x", "osx", "mac"]],
  ["Linux", OperatingSystemFamily.Linux, []],
  ["Ubuntu", OperatingSystemFamily.Linux, ["ubuntu linux"]],
  ["Debian", OperatingSystemFamily.Linux, ["debian linux"]],
  ["Fedora", OperatingSystemFamily.Linux, ["fedora linux"]],
  ["CentOS", OperatingSystemFamily.Linux, ["centos linux"]],
  ["Red Hat", OperatingSystemFamily.Linux, ["rhel", "red hat enterprise linux", "redhat"]],
  ["SUSE", OperatingSystemFamily.Linux, ["suse linux"]],
  ["openSUSE", OperatingSystemFamily.Linux, ["opensuse linux"]],
  ["Arch Linux", OperatingSystemFamily.Linux, ["arch"]],
  ["Linux Mint", OperatingSystemFamily.Linux, ["mint"]],
  ["Manjaro", OperatingSystemFamily.Linux, ["manjaro linux"]],
  ["Gentoo", OperatingSystemFamily.Linux, ["gentoo linux"]],
  ["Alpine", OperatingSystemFamily.Linux, ["alpine linux"]],
  ["Android", OperatingSystemFamily.Android, []],
  ["iOS", OperatingSystemFamily.IOS, ["iphone os"]],
  ["iPadOS", OperatingSystemFamily.IPadOS, ["ipad os"]],
  ["ChromeOS", OperatingSystemFamily.ChromeOS, ["chrome os", "chromeos"]],
  ["watchOS", OperatingSystemFamily.WatchOS, ["watch os"]],
  ["tvOS", OperatingSystemFamily.Other, ["tv os"]],
  ["FreeBSD", OperatingSystemFamily.Other, []],
  ["Unix", OperatingSystemFamily.Other, []],
  ["Solaris", OperatingSystemFamily.Other, []],
  ["HarmonyOS", OperatingSystemFamily.Other, ["harmony os"]],
];

const LOOKUP = new Map<string, OperatingSystemName>();

/**
 * A recognized operating system name, e.g. `Windows`, `macOS` or `Ubuntu`, resolved from the
 * aliases the trade uses, so `win`, `ms windows` and `Windows` all give the same value.
 */
export class OperatingSystemName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Operating System Name",
    localizedName: "Operativsystemnamn",
    emoji: "💻",
    sources: Object.freeze([]),
  });

  /** The canonical name, e.g. `macOS`. */
  readonly value: string;

  /** The family this name belongs to. */
  readonly family: OperatingSystemFamily;

  private constructor(value: string, family: OperatingSystemFamily) {
    this.value = value;
    this.family = family;
  }

  static {
    for (const [canonical, family, aliases] of KNOWN_SYSTEMS) {
      const instance = new OperatingSystemName(canonical, family);
      LOOKUP.set(foldOrdinalIgnoreCase(canonical), instance);
      for (const alias of aliases) {
        const key = foldOrdinalIgnoreCase(alias);
        if (!LOOKUP.has(key)) LOOKUP.set(key, instance);
      }
    }
  }

  static tryParse(input: string | null | undefined): OperatingSystemName | null {
    if (input == null || input.trim().length === 0) return null;
    return LOOKUP.get(foldOrdinalIgnoreCase(sanitizeInput(input).trim())) ?? null;
  }

  static parse(input: string): OperatingSystemName {
    const result = OperatingSystemName.tryParse(input);
    if (result === null) throw new Error("Unknown operating system name.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return OperatingSystemName.tryParse(input) !== null;
  }

  /** Returns the canonical name, e.g. `macOS`. */
  static format(
    input: string | null | undefined,
    options?: OperatingSystemNameFormatOptions,
  ): string | null {
    const r = OperatingSystemName.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical name, e.g. `macOS`. */
  static normalize(
    input: string | null | undefined,
    options?: OperatingSystemNameFormatOptions,
  ): string | null {
    const r = OperatingSystemName.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && OperatingSystemName.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: OperatingSystemName | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: OperatingSystemName | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function fallback(
  input: string | null | undefined,
  options?: OperatingSystemNameFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
