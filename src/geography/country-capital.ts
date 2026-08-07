import { PrimitivesDefaults } from "../primitives-defaults.js";
import { GeoCoordinate } from "./geo-coordinate.js";

/**
 * The capital city of a country (`huvudstad`), with names in English, Swedish,
 * and the country's native language, plus its geographic coordinates.
 */
export class CountryCapital {
  readonly englishName: string;
  readonly localizedName: string;
  readonly nativeName: string;
  readonly coordinate: GeoCoordinate;

  /** @internal */
  constructor(
    englishName: string,
    localizedName: string,
    nativeName: string,
    coordinate: GeoCoordinate,
  ) {
    this.englishName = englishName;
    this.localizedName = localizedName;
    this.nativeName = nativeName;
    this.coordinate = coordinate;
  }

  /** Capital city name in the current display language. */
  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  toString(): string {
    return this.displayName;
  }
}
