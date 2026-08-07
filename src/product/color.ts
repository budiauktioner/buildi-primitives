import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { maskColor } from "./product-masking.js";

/** Options shared by the string-in, string-out helpers. */
export interface ColorFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface NamedColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly english: string;
  readonly swedish: string;
}

/** The named colors accepted on input, in the order the .NET table lists them. */
const NAMED_COLORS: readonly NamedColor[] = [
  { r: 0xff, g: 0x00, b: 0x00, english: "red", swedish: "röd" },
  { r: 0x00, g: 0x00, b: 0xff, english: "blue", swedish: "blå" },
  { r: 0x00, g: 0x80, b: 0x00, english: "green", swedish: "grön" },
  { r: 0xff, g: 0xff, b: 0x00, english: "yellow", swedish: "gul" },
  { r: 0xff, g: 0xa5, b: 0x00, english: "orange", swedish: "orange" },
  { r: 0x80, g: 0x00, b: 0x80, english: "purple", swedish: "lila" },
  { r: 0xff, g: 0xc0, b: 0xcb, english: "pink", swedish: "rosa" },
  { r: 0x00, g: 0x00, b: 0x00, english: "black", swedish: "svart" },
  { r: 0xff, g: 0xff, b: 0xff, english: "white", swedish: "vit" },
  { r: 0x80, g: 0x80, b: 0x80, english: "gray", swedish: "grå" },
  { r: 0xa5, g: 0x2a, b: 0x2a, english: "brown", swedish: "brun" },
  { r: 0xff, g: 0xd7, b: 0x00, english: "gold", swedish: "guld" },
  { r: 0xc0, g: 0xc0, b: 0xc0, english: "silver", swedish: "silver" },
  { r: 0x00, g: 0x00, b: 0x80, english: "navy", swedish: "marinblå" },
  { r: 0x00, g: 0xff, b: 0xff, english: "cyan", swedish: "cyan" },
  { r: 0xff, g: 0x00, b: 0xff, english: "magenta", swedish: "magenta" },
  { r: 0x00, g: 0xff, b: 0x00, english: "lime", swedish: "lime" },
  { r: 0x80, g: 0x80, b: 0x00, english: "olive", swedish: "oliv" },
  { r: 0x80, g: 0x00, b: 0x00, english: "maroon", swedish: "rödbrun" },
  { r: 0x00, g: 0x80, b: 0x80, english: "teal", swedish: "blågrön" },
  { r: 0xff, g: 0x7f, b: 0x50, english: "coral", swedish: "korall" },
  { r: 0xfa, g: 0x80, b: 0x72, english: "salmon", swedish: "laxrosa" },
  { r: 0x40, g: 0xe0, b: 0xd0, english: "turquoise", swedish: "turkos" },
  { r: 0xee, g: 0x82, b: 0xee, english: "violet", swedish: "violett" },
  { r: 0x4b, g: 0x00, b: 0x82, english: "indigo", swedish: "indigo" },
  { r: 0xf5, g: 0xf5, b: 0xdc, english: "beige", swedish: "beige" },
  { r: 0xff, g: 0xff, b: 0xf0, english: "ivory", swedish: "elfenben" },
  { r: 0xf0, g: 0xe6, b: 0x8c, english: "khaki", swedish: "kaki" },
  { r: 0xe6, g: 0xe6, b: 0xfa, english: "lavender", swedish: "lavendel" },
  { r: 0xdc, g: 0x14, b: 0x3c, english: "crimson", swedish: "karmosinröd" },
  { r: 0x80, g: 0x80, b: 0x80, english: "grey", swedish: "grå" },
  { r: 0xff, g: 0x63, b: 0x47, english: "tomato", swedish: "tomat" },
  { r: 0xdd, g: 0xa0, b: 0xdd, english: "plum", swedish: "plommon" },
  { r: 0x80, g: 0x00, b: 0x20, english: "burgundy", swedish: "vinröd" },
];

/**
 * Brightness modifiers, longest first so that `ljusblå` takes the full `ljus` prefix before the
 * single-letter `l` abbreviation gets a chance. The one-letter `m` and `l` forms show up in
 * Swedish auction and inventory feeds, e.g. `Mgrå` or `Lgrön`.
 */
const COLOR_MODIFIERS: readonly (readonly [string, string, string, number])[] = [
  ["ljus", "ljus", "light", 0.4],
  ["mörk", "mörk", "dark", -0.4],
  ["blek", "blek", "pale", 0.55],
  ["light", "ljus", "light", 0.4],
  ["dark", "mörk", "dark", -0.4],
  ["pale", "blek", "pale", 0.55],
  ["l", "ljus", "light", 0.4],
  ["m", "mörk", "dark", -0.4],
];

const BY_NAME = new Map<string, NamedColor>();
const BY_RGB = new Map<string, NamedColor>();

for (const entry of NAMED_COLORS) {
  BY_NAME.set(foldOrdinalIgnoreCase(entry.english), entry);
  const swedishKey = foldOrdinalIgnoreCase(entry.swedish);
  if (swedishKey !== foldOrdinalIgnoreCase(entry.english)) BY_NAME.set(swedishKey, entry);

  const rgbKey = `${entry.r},${entry.g},${entry.b}`;
  if (!BY_RGB.has(rgbKey)) BY_RGB.set(rgbKey, entry);
}

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/u;
const RGB_PATTERN = /^\s*rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)\s*$/iu;
const HSL_PATTERN = /^\s*hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)\s*$/iu;
const SCAN_PATTERN = /(?<![0-9A-Fa-f#])#[0-9A-Fa-f]{3,6}(?![0-9A-Fa-f])/gu;

/**
 * An sRGB color (`färg`) parsed from hex, `rgb(...)`, `hsl(...)` or a CSS-style English or
 * Swedish name, including brightness-modified names such as `ljusblå` or `dark green`.
 */
export class Color {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Color",
    localizedName: "Färg",
    emoji: "🎨",
    sources: Object.freeze([
      "https://www.w3.org/TR/css-color-4/#named-colors",
      "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value",
    ]),
  });

  /** Red channel, 0–255. */
  readonly r: number;

  /** Green channel, 0–255. */
  readonly g: number;

  /** Blue channel, 0–255. */
  readonly b: number;

  /** English CSS-style name when the color matches a known one, otherwise `null`. */
  readonly nameEnglish: string | null;

  /** Swedish name when the color matches a known one, otherwise `null`. */
  readonly nameSwedish: string | null;

  private constructor(
    r: number,
    g: number,
    b: number,
    nameEnglish: string | null,
    nameSwedish: string | null,
  ) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.nameEnglish = nameEnglish;
    this.nameSwedish = nameSwedish;
  }

  /** Uppercase hexadecimal sRGB, e.g. `#FF0000`. */
  get hex(): string {
    return `#${hexByte(this.r)}${hexByte(this.g)}${hexByte(this.b)}`;
  }

  /** Hue 0–360, derived from the channels. */
  get h(): number {
    return rgbToHsl(this.r, this.g, this.b)[0];
  }

  /** Saturation 0–100 percent, derived from the channels. */
  get s(): number {
    return rgbToHsl(this.r, this.g, this.b)[1];
  }

  /** Lightness 0–100 percent, derived from the channels. */
  get l(): number {
    return rgbToHsl(this.r, this.g, this.b)[2];
  }

  static tryParse(input: string | null | undefined): Color | null {
    if (input == null || input.trim().length === 0) return null;

    const text = sanitizeInput(input).trim();

    const hex = HEX_PATTERN.exec(text);
    if (hex !== null) return Color.fromChannels(...expandHex(hex[1]!));

    const rgb = RGB_PATTERN.exec(text);
    if (rgb !== null) {
      const channels = [rgb[1]!, rgb[2]!, rgb[3]!].map((part) => Number(part));
      if (channels.some((channel) => channel > 255)) return null;
      return Color.fromChannels(channels[0]!, channels[1]!, channels[2]!);
    }

    const hsl = HSL_PATTERN.exec(text);
    if (hsl !== null) {
      const hue = Number(hsl[1]);
      const saturation = Number(hsl[2]);
      const lightness = Number(hsl[3]);
      if (saturation > 100 || lightness > 100) return null;
      return Color.fromChannels(...hslToRgb(((hue % 360) + 360) % 360, saturation, lightness));
    }

    const named = BY_NAME.get(foldOrdinalIgnoreCase(text));
    if (named !== undefined) {
      return new Color(named.r, named.g, named.b, named.english, named.swedish);
    }

    const shaded = tryShadeNamedColor(text);
    return shaded === null
      ? null
      : new Color(shaded.r, shaded.g, shaded.b, shaded.english, shaded.swedish);
  }

  /** Builds a color, attaching the known names when the channels match a named one. */
  private static fromChannels(r: number, g: number, b: number): Color {
    const named = BY_RGB.get(`${r},${g},${b}`);
    return new Color(r, g, b, named?.english ?? null, named?.swedish ?? null);
  }

  static parse(input: string): Color {
    const result = Color.tryParse(input);
    if (result === null) throw new Error("Invalid color.");
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return Color.tryParse(input) !== null;
  }

  /** Returns the English name when known, otherwise the uppercase hex, e.g. `red` or `#1A2B3C`. */
  static format(input: string | null | undefined, options?: ColorFormatOptions): string | null {
    const c = Color.tryParse(input);
    if (c !== null) return c.nameEnglish ?? c.hex;
    return fallback(input, options);
  }

  /** Returns the uppercase hex form, e.g. `#FF0000`. */
  static normalize(input: string | null | undefined, options?: ColorFormatOptions): string | null {
    const c = Color.tryParse(input);
    if (c !== null) return c.hex;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Color.normalize(input) === input;
  }

  /**
   * Scans unstructured text for hexadecimal color codes. Only the `#RGB` and `#RRGGBB` forms are
   * considered; named colors are far too ambiguous to match in prose.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<Color>[] {
    if (!text) return [];
    const out: TextCandidate<Color>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SCAN_PATTERN.exec(text)) !== null) {
      const value = Color.tryParse(match[0]);
      if (value === null) continue;
      out.push(
        new TextCandidate<Color>({
          startIndex: match.index,
          length: match[0].length,
          originalText: match[0],
          typeName: "Color",
          category: TextCandidateCategory.Product,
          normalizedForm: value.toNormalizedString(),
          formattedForm: value.toString(),
          maskedForm: maskColor(value),
          confidence: TextMatchConfidence.Medium,
          value,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.hex;
  }

  toString(): string {
    return this.nameEnglish ?? this.hex;
  }

  equals(other: Color | null | undefined): boolean {
    return other != null && this.r === other.r && this.g === other.g && this.b === other.b;
  }

  compareTo(other: Color | null | undefined): number {
    if (other == null) return 1;
    return this.hex < other.hex ? -1 : this.hex > other.hex ? 1 : 0;
  }
}

function hexByte(value: number): string {
  return value.toString(16).toUpperCase().padStart(2, "0");
}

function expandHex(hex: string): [number, number, number] {
  if (hex.length === 3) {
    return [expandNibble(hex[0]!), expandNibble(hex[1]!), expandNibble(hex[2]!)];
  }
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function expandNibble(character: string): number {
  const value = Number.parseInt(character, 16);
  return (value << 4) | value;
}

/** Resolves names such as `ljusblå` or `dark green` by shading the base color. */
function tryShadeNamedColor(input: string): NamedColor | null {
  for (const [prefix, swedishDisplay, englishDisplay, factor] of COLOR_MODIFIERS) {
    const base = tryExtractBaseColor(input, prefix);
    if (base === null) continue;

    const [r, g, b] = blendBrightness(base.r, base.g, base.b, factor);
    return {
      r,
      g,
      b,
      english: `${englishDisplay} ${base.english}`,
      swedish: `${swedishDisplay}${base.swedish}`,
    };
  }

  return null;
}

function tryExtractBaseColor(input: string, prefix: string): NamedColor | null {
  if (foldOrdinalIgnoreCase(input.slice(0, prefix.length)) !== foldOrdinalIgnoreCase(prefix)) {
    return null;
  }

  let rest = input.slice(prefix.length);
  if (rest.length > 0 && (rest[0] === " " || rest[0] === "-")) rest = rest.slice(1);

  return rest.length === 0 ? null : (BY_NAME.get(foldOrdinalIgnoreCase(rest)) ?? null);
}

/** Shades toward white for a positive factor and toward black for a negative one. */
function blendBrightness(
  r: number,
  g: number,
  b: number,
  factor: number,
): [number, number, number] {
  if (factor >= 0) {
    return [
      roundHalfEven(r + factor * (255 - r)),
      roundHalfEven(g + factor * (255 - g)),
      roundHalfEven(b + factor * (255 - b)),
    ];
  }

  const scale = 1 + factor;
  return [roundHalfEven(r * scale), roundHalfEven(g * scale), roundHalfEven(b * scale)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const lightness = (max + min) / 2;

  if (Math.abs(max - min) < 1e-9) return [0, 0, roundHalfEven(lightness * 100)];

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue: number;
  if (Math.abs(max - rN) < 1e-9) hue = ((gN - bN) / delta + (gN < bN ? 6 : 0)) / 6;
  else if (Math.abs(max - gN) < 1e-9) hue = ((bN - rN) / delta + 2) / 6;
  else hue = ((rN - gN) / delta + 4) / 6;

  let degrees = roundHalfEven(hue * 360) % 360;
  if (degrees < 0) degrees += 360;

  return [degrees, roundHalfEven(saturation * 100), roundHalfEven(lightness * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hN = h / 360;
  const sN = s / 100;
  const lN = l / 100;

  if (sN === 0) {
    const gray = roundHalfEven(lN * 255);
    return [gray, gray, gray];
  }

  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;

  return [
    roundHalfEven(hueToRgb(p, q, hN + 1 / 3) * 255),
    roundHalfEven(hueToRgb(p, q, hN) * 255),
    roundHalfEven(hueToRgb(p, q, hN - 1 / 3) * 255),
  ];
}

function hueToRgb(p: number, q: number, tRaw: number): number {
  let t = tRaw;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 0.5) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/** .NET rounds doubles to even on a tie, where JavaScript's `Math.round` goes up. */
function roundHalfEven(value: number): number {
  const floor = Math.floor(value);
  const remainder = value - floor;
  if (Math.abs(remainder - 0.5) > Number.EPSILON) return Math.round(value);
  return floor % 2 === 0 ? floor : floor + 1;
}

function fallback(input: string | null | undefined, options?: ColorFormatOptions): string | null {
  if (options?.fallbackToTrimmedInputWhenInvalid !== true || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}
