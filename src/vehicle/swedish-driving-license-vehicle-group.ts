/** Broad vehicle group associated with a {@link SwedishDrivingLicenseCategory}. */
export const SwedishDrivingLicenseVehicleGroup = {
  Unknown: 0,
  Moped: 1,
  Motorcycle: 2,
  Car: 3,
  Truck: 4,
  Bus: 5,
} as const;

export type SwedishDrivingLicenseVehicleGroup =
  (typeof SwedishDrivingLicenseVehicleGroup)[keyof typeof SwedishDrivingLicenseVehicleGroup];
