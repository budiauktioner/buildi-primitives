import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { SwedishOrganizationName } from "../organization/swedish-organization-name.js";
import { PersonFullName } from "../person/person-full-name.js";
import { Address } from "./address.js";

/** A contact address combining optional person name, organization name, and postal address. */
export class ContactAddress {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Contact Address",
    localizedName: "Kontaktuppgift",
    emoji: "\u{1F4EC}",
    sources: Object.freeze([]),
  });

  readonly personName: PersonFullName | null;
  readonly organizationName: SwedishOrganizationName | null;
  readonly address: Address | null;

  get hasPersonName(): boolean {
    return this.personName !== null;
  }

  get hasOrganizationName(): boolean {
    return this.organizationName !== null;
  }

  get hasAddress(): boolean {
    return this.address !== null;
  }

  private constructor(
    personName: PersonFullName | null,
    organizationName: SwedishOrganizationName | null,
    address: Address | null,
  ) {
    this.personName = personName;
    this.organizationName = organizationName;
    this.address = address;
  }

  static create(
    personName: PersonFullName | null = null,
    organizationName: SwedishOrganizationName | null = null,
    address: Address | null = null,
  ): ContactAddress {
    if (personName === null && organizationName === null && address === null) {
      throw new Error("At least one of personName, organizationName, or address must be provided.");
    }
    return new ContactAddress(personName, organizationName, address);
  }

  static builder(): ContactAddressBuilder {
    return new ContactAddressBuilder();
  }

  toMultilineString(): string {
    const lines: string[] = [];
    if (this.personName) lines.push(this.personName.value);
    if (this.organizationName) lines.push(this.organizationName.value);
    if (this.address) lines.push(this.address.toMultilineString());
    return lines.join("\n");
  }

  toDisplayString(): string {
    return this.buildSingleLine(!PrimitivesDefaults.useLocalizedDisplayNames);
  }

  toEnglishString(): string {
    return this.buildSingleLine(true);
  }

  toNativeString(): string {
    const parts = this.buildNameParts();
    if (this.address) parts.push(this.address.toNativeString());
    return parts.join(", ");
  }

  toString(): string {
    return this.toDisplayString();
  }

  private buildSingleLine(useEnglish: boolean): string {
    const parts = this.buildNameParts();
    if (this.address) {
      parts.push(useEnglish ? this.address.toEnglishString() : this.address.toDisplayString());
    }
    return parts.join(", ");
  }

  private buildNameParts(): string[] {
    const parts: string[] = [];
    if (this.personName) parts.push(this.personName.value);
    if (this.organizationName) parts.push(this.organizationName.value);
    return parts;
  }
}

/** Fluent builder for creating a ContactAddress from parsed instances or raw strings. */
export class ContactAddressBuilder {
  private personName: PersonFullName | null = null;
  private organizationName: SwedishOrganizationName | null = null;
  private address: Address | null = null;

  withPersonName(value: string | PersonFullName | null | undefined): ContactAddressBuilder {
    if (value instanceof PersonFullName) this.personName = value;
    else {
      const parsed = PersonFullName.tryParse(value);
      if (parsed) this.personName = parsed;
    }
    return this;
  }

  withOrganizationName(
    value: string | SwedishOrganizationName | null | undefined,
  ): ContactAddressBuilder {
    if (value instanceof SwedishOrganizationName) this.organizationName = value;
    else {
      const parsed = SwedishOrganizationName.tryParse(value);
      if (parsed) this.organizationName = parsed;
    }
    return this;
  }

  withAddress(value: string | Address | null | undefined): ContactAddressBuilder;
  withAddress(
    street: string | null | undefined,
    zipCode: string | null | undefined,
    city: string | null | undefined,
    country?: string | null,
  ): ContactAddressBuilder;
  withAddress(
    valueOrStreet: string | Address | null | undefined,
    zipCode?: string | null,
    city?: string | null,
    country?: string | null,
  ): ContactAddressBuilder {
    if (valueOrStreet instanceof Address) {
      this.address = valueOrStreet;
      return this;
    }

    const parsed =
      zipCode !== undefined || city !== undefined || country !== undefined
        ? Address.tryParse({ street: valueOrStreet, zipCode, city, country })
        : Address.tryParse(valueOrStreet);
    if (parsed) this.address = parsed;
    return this;
  }

  tryBuild(): ContactAddress | null {
    if (this.personName === null && this.organizationName === null && this.address === null) {
      return null;
    }
    return ContactAddress.create(this.personName, this.organizationName, this.address);
  }

  build(): ContactAddress {
    const result = this.tryBuild();
    if (result === null) {
      throw new Error(
        "At least one of person name, organization name, or address must be provided.",
      );
    }
    return result;
  }
}
