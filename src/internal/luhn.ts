/**
 * Validates a standard Luhn (mod 10) checksum.
 * Checks the entire string: the last digit is assumed to be the control digit.
 *
 * Equivalent of `Buildi.Primitives.Luhn.IsValid` (internal in .NET).
 */
export function luhnIsValid(digits: string): boolean {
  if (!digits) return false;

  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const code = digits.charCodeAt(i);
    if (code < 0x30 || code > 0x39) return false;
    let d = code - 0x30;
    if ((len - i) % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}
