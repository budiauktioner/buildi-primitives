/** The hierarchy level of an HS code, from a two-digit chapter to a ten-digit TARIC code. */
export const HsCodeLevel = {
  Unknown: 0,
  Chapter: 1,
  Heading: 2,
  Subheading: 3,
  CnSubheading: 4,
  TaricCode: 5,
} as const;

export type HsCodeLevel = (typeof HsCodeLevel)[keyof typeof HsCodeLevel];
