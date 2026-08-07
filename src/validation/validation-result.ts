import { ValidationIssue } from "./validation-issue.js";
import { ValidationErrorReason } from "./validation-error-reason.js";

/**
 * The outcome of a `validate` call, carrying the original input, a validity
 * flag, and zero or more {@link ValidationIssue} entries that explain why the
 * input is invalid.
 */
export class ValidationResult {
  readonly rawInput: string | null;
  readonly isValid: boolean;
  readonly issues: readonly ValidationIssue[];

  /** @internal — use `validResult` / `invalidResult` factories. */
  constructor(
    rawInput: string | null | undefined,
    isValid: boolean,
    issues: readonly ValidationIssue[],
  ) {
    this.rawInput = rawInput ?? null;
    this.isValid = isValid;
    this.issues = Object.freeze([...issues]);
  }
}

/** @internal Factory for `validate` implementations. Not part of the public API. */
export function validResult(rawInput: string | null | undefined): ValidationResult {
  return new ValidationResult(rawInput, true, []);
}

/** @internal Factory for `validate` implementations. Not part of the public API. */
export function invalidResult(
  rawInput: string | null | undefined,
  reasonOrIssues: ValidationErrorReason | readonly ValidationIssue[],
  englishDescription?: string,
  localizedDescription?: string,
): ValidationResult {
  if (typeof reasonOrIssues === "string") {
    if (englishDescription === undefined || localizedDescription === undefined) {
      throw new Error("invalidResult requires both english and localized descriptions");
    }
    return new ValidationResult(rawInput, false, [
      new ValidationIssue(reasonOrIssues, englishDescription, localizedDescription),
    ]);
  }
  return new ValidationResult(rawInput, false, reasonOrIssues);
}
