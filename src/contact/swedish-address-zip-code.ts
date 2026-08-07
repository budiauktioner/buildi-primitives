import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { Country } from "../geography/index.js";
import { AddressZipCode } from "./address-zip-code.js";

const DIGITS = /^\d{5}$/;

/** A Swedish postal code (`postnummer`) — strictly 5 digits, formatted `NNN NN`. */
export class SwedishAddressZipCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Swedish Zip Code",
    localizedName: "Svenskt postnummer",
    emoji: "\u{1F1F8}\u{1F1EA}",
    sources: Object.freeze([
      "https://www.postnord.se/",
      "https://sv.wikipedia.org/wiki/Postnummer_i_Sverige",
    ]),
  });

  readonly value: string;
  readonly formatted: string;
  readonly zipCode: AddressZipCode;

  get country(): Country {
    return Country.Sweden;
  }

  private constructor(value: string, formatted: string, zipCode: AddressZipCode) {
    this.value = value;
    this.formatted = formatted;
    this.zipCode = zipCode;
  }

  static tryParse(input: string | null | undefined): SwedishAddressZipCode | null {
    if (input == null || input.trim() === "") return null;
    const digits = [...input].filter((c) => c >= "0" && c <= "9").join("");
    if (!DIGITS.test(digits)) return null;
    const formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    const az = AddressZipCode.tryParse(formatted, { country: Country.Sweden });
    if (az === null) return null;
    return new SwedishAddressZipCode(digits, formatted, az);
  }

  static parse(input: string): SwedishAddressZipCode {
    const r = SwedishAddressZipCode.tryParse(input);
    if (r === null) throw new Error("Invalid Swedish zip code. Expected 5-digit format (NNN NN).");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishAddressZipCode.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishAddressZipCode.tryParse(input);
    if (r) return r.formatted;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishAddressZipCode.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishAddressZipCode.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return this.formatted;
  }
}
