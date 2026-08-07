import type { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Options shared by the string-in, string-out helpers. */
export interface SwedishVehicleStatusFormatOptions {
  /** Return the trimmed original input instead of `null` when the input is invalid. */
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

interface SwedishVehicleStatusDef {
  readonly value: string;
  readonly code: string;
  readonly englishName: string;
  readonly localizedName: string;
}

/** Swedish vehicle registration status (`fordonsstatus`) from Transportstyrelsen. */
export class SwedishVehicleStatus {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Vehicle Status",
    localizedName: "Fordonsstatus",
    emoji: "📋",
    sources: Object.freeze(["https://www.transportstyrelsen.se/"]),
  });

  readonly value: string;
  readonly code: string;
  readonly englishName: string;
  readonly localizedName: string;

  private constructor(def: SwedishVehicleStatusDef) {
    this.value = def.value;
    this.code = def.code;
    this.englishName = def.englishName;
    this.localizedName = def.localizedName;
  }

  static readonly InService = new SwedishVehicleStatus({
    value: "ITRAFIK",
    code: "ITRAFIK",
    englishName: "In service",
    localizedName: "I trafik",
  });

  static readonly Deregistered = new SwedishVehicleStatus({
    value: "AVST",
    code: "AVST",
    englishName: "Deregistered",
    localizedName: "Avställd",
  });

  static readonly Unregistered = new SwedishVehicleStatus({
    value: "AVREG",
    code: "AVREG",
    englishName: "Unregistered",
    localizedName: "Avregistrerad",
  });

  static readonly Stolen = new SwedishVehicleStatus({
    value: "STULEN",
    code: "STULEN",
    englishName: "Stolen",
    localizedName: "Stulen",
  });

  static readonly Exported = new SwedishVehicleStatus({
    value: "EXPORT",
    code: "EXPORT",
    englishName: "Exported",
    localizedName: "Exporterad",
  });

  static readonly Scrapped = new SwedishVehicleStatus({
    value: "SKROT",
    code: "SKROT",
    englishName: "Scrapped",
    localizedName: "Skrotad",
  });

  static readonly ReportedStolen = new SwedishVehicleStatus({
    value: "ANMSTULEN",
    code: "ANMSTULEN",
    englishName: "Reported stolen",
    localizedName: "Anmäld stulen",
  });

  /** All 7 values, in canonical order. */
  static get all(): readonly SwedishVehicleStatus[] {
    return ALL;
  }

  /** Resolves a value from its canonical name, localized name, code or any known alias. */
  static tryParse(input: string | null | undefined): SwedishVehicleStatus | null {
    if (input == null) return null;
    const key = normalizeLookupKey(sanitizeInput(input).trim());
    if (key.length === 0) return null;
    return LOOKUP.get(key) ?? null;
  }

  static parse(input: string): SwedishVehicleStatus {
    const result = SwedishVehicleStatus.tryParse(input);
    if (result === null) throw new Error(`Invalid vehicle status.`);
    return result;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishVehicleStatus.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: SwedishVehicleStatusFormatOptions,
  ): string | null {
    const r = SwedishVehicleStatus.tryParse(input);
    if (r !== null)
      return PrimitivesDefaults.useLocalizedDisplayNames ? r.localizedName : r.englishName;
    return fallback(input, options);
  }

  static normalize(
    input: string | null | undefined,
    options?: SwedishVehicleStatusFormatOptions,
  ): string | null {
    const r = SwedishVehicleStatus.tryParse(input);
    if (r !== null) return r.value;
    return fallback(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishVehicleStatus.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }

  toString(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  equals(other: SwedishVehicleStatus | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
}

const ALL: readonly SwedishVehicleStatus[] = [
  SwedishVehicleStatus.InService,
  SwedishVehicleStatus.Deregistered,
  SwedishVehicleStatus.Unregistered,
  SwedishVehicleStatus.Stolen,
  SwedishVehicleStatus.Exported,
  SwedishVehicleStatus.Scrapped,
  SwedishVehicleStatus.ReportedStolen,
];

function fallback(
  input: string | null | undefined,
  options?: SwedishVehicleStatusFormatOptions,
): string | null {
  if (!options?.fallbackToTrimmedInputWhenInvalid || input == null) return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const KEY_PATTERN = /\s+/g;

function normalizeLookupKey(value: string): string {
  let folded = value.trim().toLowerCase();
  folded = folded
    .replaceAll("å", "a")
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("é", "e");
  folded = folded.replaceAll("_", " ");
  folded = folded.replace(KEY_PATTERN, " ");
  return folded;
}

const ALIASES: readonly (readonly [SwedishVehicleStatus, readonly string[]])[] = [
  [
    SwedishVehicleStatus.InService,
    ["active", "i trafik", "in service", "in traffic", "itrafik", "pastalld", "registered"],
  ],
  [
    SwedishVehicleStatus.Deregistered,
    ["avst", "avstalld", "avstallning", "deregistered", "off road", "off-road"],
  ],
  [
    SwedishVehicleStatus.Unregistered,
    ["avreg", "avregistrerad", "permanently deregistered", "unregistered"],
  ],
  [SwedishVehicleStatus.Stolen, ["stolen", "stulen"]],
  [SwedishVehicleStatus.Exported, ["export", "exported", "exporterad"]],
  [SwedishVehicleStatus.Scrapped, ["scrapped", "skrot", "skrotad", "skrotning"]],
  [SwedishVehicleStatus.ReportedStolen, ["anmald stulen", "anmstulen", "reported stolen"]],
];

const LOOKUP = new Map<string, SwedishVehicleStatus>();
for (const [value, keys] of ALIASES) {
  for (const key of keys) if (!LOOKUP.has(key)) LOOKUP.set(key, value);
}
