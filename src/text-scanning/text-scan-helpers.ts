/**
 * Shared helpers for scanning unstructured text around anchor positions.
 * Equivalent of `Buildi.Primitives.TextScanning.TextScanHelpers` (internal).
 */

/**
 * Scans forward from `fromIndex`, returning the end position of a plausible
 * text span. Stops at sentence-ending punctuation (`.`, `!`, `?`), double
 * newline, or `maxDistance` characters. A trailing comma followed by an
 * uppercase word (e.g. a country name) is included before stopping.
 */
export function scanForward(text: string, fromIndex: number, maxDistance: number): number {
  const limit = Math.min(text.length, fromIndex + maxDistance);
  let i = fromIndex;
  while (i < limit && text[i] === " ") i++;

  while (i < limit) {
    const ch = text[i]!;
    if (ch === "." || ch === "!" || ch === "?") break;
    if (ch === "\n" && i + 1 < text.length && text[i + 1] === "\n") break;

    if (ch === ",") {
      let afterComma = i + 1;
      while (afterComma < limit && text[afterComma] === " ") afterComma++;
      if (afterComma < limit && isUpperLetter(text[afterComma]!)) {
        let wordEnd = afterComma;
        while (wordEnd < limit && (isLetter(text[wordEnd]!) || text[wordEnd] === " ")) {
          wordEnd++;
        }
        i = wordEnd;
      }
      break;
    }

    i++;
  }

  return i;
}

/**
 * Scans backward from `fromIndex`, returning the start position of a
 * plausible text span. Stops at sentence-ending punctuation, double newline,
 * or `maxDistance` characters. Leading whitespace is skipped.
 */
export function scanBackward(text: string, fromIndex: number, maxDistance: number): number {
  const limit = Math.max(0, fromIndex - maxDistance);
  let i = fromIndex - 1;

  while (i >= limit) {
    const ch = text[i]!;
    if (ch === "." || ch === "!" || ch === "?") {
      i++;
      break;
    }
    if (ch === "\n" && i > 0 && text[i - 1] === "\n") {
      i++;
      break;
    }
    i--;
  }

  if (i < limit) i = limit;
  while (i < fromIndex && text[i] === " ") i++;

  return i;
}

/**
 * Returns `true` when `index` is at the start of a word — either the
 * beginning of the string or preceded by whitespace / punctuation.
 */
export function isWordBoundary(text: string, index: number): boolean {
  if (index === 0) return true;
  const prev = text[index - 1];
  return prev === " " || prev === "\n" || prev === "\t" || prev === "," || prev === ";";
}

/**
 * Returns `true` when the span `[start, end)` overlaps any span in `spans`.
 */
export function isAlreadyCovered(
  spans: readonly (readonly [number, number])[],
  start: number,
  end: number,
): boolean {
  for (const [s, e] of spans) {
    if (start < e && s < end) return true;
  }
  return false;
}

/**
 * Returns `true` when `index` sits right after a clause/sentence boundary
 * (`: `, `. `, `! `, `? `, or newline).
 */
export function isStrongStart(text: string, index: number): boolean {
  if (index >= 2 && text[index - 1] === " ") {
    const c = text[index - 2];
    if (c === ":" || c === "." || c === "!" || c === "?") return true;
  }
  if (text[index - 1] === "\n") return true;
  return false;
}

const LETTER = /\p{L}/u;
const UPPER_LETTER = /\p{Lu}/u;

function isLetter(ch: string): boolean {
  return LETTER.test(ch);
}

function isUpperLetter(ch: string): boolean {
  return UPPER_LETTER.test(ch);
}
