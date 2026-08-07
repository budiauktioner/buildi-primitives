/**
 * Folds a string the way .NET's `StringComparer.OrdinalIgnoreCase` does, so that alias
 * tables built in .NET resolve the same input here.
 *
 * Ordinal comparison uppercases one character at a time, which makes characters that share
 * an uppercase form interchangeable even when their lowercase forms differ — the micro sign
 * `µ` and Greek small mu `μ` both uppercase to `Μ`. Mappings that expand to more than one
 * character (`ß` to `SS`) are left alone, since .NET's per-character conversion cannot
 * produce them either.
 */
export function foldOrdinalIgnoreCase(value: string): string {
  let folded = "";
  for (const character of value) {
    const upper = character.toUpperCase();
    folded += [...upper].length === 1 ? upper : character;
  }
  return folded;
}
