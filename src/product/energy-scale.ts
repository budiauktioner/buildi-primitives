/** Which EU label scale a value belongs to. */
export const EnergyScale = {
  Unknown: 0,
  /** The pre-2021 scale, which ran from `A+++` down to `G`. */
  Old: 1,
  /** The rescaled 2021 label, which runs from `A` down to `G`. */
  New: 2,
} as const;

export type EnergyScale = (typeof EnergyScale)[keyof typeof EnergyScale];
