import type { Gtin8 } from "./gtin8.js";
import type { Gtin13 } from "./gtin13.js";

/** BarcodeLookup.com URL for a GTIN-8 or GTIN-13, e.g. `https://www.barcodelookup.com/5901234123457`. */
export function toBarcodeLookupUrl(gtin: Gtin8 | Gtin13): string {
  return `https://www.barcodelookup.com/${gtin.toNormalizedString()}`;
}
