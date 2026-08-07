import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits, sanitizeInput } from "../internal/input-sanitization.js";

const MAX_INPUT_LENGTH = 20;

/** Swedish CFAR number (`CFAR-nummer`) - 8-digit identifier for an establishment. */
export class SwedishCfarNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "CFAR Number",
    localizedName: "CFAR-nummer",
    emoji: "\u{1F3ED}",
    sources: Object.freeze([
      "https://www.cfarnrsok.scb.se/",
      "https://www.scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/variabelbeskrivning/",
    ]),
  });

  readonly number: string;
  private constructor(n: string) {
    this.number = n;
  }

  static tryParse(input: string | null | undefined): SwedishCfarNumber | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(sanitizeInput(input));
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (digits.length !== 8) return null;
    if (digits === "00000000") return null;
    return new SwedishCfarNumber(digits);
  }

  static parse(input: string): SwedishCfarNumber {
    const r = SwedishCfarNumber.tryParse(input);
    if (r === null) throw new Error("Invalid CFAR number.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishCfarNumber.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishCfarNumber.tryParse(input);
    if (r) return r.number;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return SwedishCfarNumber.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishCfarNumber.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.number;
  }
  toString(): string {
    return this.number;
  }

  equals(other: SwedishCfarNumber | null | undefined): boolean {
    return other != null && this.number === other.number;
  }
  compareTo(other: SwedishCfarNumber | null | undefined): number {
    if (other == null) return 1;
    return this.number < other.number ? -1 : this.number > other.number ? 1 : 0;
  }
}

/** Masks the last 4 digits of a CFAR number. */
export function maskSwedishCfarNumber(c: SwedishCfarNumber): string {
  return c.number.slice(0, 4) + "****";
}
