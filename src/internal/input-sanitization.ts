/**
 * Shared input sanitization for text inputs across domain types.
 * Provides invisible-character stripping, whitespace normalization, and common
 * character-filtering helpers (digits-only, alphanumeric-only, collapse whitespace).
 *
 * Real-world inputs (e.g. from CRM/banking systems) commonly contain invisible
 * Unicode characters that break validation while being completely invisible in UIs
 * and logs. The most frequent offender is `U+202A` LEFT-TO-RIGHT EMBEDDING,
 * especially on values originating from RTL-language contexts (Arabic, Hebrew).
 * Other common contaminants include non-breaking spaces from web/PDF copy-paste,
 * null bytes from binary data, stray newlines from multi-line form fields,
 * and typographic (smart/curly) quotes from mobile keyboards and word processors.
 *
 * Equivalent of `Buildi.Primitives.InputSanitization` (internal in .NET).
 * Exposed via `internal/` and not re-exported from the public package entry.
 */

const FORMAT_OR_NOT_ASSIGNED = /[\p{Cf}\p{Cn}]/u;
const SPACE_SEPARATOR = /[\p{Zs}\p{Zl}\p{Zp}]/u;
const CONTROL = /\p{Cc}/u;

/**
 * Strips invisible/non-printable characters, normalizes all whitespace variants
 * to ASCII space (`U+0020`), normalizes typographic single quotes to ASCII
 * apostrophe (`'`), and normalizes typographic and guillemet double quotes to
 * ASCII quotation mark (`"`).
 */
export function sanitizeInput(input: string): string {
  let out = "";
  for (const c of input) {
    // Smart single quotes -> ASCII apostrophe.
    if (c === "\u2018" || c === "\u2019" || c === "\u201A" || c === "\u201B") {
      out += "'";
      continue;
    }
    // Smart and guillemet double quotes -> ASCII quotation mark.
    if (
      c === "\u201C" ||
      c === "\u201D" ||
      c === "\u201E" ||
      c === "\u201F" ||
      c === "\u00AB" ||
      c === "\u00BB"
    ) {
      out += '"';
      continue;
    }

    if (FORMAT_OR_NOT_ASSIGNED.test(c)) {
      // Drop format characters (Cf) and unassigned code points (Cn).
      continue;
    }

    if (CONTROL.test(c)) {
      if (c === "\t" || c === "\n" || c === "\r") out += " ";
      continue;
    }

    if (SPACE_SEPARATOR.test(c)) {
      out += " ";
      continue;
    }

    out += c;
  }
  return out;
}

const WHITESPACE_RUN = /\s+/g;

/**
 * Sanitizes the input, trims, and collapses whitespace runs to a single space.
 * Returns an empty string when `input` is `null` or `undefined`.
 */
export function collapseWhitespace(input: string | null | undefined): string {
  if (input == null) return "";
  return sanitizeInput(input).trim().replace(WHITESPACE_RUN, " ");
}

/** Keeps only ASCII digits (`0`-`9`), stripping everything else. */
export function keepDigits(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c >= 0x30 && c <= 0x39) out += input[i];
  }
  return out;
}

/**
 * Keeps only ASCII letters and digits, uppercasing letters.
 * Strips whitespace, hyphens, and all other non-alphanumeric characters.
 */
export function keepAsciiAlphanumericUppercase(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c >= 0x30 && c <= 0x39) out += input[i];
    else if (c >= 0x41 && c <= 0x5a) out += input[i];
    else if (c >= 0x61 && c <= 0x7a) out += String.fromCharCode(c - 32);
  }
  return out;
}
