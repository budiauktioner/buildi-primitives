import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { collapseWhitespace } from "../internal/input-sanitization.js";
import { nameContains, nameContainsStandalone } from "./organization-validation-utils.js";
import { SwedishOrganizationType } from "./swedish-organization-type.js";

const MAX_INPUT_LENGTH = 300;

/** Pattern matching strict Swedish company-name characters (Bolagsverket). */
const COMPANY_NAME_PATTERN = /^[\p{L}\d\s\-'&.,/:()+]+$/u;

const ORG_SUFFIX_TOKENS: readonly string[] = ["AB", "HB", "KB", "BRF", "HSB", "EF"];
const ORG_SUFFIX_PHRASES: readonly string[] = [
  " EK.FÖR.",
  " EK FÖR",
  " EKONOMISK FÖRENING",
  " IDEELL FÖRENING",
  " SAMFÄLLIGHETSFÖRENING",
  " RIKSFÖRBUND",
];
const ORG_PREFIXES: readonly string[] = ["STIFTELSEN ", "BRF ", "HSB "];
const ORG_KEYWORDS: readonly string[] = [
  " KOMMUN",
  " REGION",
  " LANDSTING",
  " MYNDIGHET",
  " STIFTELSE",
  " FÖRENING",
];

const KNOWN_ABBREVIATIONS = new Set(["AB", "HB", "KB", "BRF", "HSB", "EF"]);

const KNOWN_GOVERNMENT_AGENCIES: ReadonlySet<string> = new Set([
  "SKATTEVERKET",
  "TULLVERKET",
  "KRONOFOGDEN",
  "STATISTISKA CENTRALBYRÅN",
  "KRIMINALVÅRDEN",
  "MIGRATIONSVERKET",
  "DOMSTOLSVERKET",
  "BROTTSFÖREBYGGANDE RÅDET",
  "FÖRSÄKRINGSKASSAN",
  "SOCIALSTYRELSEN",
  "SKOLVERKET",
  "CENTRALA STUDIESTÖDSNÄMNDEN",
  "UNIVERSITETS- OCH HÖGSKOLERÅDET",
  "BOLAGSVERKET",
  "TRAFIKVERKET",
  "TRANSPORTSTYRELSEN",
  "TILLVÄXTVERKET",
  "PATENT- OCH REGISTRERINGSVERKET",
  "ARBETSFÖRMEDLINGEN",
  "ARBETSMILJÖVERKET",
  "NATURVÅRDSVERKET",
  "FÖRSVARSMAKTEN",
  "POST- OCH TELESTYRELSEN",
  "SJÖFARTSVERKET",
  "RIKSBANKEN",
  "RIKSREVISIONEN",
  "RIKSGÄLDEN",
  "RIKSGÄLDSKONTORET",
  "EKONOMISTYRNINGSVERKET",
  "JORDBRUKSVERKET",
  "LIVSMEDELSVERKET",
  "LANTMÄTERIET",
  "BOVERKET",
  "KONSUMENTVERKET",
  "RIKSARKIVET",
  "KUNGLIGA BIBLIOTEKET",
  "KEMIKALIEINSPEKTIONEN",
  "INTEGRITETSSKYDDSMYNDIGHETEN",
  "ELSÄKERHETSVERKET",
  "HAVS- OCH VATTENMYNDIGHETEN",
  "SKOGSSTYRELSEN",
  "VALMYNDIGHETEN",
  "LÄNSSTYRELSEN",
  "DATAINSPEKTIONEN",
  "KONKURRENSVERKET",
  "UPPHANDLINGSMYNDIGHETEN",
]);

/** A Swedish organization name (`organisationsnamn` / `företagsnamn`). */
export class SwedishOrganizationName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Organization Name",
    localizedName: "Organisationsnamn",
    emoji: "\u{1F3F7}\uFE0F",
    sources: Object.freeze(["https://bolagsverket.se"]),
  });

  readonly value: string;
  readonly casingNormalizedValue: string;
  readonly hasOrganizationIndicators: boolean;
  readonly inferredSwedishOrganizationType: SwedishOrganizationType;

  private constructor(
    value: string,
    casingNormalized: string,
    hasIndicators: boolean,
    inferredType: SwedishOrganizationType,
  ) {
    this.value = value;
    this.casingNormalizedValue = casingNormalized;
    this.hasOrganizationIndicators = hasIndicators;
    this.inferredSwedishOrganizationType = inferredType;
  }

  static tryParse(input: string | null | undefined): SwedishOrganizationName | null {
    const normalized = collapseWhitespace(input);
    if (normalized.length === 0 || normalized.length > MAX_INPUT_LENGTH) return null;
    if (!validateName(normalized)) return null;

    const forInference = stripPublSuffix(normalized);
    const hasIndicators = detectOrganizationIndicators(forInference);
    const inferred = inferTypeFromName(forInference);
    const casing = SwedishOrganizationName.normalizeCasing(normalized);
    return new SwedishOrganizationName(normalized, casing, hasIndicators, inferred);
  }

  static parse(input: string): SwedishOrganizationName {
    const r = SwedishOrganizationName.tryParse(input);
    if (r === null) throw new Error("Invalid organization name.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishOrganizationName.tryParse(input) !== null;
  }

  static isKnownGovernmentAgency(name: string | null | undefined): boolean {
    if (name == null || name.trim() === "") return false;
    return KNOWN_GOVERNMENT_AGENCIES.has(collapseWhitespace(name).toUpperCase());
  }

  static inferSwedishOrganizationType(name: string | null | undefined): SwedishOrganizationType {
    if (name == null || name.trim() === "") return SwedishOrganizationType.Unknown;
    return inferTypeFromName(stripPublSuffix(collapseWhitespace(name)));
  }

  static normalizeCasing(name: string): string {
    const letters = [...name].filter((c) => /\p{L}/u.test(c));
    if (letters.length === 0) return name;
    const allLower = letters.every((c) => c === c.toLowerCase());
    const allUpper = letters.every((c) => c === c.toUpperCase());
    if (!allLower && !allUpper) return name;

    return name
      .split(" ")
      .map((w) => (KNOWN_ABBREVIATIONS.has(w.toUpperCase()) ? w.toUpperCase() : capitalizeWord(w)))
      .join(" ");
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishOrganizationName.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return SwedishOrganizationName.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishOrganizationName.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  equals(other: SwedishOrganizationName | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: SwedishOrganizationName | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function stripPublSuffix(name: string): string {
  const trimmed = name.trimEnd();
  if (trimmed.toUpperCase().endsWith("(PUBL)")) return trimmed.slice(0, -6).trimEnd();
  return name;
}

function validateName(value: string): boolean {
  if (value.length < 2 || value.length > 200) return false;
  for (const c of value) {
    const code = c.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return false;
  }
  return COMPANY_NAME_PATTERN.test(value);
}

function detectOrganizationIndicators(collapsed: string): boolean {
  const upper = collapsed.toUpperCase();
  if (!upper) return false;
  const words = upper.split(" ");
  if (words.length > 0 && ORG_SUFFIX_TOKENS.includes(words[words.length - 1]!)) return true;
  for (const p of ORG_SUFFIX_PHRASES) if (upper.endsWith(p)) return true;
  for (const p of ORG_PREFIXES) if (upper.startsWith(p)) return true;
  for (const k of ORG_KEYWORDS) if (upper.indexOf(k) >= 0) return true;
  if (KNOWN_GOVERNMENT_AGENCIES.has(upper)) return true;
  return false;
}

function inferTypeFromName(collapsed: string): SwedishOrganizationType {
  const upper = collapsed.toUpperCase();
  if (!upper) return SwedishOrganizationType.Unknown;

  const words = upper.split(" ");
  const lastWord = words.length > 0 ? words[words.length - 1]! : "";

  if (lastWord === "AB") return SwedishOrganizationType.Aktiebolag;
  if (lastWord === "KB" || nameContains(upper, "KOMMANDITBOLAG"))
    return SwedishOrganizationType.Kommanditbolag;
  if (lastWord === "HB" || nameContains(upper, "HANDELSBOLAG"))
    return SwedishOrganizationType.Handelsbolag;

  if (
    nameContainsStandalone(upper, "BRF") ||
    nameContains(upper, "BOSTADSRÄTTSFÖRENING", "BOSTADSRATTSFORENING")
  )
    return SwedishOrganizationType.Bostadsrattsforening;

  if (
    nameContains(
      upper,
      "SAMFÄLLIGHETSFÖRENING",
      "SAMFALLIGHETSFORENING",
      "SAMFALLIGHETSSFORENING",
      "SAMFÄLLIGHET",
      "SAMFALLIGHET",
    )
  )
    return SwedishOrganizationType.Samfallighetsforening;

  if (lastWord === "HSB" || upper.startsWith("HSB "))
    return SwedishOrganizationType.EkonomiskForening;

  if (
    upper.endsWith(" EK.FÖR.") ||
    upper.endsWith(" EK FÖR") ||
    nameContains(upper, "EKONOMISK FÖRENING")
  )
    return SwedishOrganizationType.EkonomiskForening;

  if (nameContains(upper, "IDEELL FÖRENING")) return SwedishOrganizationType.IdeellForening;

  if (upper.startsWith("STIFTELSEN ") || nameContains(upper, "STIFTELSE"))
    return SwedishOrganizationType.Stiftelse;

  if (nameContains(upper, "KOMMUN")) return SwedishOrganizationType.Kommun;
  if (nameContains(upper, "REGION", "LANDSTING")) return SwedishOrganizationType.Region;
  if (nameContains(upper, "FÖRSAMLING", "FORSAMLING")) return SwedishOrganizationType.Forsamling;
  if (nameContains(upper, "MYNDIGHET")) return SwedishOrganizationType.OffentligSektor;
  if (KNOWN_GOVERNMENT_AGENCIES.has(upper)) return SwedishOrganizationType.OffentligSektor;
  if (nameContains(upper, "DÖDSBO", "DODSBO")) return SwedishOrganizationType.Dodsbo;

  if (lastWord === "EF" || nameContains(upper, "ENSKILD FIRMA"))
    return SwedishOrganizationType.EnskildFirma;
  if (nameContains(upper, "PRIVATPERSON")) return SwedishOrganizationType.Privatperson;

  if (nameContainsStandalone(upper, "EUROPABOLAG", "SE-BOLAG"))
    return SwedishOrganizationType.Europabolag;
  if (nameContainsStandalone(upper, "EUROPEISK EKONOMISK INTRESSEGRUPPERING", "EEIG"))
    return SwedishOrganizationType.EuropeiskEkonomiskIntressegruppering;
  if (nameContainsStandalone(upper, "SCE") || nameContains(upper, "EUROPEISK KOOPERATIV FÖRENING"))
    return SwedishOrganizationType.SCEForening;
  if (nameContainsStandalone(upper, "FILIAL")) return SwedishOrganizationType.Filial;

  if (nameContains(upper, "RIKSFÖRBUND", "FÖRENING")) return SwedishOrganizationType.IdeellForening;

  return SwedishOrganizationType.Unknown;
}

/** Mask an organization name, keeping only the first letter of each word, e.g. `Volvo AB` -> `V**** A*`. */
export function maskSwedishOrganizationName(value: SwedishOrganizationName): string {
  return value.value
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => (part.length <= 1 ? "*" : part[0]! + "*".repeat(part.length - 1)))
    .join(" ");
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  const lowered = word.toLocaleLowerCase("sv-SE");
  return lowered[0]!.toLocaleUpperCase("sv-SE") + lowered.slice(1);
}
