import { afterEach, describe, expect, it } from "vitest";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";
import { Address, ContactAddress } from "../../src/contact/index.js";
import { SwedishOrganizationName } from "../../src/organization/index.js";
import { PersonFullName } from "../../src/person/index.js";

describe("ContactAddress", () => {
  afterEach(() => PrimitivesDefaults.reset());

  const address = () =>
    Address.tryParse({
      street: "Storgatan 12",
      zipCode: "114 53",
      city: "Stockholm",
      country: "SE",
    })!;

  it("create with all components sets all properties", () => {
    const person = PersonFullName.parse("Anna Andersson");
    const org = SwedishOrganizationName.parse("Budi AB");
    const contact = ContactAddress.create(person, org, address());

    expect(contact.hasPersonName).toBe(true);
    expect(contact.hasOrganizationName).toBe(true);
    expect(contact.hasAddress).toBe(true);
    expect(contact.personName?.value).toBe("Anna Andersson");
    expect(contact.organizationName?.value).toBe("Budi AB");
    expect(contact.address).not.toBeNull();
  });

  it("create accepts a single component and rejects empty contacts", () => {
    expect(ContactAddress.create(PersonFullName.parse("Anna Andersson")).hasPersonName).toBe(true);
    expect(
      ContactAddress.create(null, SwedishOrganizationName.parse("Budi AB")).hasOrganizationName,
    ).toBe(true);
    expect(ContactAddress.create(null, null, address()).hasAddress).toBe(true);
    expect(() => ContactAddress.create()).toThrow(
      "At least one of personName, organizationName, or address must be provided.",
    );
  });

  it("formats as display, English, native, and multiline strings", () => {
    const contact = ContactAddress.create(
      PersonFullName.parse("Anna Andersson"),
      SwedishOrganizationName.parse("Budi AB"),
      address(),
    );

    expect(contact.toString()).toContain("Anna Andersson");
    expect(contact.toString()).toContain("Budi AB");
    expect(contact.toString()).toContain("Storgatan 12");
    expect(contact.toString()).not.toContain("Sverige");
    expect(contact.toEnglishString()).toContain("Sweden");
    expect(contact.toNativeString()).toContain("Anna Andersson");

    const lines = contact.toMultilineString().split("\n");
    expect(lines[0]).toBe("Anna Andersson");
    expect(lines[1]).toBe("Budi AB");
    expect(lines[2]).toContain("Storgatan 12");
  });

  it("multiline string follows UI culture for address country", () => {
    PrimitivesDefaults.uiCulture = "en-US";
    const contact = ContactAddress.create(null, null, address());

    expect(contact.toMultilineString()).toContain("Sweden");
  });

  it("builder parses raw strings and free-text addresses", () => {
    const contact = ContactAddress.builder()
      .withPersonName("Anna Andersson")
      .withOrganizationName("Budi AB")
      .withAddress("Storgatan 12", "114 53", "Stockholm", "SE")
      .tryBuild();

    expect(contact?.personName?.value).toBe("Anna Andersson");
    expect(contact?.organizationName?.value).toBe("Budi AB");
    expect(contact?.address?.country?.alpha2Code).toBe("SE");

    const freeText = ContactAddress.builder()
      .withPersonName("Anna Andersson")
      .withAddress("Storgatan 12, 114 53 Stockholm")
      .tryBuild();
    expect(freeText?.address).not.toBeNull();
  });

  it("builder accepts parsed instances and ignores unparseable values", () => {
    const person = PersonFullName.parse("Anna Andersson");
    const org = SwedishOrganizationName.parse("Budi AB");
    const contact = ContactAddress.builder()
      .withPersonName(person)
      .withOrganizationName(org)
      .tryBuild();

    expect(contact?.personName).toBe(person);
    expect(contact?.organizationName).toBe(org);

    const partial = ContactAddress.builder()
      .withPersonName("")
      .withOrganizationName("Budi AB")
      .tryBuild();
    expect(partial?.personName).toBeNull();
    expect(partial?.organizationName?.value).toBe("Budi AB");
  });

  it("builder returns null or throws when empty", () => {
    expect(
      ContactAddress.builder()
        .withPersonName(null)
        .withOrganizationName(null)
        .withAddress(null)
        .tryBuild(),
    ).toBeNull();
    expect(() => ContactAddress.builder().build()).toThrow(
      "At least one of person name, organization name, or address must be provided.",
    );
  });

  it("supports non-Swedish contacts", () => {
    const contact = ContactAddress.builder()
      .withPersonName("José García")
      .withOrganizationName("López Trading")
      .withAddress("Calle Mayor 25", "28013", "Madrid", "ES")
      .build();

    expect(contact.personName?.value).toBe("José García");
    expect(contact.organizationName?.value).toBe("López Trading");
    expect(contact.address?.country?.alpha2Code).toBe("ES");
    expect(contact.toMultilineString()).toContain("Spanien");
  });
});
