/** Sizing system a parsed shoe size was expressed in. */
export const ShoeSizeSystem = {
  Unknown: 0,
  EU: 1,
  USMen: 2,
  USWomen: 3,
  UK: 4,
} as const;

export type ShoeSizeSystem = (typeof ShoeSizeSystem)[keyof typeof ShoeSizeSystem];
