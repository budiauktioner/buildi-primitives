import { PrimitivesDefaults } from "../primitives-defaults.js";
import { collapseWhitespace as baseCollapse } from "../internal/input-sanitization.js";

// Single-letter name parts (e.g. "B N" returned by an identity provider) are
// not officially valid full names in most jurisdictions, but they appear in
// real-world data from Skatteverket, BankID and other identity providers.
// Normalization must preserve them rather than discard the name.
export const SINGLE_PART_PATTERN =
  /^(?:[\p{L}\p{M}]+|['\p{L}\p{M}]{2,}|[\p{Lo}])(?:['\p{Zs}-][\p{L}\p{M}]+)*$/u;

export const FULL_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}']*(?:\s+[\p{L}\p{M}][\p{L}\p{M}']*)+$/u;

const HONORIFICS = [
  "fröken",
  "froken",
  "froeken",
  "prof",
  "miss",
  "mrs",
  "mr",
  "ms",
  "dr",
  "herr",
  "fru",
];

export function collapseWhitespace(input: string | null | undefined): string {
  let result = baseCollapse(input);
  result = result.replace(/\s*-\s*/g, "-");
  const parts = result
    .split(" ")
    .map((p) => p.replace(/^\.+|\.+$/g, ""))
    .filter((p) => p.length > 0);
  result = parts.join(" ");
  return stripLeadingHonorific(result);
}

function stripLeadingHonorific(input: string): string {
  const lower = input.toLowerCase();
  for (const h of HONORIFICS) {
    if (input.length <= h.length) continue;
    if (!lower.startsWith(h)) continue;
    if (input[h.length] !== " ") continue;
    return input.slice(h.length + 1);
  }
  return input;
}

/**
 * If every letter in `input` has the same case (all lower or all upper),
 * capitalize each word and hyphenated sub-word. Otherwise keep original casing.
 */
export function normalizeCasing(input: string): string {
  const letters = [...input].filter((c) => /\p{L}/u.test(c));
  if (letters.length === 0) return input;
  const culture = PrimitivesDefaults.culture;
  const allLower = letters.every((c) => c === c.toLocaleLowerCase(culture));
  const allUpper = letters.every((c) => c === c.toLocaleUpperCase(culture));
  return allLower || allUpper ? capitalizeEachWord(input) : input;
}

export function validateNamePart(value: string | null | undefined): boolean {
  if (value == null || value.trim() === "") return false;
  if (/[\p{Cc}]/u.test(value)) return false;
  if (/[\p{Cn}]/u.test(value)) return false;
  return SINGLE_PART_PATTERN.test(value);
}

export function validateGivenNames(value: string | null | undefined): boolean {
  if (value == null || value.trim() === "") return false;
  const parts = value.split(" ").filter((p) => p !== "");
  return parts.length > 0 && parts.every(validateNamePart);
}

function capitalizeEachWord(input: string): string {
  return input.split(" ").filter(Boolean).map(capitalizeHyphenated).join(" ");
}

function capitalizeHyphenated(word: string): string {
  return word.split("-").map(capitalizeWord).join("-");
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  const culture = PrimitivesDefaults.culture;
  const lowered = word.toLocaleLowerCase(culture);
  for (let i = 0; i < lowered.length; i++) {
    if (/\p{L}/u.test(lowered[i]!)) {
      return lowered.slice(0, i) + lowered[i]!.toLocaleUpperCase(culture) + lowered.slice(i + 1);
    }
  }
  return lowered;
}
