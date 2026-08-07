import { describe, expect, it } from "vitest";
import {
  PersonAge,
  PersonFamilyName,
  PersonFullName,
  PersonGivenName,
  SwedishCoordinationNumber,
  SwedishPersonalIdentityNumber,
  maskCoordinationNumber,
  maskFamilyName,
  maskFullName,
  maskGivenName,
  maskPersonAge,
  maskPersonalIdentityNumber,
} from "../../src/person/index.js";

describe("person masking", () => {
  it.each([
    ["990807-2391", false, "990807-****"],
    ["199908072391", false, "990807-****"],
    ["990807-2391", true, "******-****"],
    ["199908072391", true, "******-****"],
  ])("masks personal identity number %s", (input, maskBirthDate, expected) => {
    const pin = SwedishPersonalIdentityNumber.parse(input);
    expect(maskPersonalIdentityNumber(pin, { maskBirthDate })).toBe(expected);
  });

  it.each([
    ["199908672398", false, "990867-****"],
    ["990867-2398", false, "990867-****"],
    ["199908672398", true, "******-****"],
    ["990867-2398", true, "******-****"],
  ])("masks coordination number %s", (input, maskBirthDate, expected) => {
    const cn = SwedishCoordinationNumber.parse(input);
    expect(maskCoordinationNumber(cn, { maskBirthDate })).toBe(expected);
  });

  it.each([
    ["Anna Maria", "*** ***"],
    ["Peter", "***"],
    ["Karl Johan Erik", "*** *** ***"],
  ])("masks given names by default", (input, expected) => {
    expect(maskGivenName(PersonGivenName.parse(input))).toBe(expected);
  });

  it.each([
    ["Anna Maria", "A. M."],
    ["Peter", "P."],
    ["Karl Johan Erik", "K. J. E."],
  ])("masks given names as initials", (input, expected) => {
    expect(maskGivenName(PersonGivenName.parse(input), { useInitials: true })).toBe(expected);
  });

  it.each([
    ["Andersson", "***"],
    ["von Essen", "***"],
  ])("masks family names by default", (input, expected) => {
    expect(maskFamilyName(PersonFamilyName.parse(input))).toBe(expected);
  });

  it.each([
    ["Andersson", "A."],
    ["von Essen", "v."],
  ])("masks family names as initials", (input, expected) => {
    expect(maskFamilyName(PersonFamilyName.parse(input), { useInitials: true })).toBe(expected);
  });

  it.each([
    ["Anna Andersson", "*** ***"],
    ["Anna Maria Andersson", "*** *** ***"],
    ["Peter Andersson", "*** ***"],
  ])("masks full names by default", (input, expected) => {
    expect(maskFullName(PersonFullName.parse(input))).toBe(expected);
  });

  it.each([
    ["Anna Andersson", "A. A."],
    ["Anna Maria Andersson", "A. M. A."],
    ["Peter Andersson", "P. A."],
  ])("masks full names as initials", (input, expected) => {
    expect(maskFullName(PersonFullName.parse(input), { useInitials: true })).toBe(expected);
  });

  it.each([
    ["Anna Andersson", false, "Anna ***"],
    ["Anna Maria Andersson", false, "Anna Maria ***"],
    ["Anna Andersson", true, "Anna A."],
    ["Anna Maria Andersson", true, "Anna Maria A."],
  ])("can show given names while masking full names", (input, useInitials, expected) => {
    expect(maskFullName(PersonFullName.parse(input), { showGivenName: true, useInitials })).toBe(
      expected,
    );
  });

  it.each([
    [5, "* år"],
    [42, "** år"],
    [104, "*** år"],
  ])("masks an age to its magnitude", (years, expected) => {
    expect(maskPersonAge(PersonAge.fromYears(years))).toBe(expected);
  });
});
