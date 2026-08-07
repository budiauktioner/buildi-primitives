import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { collapseWhitespace } from "../internal/input-sanitization.js";

const MAX_INPUT_LENGTH = 300;

const COMPANY_NAME_PATTERN = /^[\p{L}\d\s\-'&.,/:()+|"]+$/u;
const PIPE_SEPARATOR = /\s*\|+\s*/;

/** Registered name of a legal entity from any European jurisdiction. */
export class EuOrganizationName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "EU Organization Name",
    localizedName: "Europeiskt organisationsnamn",
    emoji: "\u{1F1EA}\u{1F1FA}",
    sources: Object.freeze([
      "https://ec.europa.eu/taxation_customs/vies/",
      "https://www.businessregisters.eu/",
    ]),
  });

  readonly value: string;
  readonly legalName: string;
  readonly tradeName: string | null;

  get hasTradeName(): boolean {
    return this.tradeName !== null;
  }

  private constructor(value: string, legal: string, trade: string | null) {
    this.value = value;
    this.legalName = legal;
    this.tradeName = trade;
  }

  static tryParse(input: string | null | undefined): EuOrganizationName | null {
    const normalized = collapseWhitespace(input);
    if (normalized.length === 0 || normalized.length > MAX_INPUT_LENGTH) return null;
    if (!validate(normalized)) return null;
    const [legal, trade] = splitLegalAndTrade(normalized);
    return new EuOrganizationName(normalized, legal, trade);
  }

  static parse(input: string): EuOrganizationName {
    const r = EuOrganizationName.tryParse(input);
    if (r === null) throw new Error("Invalid EU organization name.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return EuOrganizationName.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = EuOrganizationName.tryParse(input);
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
    return EuOrganizationName.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EuOrganizationName.normalize(input) === input;
  }

  static trySplitLegalAndTrade(
    input: string | null | undefined,
  ): { legalName: string; tradeName: string | null } | null {
    if (input == null || input.trim() === "") return null;
    const collapsed = collapseWhitespace(input);
    const [legal, trade] = splitLegalAndTrade(collapsed);
    return { legalName: legal, tradeName: trade };
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  equals(other: EuOrganizationName | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: EuOrganizationName | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/** Mask each organization-name token while preserving structural separators. */
export function maskEuOrganizationName(value: EuOrganizationName): string {
  return value.value.replace(/[\p{L}\d]+/gu, (part) => {
    if (part.length <= 1) return part;
    return part[0]! + "*".repeat(part.length - 1);
  });
}

function splitLegalAndTrade(collapsed: string): [string, string | null] {
  if (collapsed.indexOf("|") < 0) return [collapsed, null];
  const parts = collapsed.split(PIPE_SEPARATOR).filter((p) => p.length > 0);
  if (parts.length < 2) return [collapsed, null];
  return [parts[0]!, parts.slice(1).join(" | ")];
}

function validate(value: string): boolean {
  if (value.length < 2 || value.length > 200) return false;
  for (const c of value) {
    const code = c.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return false;
  }
  return COMPANY_NAME_PATTERN.test(value);
}
