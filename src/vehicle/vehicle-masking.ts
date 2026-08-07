import { BoatCeDesignCategory } from "./boat-ce-design-category.js";
import { BoatHullMaterial } from "./boat-hull-material.js";
import { BodyType } from "./body-type.js";
import { DrivetrainType } from "./drivetrain-type.js";
import { FuelConsumptionNorm } from "./fuel-consumption-norm.js";
import { SuspensionType } from "./suspension-type.js";
import { SwedishEcoVehicleClassification } from "./swedish-eco-vehicle-classification.js";
import { TireType } from "./tire-type.js";
import { TrackType } from "./track-type.js";

const MASK_CHAR = "*";

/** Mask a boat CE design category, e.g. `A` becomes `*`. */
export function maskBoatCeDesignCategory(category: BoatCeDesignCategory): string {
  return MASK_CHAR.repeat(category.value.length);
}

/** Mask a boat hull material, e.g. `Fiberglass` becomes `**********`. */
export function maskBoatHullMaterial(material: BoatHullMaterial): string {
  return MASK_CHAR.repeat(material.value.length);
}

/** Mask a body type, e.g. `Sedan` becomes `*****`. */
export function maskBodyType(bodyType: BodyType): string {
  return MASK_CHAR.repeat(bodyType.value.length);
}

/** Mask a drivetrain type, e.g. `AWD` becomes `***`. */
export function maskDrivetrainType(drivetrain: DrivetrainType): string {
  return MASK_CHAR.repeat(drivetrain.value.length);
}

/** Mask a fuel consumption norm, e.g. `WLTP` becomes `****`. */
export function maskFuelConsumptionNorm(norm: FuelConsumptionNorm): string {
  return MASK_CHAR.repeat(norm.value.length);
}

/**
 * Mask a suspension type, e.g. `Coil spring` becomes `**** ******`. Spaces and
 * slashes stay visible so the structure remains recognizable.
 */
export function maskSuspensionType(suspension: SuspensionType): string {
  return maskExcept(suspension.value, " /");
}

/**
 * Mask a Swedish eco-vehicle classification, keeping the leading word:
 * `Miljöbil 2013` becomes `Miljöbil ****`.
 */
export function maskSwedishEcoVehicleClassification(
  classification: SwedishEcoVehicleClassification,
): string {
  const value = classification.value;
  const space = value.indexOf(" ");
  if (space < 0) return MASK_CHAR.repeat(value.length);
  return `${value.slice(0, space)} ${MASK_CHAR.repeat(value.length - space - 1)}`;
}

/**
 * Mask a tire type, e.g. `Winter (studded)` becomes `****** (*******)`. Spaces,
 * parentheses and hyphens stay visible.
 */
export function maskTireType(tireType: TireType): string {
  return maskExcept(tireType.value, " ()-");
}

/** Mask a track type, e.g. `Half-track` becomes `****-*****`. Hyphens stay visible. */
export function maskTrackType(track: TrackType): string {
  return maskExcept(track.value, " -");
}

function maskExcept(value: string, keep: string): string {
  let out = "";
  for (const char of value) out += keep.includes(char) ? char : MASK_CHAR;
  return out;
}
