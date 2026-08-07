import { afterEach, describe, expect, it } from "vitest";
import { invalidResult, validResult } from "../../src/validation/validation-result.js";
import { ValidationErrorReason } from "../../src/validation/validation-error-reason.js";
import { ValidationIssue } from "../../src/validation/validation-issue.js";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";

afterEach(() => PrimitivesDefaults.reset());

describe("ValidationResult", () => {
  it("validResult is valid and has no issues", () => {
    const r = validResult("input");
    expect(r.isValid).toBe(true);
    expect(r.rawInput).toBe("input");
    expect(r.issues.length).toBe(0);
  });

  it("invalidResult with single reason produces one issue", () => {
    const r = invalidResult("x", ValidationErrorReason.InputIsEmpty, "empty", "tomt");
    expect(r.isValid).toBe(false);
    expect(r.issues.length).toBe(1);
    expect(r.issues[0]!.reason).toBe(ValidationErrorReason.InputIsEmpty);
    expect(r.issues[0]!.englishDescription).toBe("empty");
    expect(r.issues[0]!.localizedDescription).toBe("tomt");
  });

  it("invalidResult with list of issues preserves order", () => {
    const issues = [
      new ValidationIssue(ValidationErrorReason.InvalidLength, "len", "längd"),
      new ValidationIssue(ValidationErrorReason.InvalidCharacters, "chars", "tecken"),
    ];
    const r = invalidResult("x", issues);
    expect(r.issues.length).toBe(2);
    expect(r.issues[0]!.reason).toBe(ValidationErrorReason.InvalidLength);
    expect(r.issues[1]!.reason).toBe(ValidationErrorReason.InvalidCharacters);
  });

  it("invalidResult throws when reason is given without descriptions", () => {
    expect(() => invalidResult("x", ValidationErrorReason.InvalidFormat)).toThrow();
  });

  it("ValidationIssue.description follows PrimitivesDefaults.uiCulture", () => {
    const issue = new ValidationIssue(ValidationErrorReason.InputIsEmpty, "english", "swedish");
    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(issue.description).toBe("swedish");
    PrimitivesDefaults.uiCulture = "en-US";
    expect(issue.description).toBe("english");
  });

  it("issues collection is frozen", () => {
    const r = validResult(null);
    expect(() => (r.issues as unknown as ValidationIssue[]).push({} as ValidationIssue)).toThrow();
  });
});
