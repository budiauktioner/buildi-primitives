/** The four GTIN lengths GS1 defines: GTIN-8, GTIN-12, GTIN-13 and GTIN-14. */
export const GTIN_VALID_LENGTHS: readonly number[] = [8, 12, 13, 14];

/**
 * Strips the separators a printed GTIN may carry. Spaces and hyphens are dropped; anything
 * else disqualifies the input, so `59012341234-57` extracts but `590.1234` does not.
 * Returns `null` when nothing is left or a foreign character appears.
 */
export function extractGtinDigits(input: string | null | undefined): string | null {
  if (input == null || input.trim().length === 0) return null;

  let digits = "";
  for (const character of input) {
    if (character >= "0" && character <= "9") digits += character;
    else if (character !== " " && character !== "-") return null;
  }

  return digits.length === 0 ? null : digits;
}

/**
 * Validates the GS1 modulo-10 check digit, where digits are weighted 3 and 1 alternating from
 * the right, ahead of the trailing check digit itself.
 */
export function validateGtinCheckDigit(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length - 1; i++) {
    const digit = digits.charCodeAt(i) - 48;
    const positionFromRight = digits.length - 1 - i;
    sum += digit * (positionFromRight % 2 === 1 ? 3 : 1);
  }

  const expected = (10 - (sum % 10)) % 10;
  return expected === digits.charCodeAt(digits.length - 1) - 48;
}
