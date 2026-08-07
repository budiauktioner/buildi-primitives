import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { foldOrdinalIgnoreCase } from "../internal/case-folding.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface DisplayPanelTypeFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface DisplayPanelTypeDef {
  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly family: string;
  readonly rank: number;
}

/**
 * The panel technology used in a display (`paneltyp`), e.g. `LCD`, `IPS`, `VA`, `OLED`,
 * `QLED`, `MicroLED`, `E-Ink`.
 */
export class DisplayPanelType {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Display Panel Type",
    localizedName: "Skärmpaneltyp",
    emoji: "🖥️",
    sources: Object.freeze([
      "https://en.wikipedia.org/wiki/Comparison_of_display_technology",
    ]),
  });

  readonly value: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly family: string;

  /** @internal Position in the canonical .NET ordering, used by {@link compareTo}. */
  private readonly rank: number;

  private constructor(def: DisplayPanelTypeDef) {
    this.value = def.value;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
    this.family = def.family;
    this.rank = def.rank;
  }

  static readonly Lcd = new DisplayPanelType({
    value: "LCD",
    englishName: "LCD",
    localizedName: "LCD",
    family: "LCD",
    rank: 4,
  });

  static readonly Tn = new DisplayPanelType({
    value: "TN",
    englishName: "TN (Twisted Nematic)",
    localizedName: "TN (Twisted Nematic)",
    family: "LCD",
    rank: 14,
  });

  static readonly Ips = new DisplayPanelType({
    value: "IPS",
    englishName: "IPS (In-Plane Switching)",
    localizedName: "IPS (In-Plane Switching)",
    family: "LCD",
    rank: 3,
  });

  static readonly Va = new DisplayPanelType({
    value: "VA",
    englishName: "VA (Vertical Alignment)",
    localizedName: "VA (Vertical Alignment)",
    family: "LCD",
    rank: 15,
  });

  static readonly Pls = new DisplayPanelType({
    value: "PLS",
    englishName: "PLS (Plane to Line Switching)",
    localizedName: "PLS (Plane to Line Switching)",
    family: "LCD",
    rank: 8,
  });

  static readonly Tft = new DisplayPanelType({
    value: "TFT",
    englishName: "TFT (Thin Film Transistor)",
    localizedName: "TFT (Thin Film Transistor)",
    family: "LCD",
    rank: 13,
  });

  static readonly Oled = new DisplayPanelType({
    value: "OLED",
    englishName: "OLED",
    localizedName: "OLED",
    family: "OLED",
    rank: 7,
  });

  static readonly Amoled = new DisplayPanelType({
    value: "AMOLED",
    englishName: "AMOLED",
    localizedName: "AMOLED",
    family: "OLED",
    rank: 0,
  });

  static readonly PmOled = new DisplayPanelType({
    value: "PMOLED",
    englishName: "PMOLED",
    localizedName: "PMOLED",
    family: "OLED",
    rank: 9,
  });

  static readonly Qled = new DisplayPanelType({
    value: "QLED",
    englishName: "QLED",
    localizedName: "QLED",
    family: "LCD",
    rank: 12,
  });

  static readonly QdOled = new DisplayPanelType({
    value: "QD-OLED",
    englishName: "QD-OLED",
    localizedName: "QD-OLED",
    family: "OLED",
    rank: 11,
  });

  static readonly MiniLed = new DisplayPanelType({
    value: "MiniLED",
    englishName: "MiniLED",
    localizedName: "MiniLED",
    family: "LCD",
    rank: 6,
  });

  static readonly MicroLed = new DisplayPanelType({
    value: "MicroLED",
    englishName: "MicroLED",
    localizedName: "MicroLED",
    family: "MicroLED",
    rank: 5,
  });

  static readonly Plasma = new DisplayPanelType({
    value: "Plasma",
    englishName: "Plasma",
    localizedName: "Plasma",
    family: "Plasma",
    rank: 10,
  });

  static readonly Crt = new DisplayPanelType({
    value: "CRT",
    englishName: "CRT (Cathode Ray Tube)",
    localizedName: "CRT (katodstrålerör)",
    family: "CRT",
    rank: 1,
  });

  static readonly EInk = new DisplayPanelType({
    value: "E-Ink",
    englishName: "E-Ink",
    localizedName: "E-Ink",
    family: "E-Ink",
    rank: 2,
  });

  /** All 16 values, in canonical order. */
  static get all(): readonly DisplayPanelType[] {
    return ALL;
  }

  /** Name in the language selected by {@link PrimitivesDefaults.uiCulture}. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedName
      : this.englishName;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): DisplayPanelType | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): DisplayPanelType {
    const result = DisplayPanelType.tryParse(input);
    if (result === null) throw new Error(`Invalid display panel type.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return DisplayPanelType.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: DisplayPanelTypeFormatOptions,
  ): string | null {
    const r = DisplayPanelType.tryParse(input);
    if (r !== null) return PrimitivesDefaults.useLocalizedDisplayNames
      ? r.localizedName
      : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: DisplayPanelTypeFormatOptions,
  ): string | null {
    const r = DisplayPanelType.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && DisplayPanelType.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedName
      : this.englishName;
  }

  toDisplayString(): string {
    return this.displayName;
  }

  toEnglishString(): string {
    return this.englishName;
  }

  toLocalString(): string {
    return this.localizedName;
  }

  equals(other: DisplayPanelType | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: DisplayPanelType | null | undefined): number {
    if (other == null) return 1;
    return this.rank < other.rank ? -1 : this.rank > other.rank ? 1 : 0;
  }
}

const ALL: readonly DisplayPanelType[] = [
  DisplayPanelType.Lcd,
  DisplayPanelType.Tn,
  DisplayPanelType.Ips,
  DisplayPanelType.Va,
  DisplayPanelType.Pls,
  DisplayPanelType.Tft,
  DisplayPanelType.Oled,
  DisplayPanelType.Amoled,
  DisplayPanelType.PmOled,
  DisplayPanelType.Qled,
  DisplayPanelType.QdOled,
  DisplayPanelType.MiniLed,
  DisplayPanelType.MicroLed,
  DisplayPanelType.Plasma,
  DisplayPanelType.Crt,
  DisplayPanelType.EInk,
];

function fallback(
  input: string | null | undefined,
  options?: DisplayPanelTypeFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /[\s\-_/()]+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded.replaceAll("å", "a").replaceAll("ä", "a").replaceAll("ö", "o");
  folded = folded.replace(KEY_PATTERN, "");
  return foldOrdinalIgnoreCase(folded);
}

const ALIASES: readonly (readonly [DisplayPanelType, readonly string[]])[] = [
  [
    DisplayPanelType.Lcd,
    ["flytandekristall", "lcd", "liquidcrystaldisplay"],
  ],
  [
    DisplayPanelType.Tn,
    ["tn", "tntwistednematic", "twistednematic"],
  ],
  [
    DisplayPanelType.Ips,
    ["inplaneswitching", "ips", "ipsinplaneswitching"],
  ],
  [
    DisplayPanelType.Va,
    ["mva", "pva", "va", "vaverticalalignment", "verticalalignment"],
  ],
  [
    DisplayPanelType.Pls,
    ["planetolineswitching", "pls", "plsplanetolineswitching"],
  ],
  [
    DisplayPanelType.Tft,
    ["tft", "tftthinfilmtransistor", "thinfilmtransistor"],
  ],
  [
    DisplayPanelType.Oled,
    ["oled", "organicled", "organiclightemittingdiode"],
  ],
  [
    DisplayPanelType.Amoled,
    ["activematrixoled", "amoled", "superamoled"],
  ],
  [
    DisplayPanelType.PmOled,
    ["passivematrixoled", "pmoled"],
  ],
  [
    DisplayPanelType.Qled,
    ["qled", "quantumdotled"],
  ],
  [
    DisplayPanelType.QdOled,
    ["qdoled", "quantumdotoled"],
  ],
  [
    DisplayPanelType.MiniLed,
    ["miniled"],
  ],
  [
    DisplayPanelType.MicroLed,
    ["microled", "uled", "µled"],
  ],
  [
    DisplayPanelType.Plasma,
    ["pdp", "plasma", "plasmaskarm"],
  ],
  [
    DisplayPanelType.Crt,
    ["bildror", "cathoderaytube", "crt", "crtcathoderaytube", "crtkatodstraleror", "katodstraleror"],
  ],
  [
    DisplayPanelType.EInk,
    ["eink", "electronicink", "electronicpaper", "elektronisktblack", "epaper"],
  ],
];

const LOOKUP = new Map<string, DisplayPanelType>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) {
    const folded = foldOrdinalIgnoreCase(key);
    if (!LOOKUP.has(folded)) LOOKUP.set(folded, value);
  }
}
