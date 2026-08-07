import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { keepDigits } from "../internal/input-sanitization.js";

const MAX_INPUT_LENGTH = 20;

/** Swedish SNI code (`SNI-kod`). */
export class SwedishSniCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "SNI Code",
    localizedName: "SNI-kod",
    emoji: "\u{1F4CA}",
    sources: Object.freeze([
      "https://www.scb.se/en/documentation/classifications-and-standards/swedish-standard-industrial-classification-sni/",
      "https://snisok.scb.se/en",
    ]),
  });

  readonly code: string;
  readonly formatted: string;
  get divisionCode(): string {
    return this.code.slice(0, 2);
  }
  get groupCode(): string {
    return this.code.slice(0, 3);
  }
  get subGroupCode(): string {
    return this.code.slice(0, 4);
  }

  private constructor(code: string, formatted: string) {
    this.code = code;
    this.formatted = formatted;
  }

  static tryParse(input: string | null | undefined): SwedishSniCode | null {
    if (input == null || input.trim() === "") return null;
    const digits = keepDigits(input);
    if (digits.length > MAX_INPUT_LENGTH) return null;
    if (digits.length !== 5) return null;
    if (digits === "00000") return null;
    if (digits.slice(0, 2) === "00") return null;
    return new SwedishSniCode(digits, `${digits.slice(0, 2)}.${digits.slice(2)}`);
  }

  static parse(input: string): SwedishSniCode {
    const r = SwedishSniCode.tryParse(input);
    if (r === null) throw new Error("Invalid SNI code.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return SwedishSniCode.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = SwedishSniCode.tryParse(input);
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
    return SwedishSniCode.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && SwedishSniCode.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.formatted;
  }
  toString(): string {
    return this.formatted;
  }

  equals(other: SwedishSniCode | null | undefined): boolean {
    return other != null && this.formatted === other.formatted;
  }
  compareTo(other: SwedishSniCode | null | undefined): number {
    if (other == null) return 1;
    return this.formatted < other.formatted ? -1 : this.formatted > other.formatted ? 1 : 0;
  }
}
