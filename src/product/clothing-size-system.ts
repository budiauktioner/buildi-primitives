/** Sizing system a parsed clothing size was expressed in. */
export const ClothingSizeSystem = {
  Unknown: 0,
  EU: 1,
  US: 2,
  UK: 3,
  Letter: 4,
} as const;

export type ClothingSizeSystem = (typeof ClothingSizeSystem)[keyof typeof ClothingSizeSystem];
