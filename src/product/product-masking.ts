import { AspectRatio } from "./aspect-ratio.js";
import { BatteryChemistry } from "./battery-chemistry.js";
import { CameraResolution } from "./camera-resolution.js";
import { ClothingFit } from "./clothing-fit.js";
import { ClothingSeason } from "./clothing-season.js";
import { Color } from "./color.js";
import { DisplayPanelType } from "./display-panel-type.js";
import { ElectricalPhase } from "./electrical-phase.js";
import { Gtin8 } from "./gtin8.js";
import { Gtin12 } from "./gtin12.js";
import { Gtin13 } from "./gtin13.js";
import { Gtin14 } from "./gtin14.js";
import { IpRating } from "./ip-rating.js";
import { PowerSource } from "./power-source.js";
import { Refrigerant } from "./refrigerant.js";
import { ScreenResolution } from "./screen-resolution.js";
import { ScreenSize } from "./screen-size.js";
import { StorageMediaType } from "./storage-media-type.js";

const MASK_CHAR = "*";

/** Mask an aspect ratio, e.g. `16:9` becomes `**:*`. */
export function maskAspectRatio(ratio: AspectRatio): string {
  const width = MASK_CHAR.repeat(String(ratio.width).length);
  const height = MASK_CHAR.repeat(String(ratio.height).length);
  return `${width}:${height}`;
}

/** Mask a battery chemistry, e.g. `Li-ion` becomes `******`. */
export function maskBatteryChemistry(chemistry: BatteryChemistry): string {
  return MASK_CHAR.repeat(chemistry.value.length);
}

/** Mask a camera resolution, e.g. `12.2 MP` becomes `*** MP`. */
export function maskCameraResolution(_resolution: CameraResolution): string {
  return `${MASK_CHAR.repeat(3)} MP`;
}

/** Mask a clothing fit, e.g. `Slim` becomes `****`. */
export function maskClothingFit(fit: ClothingFit): string {
  return MASK_CHAR.repeat(fit.value.length);
}

/** Mask a clothing season, e.g. `All-Season` becomes `***-******`. Hyphens stay visible. */
export function maskClothingSeason(season: ClothingSeason): string {
  return [...season.value].map((c) => (c === "-" ? c : MASK_CHAR)).join("");
}

/** Mask a color, e.g. `#FF0000` becomes `#******`. */
export function maskColor(_color: Color): string {
  return `#${MASK_CHAR.repeat(6)}`;
}

/** Mask a display panel type, e.g. `OLED` becomes `****`. */
export function maskDisplayPanelType(panel: DisplayPanelType): string {
  return MASK_CHAR.repeat(panel.value.length);
}

/** Mask an electrical phase, e.g. `3-phase` becomes `*-phase`. */
export function maskElectricalPhase(phase: ElectricalPhase): string {
  return `${MASK_CHAR.repeat(String(phase.phaseCount).length)}-phase`;
}

/** Mask a GTIN-8 completely, e.g. `96385074` becomes `********`. */
export function maskGtin8(gtin: Gtin8): string {
  return MASK_CHAR.repeat(gtin.digits.length);
}

/** Mask a GTIN-12 completely, e.g. `614141000036` becomes `************`. */
export function maskGtin12(gtin: Gtin12): string {
  return MASK_CHAR.repeat(gtin.digits.length);
}

/** Mask a GTIN-13, keeping the GS1 prefix: `5901234123457` becomes `590**********`. */
export function maskGtin13(gtin: Gtin13): string {
  return `${gtin.gs1Prefix}${MASK_CHAR.repeat(gtin.digits.length - gtin.gs1Prefix.length)}`;
}

/** Mask a GTIN-14 completely, e.g. `10614141000415` becomes `**************`. */
export function maskGtin14(gtin: Gtin14): string {
  return MASK_CHAR.repeat(gtin.digits.length);
}

/** Mask an IP rating, e.g. `IP65` becomes `IP**`. */
export function maskIpRating(_rating: IpRating): string {
  return `IP${MASK_CHAR.repeat(2)}`;
}

/** Mask a power source, e.g. `Electric` becomes `********`. */
export function maskPowerSource(source: PowerSource): string {
  return MASK_CHAR.repeat(source.value.length);
}

/** Mask a refrigerant designation, keeping the `R` prefix: `R-134a` becomes `R-****`. */
export function maskRefrigerant(refrigerant: Refrigerant): string {
  const value = refrigerant.value;
  if (value.toLowerCase().startsWith("r-")) {
    return `R-${MASK_CHAR.repeat(value.length - 2)}`;
  }
  return `R${MASK_CHAR.repeat(Math.max(0, value.length - 1))}`;
}

/** Mask a screen resolution, e.g. `1920x1080` becomes `*** x ***`. */
export function maskScreenResolution(_resolution: ScreenResolution): string {
  return `${MASK_CHAR.repeat(3)} x ${MASK_CHAR.repeat(3)}`;
}

/** Mask a screen size, e.g. `15.6 in` becomes `*** in`. */
export function maskScreenSize(_size: ScreenSize): string {
  return `${MASK_CHAR.repeat(3)} in`;
}

/** Mask a storage media type, e.g. `NVMe` becomes `****`. */
export function maskStorageMediaType(storage: StorageMediaType): string {
  return MASK_CHAR.repeat(storage.value.length);
}
