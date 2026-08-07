import { Decimal } from "../internal/decimal.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { formatEuShoeSize, formatShoeNumber } from "../internal/shoe-size-format.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { ShoeSizeSystem } from "./shoe-size-system.js";

/** Options shared by the string-in, string-out helpers. */
export interface ChildShoeSizeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

const UK_TODDLER_OFFSET = 16.5;
const UK_YOUTH_OFFSET = 33.5;

/** EU sizes 16–39 with the US child (C) and youth (Y) label each anchors. */
const US_LABEL_BY_EU: readonly (readonly [number, string])[] = [
  [16, "1C"],
  [17, "1.5C"],
  [18, "2.5C"],
  [19, "3.5C"],
  [20, "4C"],
  [21, "5C"],
  [22, "5.5C"],
  [23, "6.5C"],
  [24, "7.5C"],
  [25, "8C"],
  [26, "8.5C"],
  [27, "9.5C"],
  [28, "10.5C"],
  [29, "11C"],
  [30, "11.5C"],
  [31, "12.5C"],
  [32, "13C"],
  [33, "1Y"],
  [34, "2Y"],
  [35, "2.5Y"],
  [36, "3.5Y"],
  [37, "4Y"],
  [38, "5Y"],
  [39, "6Y"],
];

const EU_TO_US = new Map(US_LABEL_BY_EU);
const US_TO_EU = new Map(US_LABEL_BY_EU.map(([eu, label]) => [label.toUpperCase(), eu]));

const EU_PATTERN = /^\s*(?:child\s+)?EU\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const BARN_PATTERN = /^\s*barn\s*([0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const US_CHILD_PATTERN = /^\s*US\s+([0-9]+(?:[.,][0-9]+)?)\s*([CY])\s*$/iu;
const UK_PATTERN = /^\s*UK\s*(-?[0-9]+(?:[.,][0-9]+)?)\s*$/iu;
const BARE_NUMBER_PATTERN = /^\s*([0-9]+(?:[.,][0-9]+)?)\s*$/u;

/**
 * Children's shoe size (`barnskostorlek`) stored as an EU size between 16 and 39 in half steps,
 * with US child (C/Y) and UK labels alongside.
 *
 * US labels follow a fixed EU anchor chart. UK uses approximate offsets: toddler EU − 16.5 and
 * youth EU − 33.5, where youth labels can go negative around EU 33. Parsing a UK size tries
 * youth first when the result lands in EU 33–39, then toddler.
 */
export class ChildShoeSize {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Child Shoe Size",
    localizedName: "Barnskostorlek",
    emoji: "👟",
    sources: Object.freeze([
      "https://www.iso.org/standard/83106.html",
      "https://www.iso.org/standard/71594.html",
      "https://en.wikipedia.org/wiki/Shoe_size",
    ]),
  });

  /** The EU size, e.g. `28` or `28.5`. */
  readonly euSize: number;

  /** The sizing system the value was parsed from. */
  readonly system: ShoeSizeSystem;

  /** Display form as an EU size, e.g. `EU 28` or `EU 28.5`. */
  readonly value: string;

  private constructor(euSize: number, system: ShoeSizeSystem) {
    this.euSize = euSize;
    this.system = system;
    this.value = formatEuShoeSize(euSize);
  }

  /** US child size label derived from EU, e.g. `10.5C` or `3.5Y`. */
  get usSize(): string {
    return usLabelForEu(this.euSize);
  }

  /** UK size label derived from EU: toddler is EU − 16.5, youth is EU − 33.5. */
  get ukSize(): string {
    return formatShoeNumber(
      this.euSize <= 32 ? this.euSize - UK_TODDLER_OFFSET : this.euSize - UK_YOUTH_OFFSET,
    );
  }

  static tryParse(input: string | null | undefined): ChildShoeSize | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();
    const match =
      matchEu(text, EU_PATTERN) ??
      matchEu(text, BARN_PATTERN) ??
      matchUsChild(text) ??
      matchUk(text) ??
      matchEu(text, BARE_NUMBER_PATTERN);

    if (match === null || !isValidEuSize(match.euSize)) return null;
    return new ChildShoeSize(match.euSize, match.system);
  }

  static parse(input: string): ChildShoeSize {
    const result = ChildShoeSize.tryParse(input);
    if (result === null) throw new Error("Invalid child shoe size.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return ChildShoeSize.tryParse(input) !== null;
  }

  /** Returns the canonical `EU 28` form. */
  static format(
    input: string | null | undefined,
    options?: ChildShoeSizeFormatOptions,
  ): string | null {
    const r = ChildShoeSize.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  /** Returns the canonical `EU 28` form, the same as {@link format} for this type. */
  static normalize(
    input: string | null | undefined,
    options?: ChildShoeSizeFormatOptions,
  ): string | null {
    const r = ChildShoeSize.tryParse(input);
    if (r !== null) return r.toNormalizedString();
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && ChildShoeSize.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ChildShoeSize | null | undefined): boolean {
    return other != null && this.euSize === other.euSize;
  }

  compareTo(other: ChildShoeSize | null | undefined): number {
    if (other == null) return 1;
    return this.euSize < other.euSize ? -1 : this.euSize > other.euSize ? 1 : 0;
  }
}

interface SizeMatch {
  readonly euSize: number;
  readonly system: ShoeSizeSystem;
}

function matchEu(text: string, pattern: RegExp): SizeMatch | null {
  const match = pattern.exec(text);
  if (match === null) return null;

  const value = parseDecimal(match[1]!);
  return value === null ? null : { euSize: value.toNumber(), system: ShoeSizeSystem.EU };
}

function matchUsChild(text: string): SizeMatch | null {
  const match = US_CHILD_PATTERN.exec(text);
  if (match === null) return null;

  const number = parseDecimal(match[1]!);
  if (number === null) return null;

  // The chart is keyed on the label as written, so `1.50C` is not the same key as `1.5C`.
  const euSize = US_TO_EU.get(number.toString() + match[2]!.toUpperCase());
  return euSize === undefined ? null : { euSize, system: ShoeSizeSystem.USMen };
}

function matchUk(text: string): SizeMatch | null {
  const match = UK_PATTERN.exec(text);
  if (match === null) return null;

  const uk = parseDecimal(match[1]!);
  if (uk === null) return null;

  const toddler = uk.toNumber() + UK_TODDLER_OFFSET;
  const youth = uk.toNumber() + UK_YOUTH_OFFSET;

  if (isValidEuSize(youth) && youth >= 33) return { euSize: youth, system: ShoeSizeSystem.UK };
  if (isValidEuSize(toddler) && toddler <= 32)
    return { euSize: toddler, system: ShoeSizeSystem.UK };
  return null;
}

function parseDecimal(text: string): Decimal | null {
  return Decimal.parse(text.replace(",", "."));
}

function isValidEuSize(euSize: number): boolean {
  return euSize >= 16 && euSize <= 39 && Number.isInteger(euSize * 2);
}

/** Half sizes fall between two chart rows, so their label is interpolated. */
function usLabelForEu(euSize: number): string {
  const exact = EU_TO_US.get(euSize);
  if (exact !== undefined) return exact;

  const lower = EU_TO_US.get(Math.trunc(euSize));
  const upper = EU_TO_US.get(Math.trunc(euSize) + 1);
  if (lower === undefined || upper === undefined) return "";

  const low = splitUsLabel(lower);
  const high = splitUsLabel(upper);
  if (low === null || high === null) return "";
  if (low.suffix !== high.suffix) return `${lower}/${upper}`;

  const midpoint = (low.number + high.number) / 2;
  return formatUsNumber(midpoint) + low.suffix;
}

function splitUsLabel(label: string): { number: number; suffix: string } | null {
  if (label.length < 2) return null;

  const suffix = label.charAt(label.length - 1).toUpperCase();
  if (suffix !== "C" && suffix !== "Y") return null;

  const number = parseDecimal(label.slice(0, -1));
  return number === null ? null : { number: number.toNumber(), suffix };
}

/**
 * Mirrors the .NET `"0.##"` format followed by a trim of trailing zeros and points, which also
 * clips the zero off whole tens — EU 27.5 reads back as `1C` rather than `10C`.
 */
function formatUsNumber(size: number): string {
  const rendered = Number.isInteger(size) ? String(size) : String(Number(size.toFixed(2)));
  return rendered.replace(/0+$/u, "").replace(/\.$/u, "");
}

function fallback(
  input: string | null | undefined,
  options?: ChildShoeSizeFormatOptions,
): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
