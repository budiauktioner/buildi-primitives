/** Renders a shoe size as `EU 42` for whole sizes and `EU 42.5` for half sizes. */
export function formatEuShoeSize(euSize: number): string {
  return `EU ${formatShoeNumber(euSize)}`;
}

/** Renders a shoe size number with one decimal only when it has a fractional part. */
export function formatShoeNumber(size: number): string {
  return Number.isInteger(size) ? String(Math.trunc(size)) : size.toFixed(1);
}
