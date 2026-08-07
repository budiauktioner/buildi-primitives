import { describe, expect, it } from "vitest";
import { defaultTextScanner } from "../../src/text-scanning/index.js";

// This file must import the text-scanning entry and nothing else. Importing the
// package root would register the scanners too and mask a regression here.
describe("text-scanning entry point", () => {
  it("registers the built-in scanners without the package root being imported", () => {
    expect(defaultTextScanner.registered.length).toBeGreaterThan(0);
  });

  it("finds candidates when only the text-scanning entry is imported", () => {
    const result = defaultTextScanner.scan("Kontakta info@example.com eller org 559246-0421.");

    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.emails.map((c) => c.normalizedForm)).toContain("info@example.com");
    expect(result.organizationNumbers.map((c) => c.normalizedForm)).toContain("165592460421");
  });
});
