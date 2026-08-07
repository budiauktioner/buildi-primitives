import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { collapseWhitespace } from "../internal/input-sanitization.js";
import { PersonFullName } from "../person/person-full-name.js";
import { SwedishOrganizationName } from "../organization/swedish-organization-name.js";

/** The type of bank account holder. */
export const BankAccountHolderType = {
  Unknown: "Unknown",
  Person: "Person",
  Organization: "Organization",
} as const;
export type BankAccountHolderType =
  (typeof BankAccountHolderType)[keyof typeof BankAccountHolderType];

/**
 * A Swedish bank account holder name (`kontoinnehavare`).
 * Detects whether the holder is a person or an organization based on
 * `SwedishOrganizationName.hasOrganizationIndicators`.
 */
export class SwedishBankAccountHolderName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Account Holder Name",
    localizedName: "Kontoinnehavare",
    emoji: "\u{1F464}",
    sources: Object.freeze([]),
  });

  readonly value: string;
  readonly holderType: BankAccountHolderType;
  readonly personName: PersonFullName | null;
  readonly organizationName: SwedishOrganizationName | null;

  private constructor(
    value: string,
    holderType: BankAccountHolderType,
    personName: PersonFullName | null,
    organizationName: SwedishOrganizationName | null,
  ) {
    this.value = value;
    this.holderType = holderType;
    this.personName = personName;
    this.organizationName = organizationName;
  }

  static tryParse(input: string | null | undefined): SwedishBankAccountHolderName | null {
    if (input == null || input.trim() === "") return null;
    const collapsed = collapseWhitespace(input);
    if (collapsed.length < 2) return null;
    if (!/\p{L}/u.test(collapsed)) return null;

    const orgName = SwedishOrganizationName.tryParse(collapsed);
    if (orgName !== null && orgName.hasOrganizationIndicators) {
      return new SwedishBankAccountHolderName(
        collapsed,
        BankAccountHolderType.Organization,
        null,
        orgName,
      );
    }

    const personName = PersonFullName.tryParse(collapsed);
    if (personName !== null) {
      return new SwedishBankAccountHolderName(
        collapsed,
        BankAccountHolderType.Person,
        personName,
        null,
      );
    }

    if (orgName !== null) {
      return new SwedishBankAccountHolderName(
        collapsed,
        BankAccountHolderType.Organization,
        null,
        orgName,
      );
    }

    return null;
  }

  static parse(input: string): SwedishBankAccountHolderName {
    const r = SwedishBankAccountHolderName.tryParse(input);
    if (r === null) throw new Error("Invalid bank account holder name.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishBankAccountHolderName.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishBankAccountHolderName.tryParse(input);
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
    return SwedishBankAccountHolderName.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishBankAccountHolderName.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }

  equals(other: SwedishBankAccountHolderName | null | undefined): boolean {
    return other != null && this.value.toLowerCase() === other.value.toLowerCase();
  }
  compareTo(other: SwedishBankAccountHolderName | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

/**
 * Returns a masked account holder name where each word's first character is preserved
 * and the rest is masked, e.g. `Anna Andersson` → `A*** A********`.
 */
export function maskSwedishBankAccountHolderName(holder: SwedishBankAccountHolderName): string {
  const parts = holder.value.split(/\s+/).filter((p) => p.length > 0);
  return parts.map((p) => (p.length <= 1 ? "*" : p[0] + "*".repeat(p.length - 1))).join(" ");
}
