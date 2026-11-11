import { describe, expect, it } from "vitest";
import { SwedishOrganizationNumber } from "../../src/organization/index.js";
import {
  SwedishCoordinationNumber,
  SwedishPersonalIdentityNumber,
} from "../../src/person/index.js";
import cases from "./personal-number-parity-cases.json" with { type: "json" };

/**
 * Runs the case file the .NET suite also runs, so the two ports accept and reject the
 * same personnummer, samordningsnummer and person-based organisationsnummer inputs.
 * The file is a verbatim copy of the .NET test project's
 * `Person/personal-number-parity-cases.json`; change both together.
 */

interface ParityType {
  normalize(input: string): string | null;
  isValid(input: string): boolean;
  validate(input: string): { isValid: boolean };
  tryParse(input: string): { toNormalizedString(): string } | null;
  parse(input: string): { toNormalizedString(): string };
}

const types: Record<string, ParityType> = {
  SwedishPersonalIdentityNumber,
  SwedishCoordinationNumber,
  SwedishOrganizationNumber,
};

describe("personal number parity cases shared with .NET", () => {
  it.each(cases.cases)("$type $input", ({ type, input, normalized }) => {
    const t = types[type];
    if (!t) throw new Error(`Unknown type '${type}' in personal-number-parity-cases.json.`);

    expect(t.normalize(input)).toBe(normalized);
    expect(t.isValid(input)).toBe(normalized !== null);
    expect(t.validate(input).isValid).toBe(normalized !== null);
    expect(t.tryParse(input)?.toNormalizedString() ?? null).toBe(normalized);
    if (normalized === null) expect(() => t.parse(input)).toThrow();
    else expect(t.parse(input).toNormalizedString()).toBe(normalized);
  });
});
