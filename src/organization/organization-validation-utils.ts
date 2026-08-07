/**
 * Shared helpers for organization-number / VAT validation. Internal to the
 * `organization/` namespace.
 */

/** Validates ISO 17442 / ISO 7064 Mod-97 checksum (used by LEI and IBAN). */
export function isValidIso7064Mod97(input: string): boolean {
  if (!input) return false;
  let s = "";
  for (const c of input) {
    if (c >= "0" && c <= "9") s += c;
    else if (c >= "A" && c <= "Z") s += String(c.charCodeAt(0) - 55);
    else if (c >= "a" && c <= "z") s += String(c.charCodeAt(0) - 87);
    else return false;
  }
  // Compute s % 97 using running modulo to avoid BigInt overhead.
  let mod = 0;
  for (let i = 0; i < s.length; i++) {
    mod = (mod * 10 + (s.charCodeAt(i) - 0x30)) % 97;
  }
  return mod === 1;
}

/** Removes spaces, dashes and non-breaking spaces. */
export function cleanSeparators(input: string): string {
  if (!input) return "";
  let out = "";
  for (const c of input) {
    if (c !== " " && c !== "-" && c !== "\u00A0") out += c;
  }
  return out;
}

/** Trims and uppercases, removing a trailing `(PUBL)` suffix. */
export function cleanName(name: string | null | undefined): string {
  if (name == null || name.trim() === "") return "";
  let s = name.trim().toUpperCase();
  if (s.endsWith("(PUBL)")) s = s.slice(0, -6).trim();
  return s;
}

export function nameContains(haystack: string, ...needles: readonly string[]): boolean {
  if (!haystack) return false;
  for (const n of needles) if (haystack.indexOf(n) >= 0) return true;
  return false;
}

export function nameContainsStandalone(haystack: string, ...needles: readonly string[]): boolean {
  if (!haystack) return false;
  for (const n of needles) {
    if (haystack === n) return true;
    if (haystack.startsWith(n + " ")) return true;
    if (haystack.endsWith(" " + n)) return true;
    if (haystack.indexOf(" " + n + " ") >= 0) return true;
  }
  return false;
}

export function nameEndsWith(haystack: string, ...needles: readonly string[]): boolean {
  if (!haystack) return false;
  for (const n of needles) if (haystack.endsWith(n)) return true;
  return false;
}
