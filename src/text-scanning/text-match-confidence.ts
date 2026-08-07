/**
 * Indicates the confidence level of a candidate found by text scanning.
 * Higher confidence means stronger structural evidence, but no level guarantees
 * the absence of false positives.
 */
export const TextMatchConfidence = {
  /**
   * Pattern match only. High false-positive risk — the matched text merely
   * fits a syntactic pattern (e.g. a run of digits that happens to be the
   * right length).
   */
  Low: 0,
  /**
   * Structural match with partial validation — the format is correct but no
   * checksum or strong distinguishing feature confirms the match.
   */
  Medium: 1,
  /**
   * Strong match with checksum or format-specific validation (e.g. a personal
   * identity number with a valid Luhn check digit and plausible date, or an
   * IBAN with valid MOD-97).
   */
  High: 2,
} as const;

export type TextMatchConfidence = (typeof TextMatchConfidence)[keyof typeof TextMatchConfidence];
