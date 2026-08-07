import { PrimitivesDefaults } from "../primitives-defaults.js";
import { ValidationErrorReason } from "./validation-error-reason.js";

/**
 * A single validation problem detected during `validate`, carrying a
 * machine-readable {@link reason} and human-readable descriptions in English
 * and the current locale.
 */
export class ValidationIssue {
  readonly reason: ValidationErrorReason;
  readonly englishDescription: string;
  readonly localizedDescription: string;

  constructor(
    reason: ValidationErrorReason,
    englishDescription: string,
    localizedDescription: string,
  ) {
    this.reason = reason;
    this.englishDescription = englishDescription;
    this.localizedDescription = localizedDescription;
  }

  /**
   * Returns {@link localizedDescription} when
   * {@link PrimitivesDefaults.useLocalizedDisplayNames} is `true`, otherwise
   * {@link englishDescription}.
   */
  get description(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames
      ? this.localizedDescription
      : this.englishDescription;
  }
}
