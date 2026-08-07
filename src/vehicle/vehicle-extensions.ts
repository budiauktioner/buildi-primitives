import type { SwedishVehicleRegistrationNumber } from "./swedish-vehicle-registration-number.js";

/** Returns the Biluppgifter.se lookup URL as a string. */
export function toBiluppgifterUrl(registration: SwedishVehicleRegistrationNumber): string {
  return `https://biluppgifter.se/fordon/${registration.toNormalizedString()}`;
}

/** Returns the Biluppgifter.se vehicle-information URL. */
export function getBiluppgifterUrl(registration: SwedishVehicleRegistrationNumber): URL {
  return new URL(`https://biluppgifter.se/fordon/${registration.value}`);
}

/** Returns the Car.info vehicle-information URL. */
export function getCarInfoUrl(registration: SwedishVehicleRegistrationNumber): URL {
  return new URL(`https://www.car.info/sv-se/license-plate/S/${registration.value}`);
}
