/** Chemical family a refrigerant belongs to, which drives its regulatory treatment. */
export const RefrigerantFamily = {
  /** Unknown or unspecified refrigerant family. */
  Unknown: 0,
  /** Chlorofluorocarbon (banned under the Montreal Protocol; legacy only). */
  Cfc: 1,
  /** Hydrochlorofluorocarbon (phased out for ozone depletion). */
  Hcfc: 2,
  /** Hydrofluorocarbon (high GWP; subject to the F-gas phase-down). */
  Hfc: 3,
  /** Hydrofluoroolefin (low GWP, mildly flammable). */
  Hfo: 4,
  /** Blend of HFCs and HFOs. */
  HfcHfoBlend: 5,
  /** Natural refrigerant (hydrocarbon, ammonia, CO₂, water). */
  Natural: 6,
} as const;

export type RefrigerantFamily = (typeof RefrigerantFamily)[keyof typeof RefrigerantFamily];
