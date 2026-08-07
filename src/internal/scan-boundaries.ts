/**
 * The Unicode-aware equivalent of a trailing `\b` for the scanner patterns.
 *
 * JavaScript's `\b` and `\w` are ASCII-only even under `/u`, so `24 m` inside
 * `24 månader` looks like a complete match. .NET's are Unicode-aware, and .NET
 * is the behavioural spec.
 *
 * Where a unit ends in a letter or digit — which is all of them but one —
 * `(?![\p{L}\p{N}_])` says the same thing, and the patterns use that directly.
 * This constant exists for the sound level `dB(A)` form, which ends in `)`. A
 * word boundary is a *transition*, not a plain lookahead: after a non-word
 * character it demands that the next character *be* a word character. That is
 * why .NET reads `69 dB(A) vid drift` as `69 dB` rather than `69 dB(A)`, and
 * the vectors generated from it expect exactly that.
 *
 * Internal; not re-exported publicly.
 */

const WORD = String.raw`[\p{L}\p{N}_]`;

export const WORD_BOUNDARY = String.raw`(?:(?<=${WORD})(?!${WORD})|(?<!${WORD})(?=${WORD}))`;
