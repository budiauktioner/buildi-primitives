import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { Country } from "../geography/index.js";
import { PhoneCallingCode } from "./phone-calling-code.js";

const MAX_INPUT_LENGTH = 50;
const URI_PREFIXES = ["callto:", "tel:", "sms:", "call:"];

const TWO_DIGIT_CODES = new Set([
  "20",
  "27",
  "30",
  "31",
  "32",
  "33",
  "34",
  "36",
  "39",
  "40",
  "41",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "81",
  "82",
  "84",
  "86",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "98",
]);

const LEADING_ZERO_SIGNIFICANT = new Set(["39"]);

const SCAN =
  /(?:(?:\+|00)\d{1,3}[\s-]\(?\d{1,4}\)?[\s-]?\d[\d\s-]{5,12}\d)|(?:(?:\+|00)\d{7,15})|(?:0\d{1,3}[\s-]?\d[\d\s-]{5,10}\d)/g;

/**
 * A phone number (`telefonnummer`). Stored normalized as `00` + country code +
 * subscriber digits (e.g. `0046701740633`). Use {@link toE164String} for the
 * `+`-prefixed E.164 form.
 */
export class PhoneNumber {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Phone Number",
    localizedName: "Telefonnummer",
    emoji: "\u{1F4DE}",
    sources: Object.freeze([
      "https://pts.se/",
      "https://www.itu.int/rec/T-REC-E.164/",
      "https://en.wikipedia.org/wiki/E.164",
    ]),
  });

  readonly digits: string;
  readonly countryCallingCode: PhoneCallingCode;
  readonly country: Country | null;
  readonly isSwedish: boolean;
  readonly isMobile: boolean;

  private constructor(digits: string, isSwedish: boolean, isMobile: boolean) {
    this.digits = digits;
    this.isSwedish = isSwedish;
    this.isMobile = isMobile;
    this.countryCallingCode = PhoneCallingCode.fromResolvedDigits(resolveCallingCode(digits));
    this.country = Country.tryFindByCallingCode(this.countryCallingCode.value);
  }

  get isSwedishTestPhoneNumber(): boolean {
    if (!this.isSwedish) return false;
    const local = this.digits.slice(4);
    return (
      isInPtsRange(local, "7017406", 5, 99) ||
      isInPtsRange(local, "3139006", 0, 99) ||
      isInPtsRange(local, "4062804", 0, 99) ||
      isInPtsRange(local, "8465004", 0, 99) ||
      isInPtsRange(local, "9803192", 0, 99)
    );
  }

  get formatted(): string {
    return this.isSwedish ? this.toLocalString() : this.toDisplayInternationalString();
  }

  static tryParse(
    input: string | null | undefined,
    defaultCallingCode?: string | PhoneCallingCode | Country | null,
  ): PhoneNumber | null {
    if (input == null || input.trim() === "") return null;
    const dcc = resolveDefaultCallingCode(defaultCallingCode);
    if (!dcc) return null;

    let cleaned = sanitizeInput(input).trim();
    if (cleaned.length > MAX_INPUT_LENGTH) return null;

    for (const prefix of URI_PREFIXES) {
      if (cleaned.toLowerCase().startsWith(prefix)) {
        cleaned = cleaned.slice(prefix.length).trimStart();
        break;
      }
    }

    const hasPlus = cleaned.startsWith("+");
    const withOAs0 = cleaned.replace(/O/g, "0");
    const digitsOnly = withOAs0.replace(/[^\d]/g, "");
    if (digitsOnly === "") return null;

    let e164: string;
    if (hasPlus) {
      if (digitsOnly.length < 7 || digitsOnly.length > 15) return null;
      e164 = stripTrunkZeroAfterCallingCode(digitsOnly);
    } else if (digitsOnly.startsWith("00")) {
      const cn = digitsOnly.slice(2);
      if (cn.length < 7 || cn.length > 15) return null;
      e164 = stripTrunkZeroAfterCallingCode(cn);
    } else if (digitsOnly.startsWith(dcc) && digitsOnly.length >= dcc.length + 7) {
      const subscriber = digitsOnly.slice(dcc.length);
      e164 = dcc + stripSingleTrunkZero(dcc, subscriber);
    } else if (digitsOnly.startsWith("0")) {
      const subscriber = stripSingleTrunkZero(dcc, digitsOnly);
      const total = dcc.length + subscriber.length;
      if (total < 7 || total > 15) return null;
      e164 = dcc + subscriber;
    } else if (dcc === "46" && digitsOnly.length === 9 && digitsOnly.startsWith("7")) {
      e164 = "46" + digitsOnly;
    } else {
      return null;
    }

    if (e164.length < 7 || e164.length > 15) return null;
    const isSwedish = e164.startsWith("46");
    if (isSwedish) {
      const local = e164.slice(2);
      if (local.length < 7 || local.length > 9) return null;
    }
    const isMobile = isSwedish && e164.slice(2).startsWith("7");
    return new PhoneNumber("00" + e164, isSwedish, isMobile);
  }

  static parse(
    input: string,
    defaultCallingCode?: string | PhoneCallingCode | Country | null,
  ): PhoneNumber {
    const r = PhoneNumber.tryParse(input, defaultCallingCode);
    if (r === null) throw new Error("Invalid phone number.");
    return r;
  }

  static isValid(
    input: string | null | undefined,
    defaultCallingCode?: string | PhoneCallingCode | Country | null,
  ): boolean {
    return PhoneNumber.tryParse(input, defaultCallingCode) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: {
      defaultCallingCode?: string | PhoneCallingCode | Country | null;
      fallbackToTrimmedInputWhenInvalid?: boolean;
    },
  ): string | null {
    const dcc =
      resolveDefaultCallingCode(options?.defaultCallingCode) ??
      PrimitivesDefaults.defaultCallingCode;
    const r = PhoneNumber.tryParse(input, dcc);
    if (r) {
      return r.countryCallingCode.value === dcc
        ? r.toLocalString()
        : r.toDisplayInternationalString();
    }
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: {
      defaultCallingCode?: string | PhoneCallingCode | Country | null;
      fallbackToTrimmedInputWhenInvalid?: boolean;
    },
  ): string | null {
    const r = PhoneNumber.tryParse(input, options?.defaultCallingCode);
    if (r) return r.digits;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && PhoneNumber.normalize(input) === input;
  }

  static findCandidatesInText(text: string): readonly TextCandidate<PhoneNumber>[] {
    if (!text) return [];
    const out: TextCandidate<PhoneNumber>[] = [];
    SCAN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN.exec(text)) !== null) {
      const phone = PhoneNumber.tryParse(m[0]);
      if (!phone) continue;
      out.push(
        new TextCandidate<PhoneNumber>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "PhoneNumber",
          category: TextCandidateCategory.Contact,
          normalizedForm: phone.toNormalizedString(),
          formattedForm: phone.toString(),
          maskedForm: maskPhoneNumber(phone),
          confidence: TextMatchConfidence.Medium,
          value: phone,
        }),
      );
    }
    return out;
  }

  toNormalizedString(): string {
    return this.digits;
  }

  toLocalString(defaultCallingCode?: PhoneCallingCode | Country): string {
    if (defaultCallingCode) {
      const dcc =
        defaultCallingCode instanceof PhoneCallingCode
          ? defaultCallingCode.value
          : defaultCallingCode.callingCode;
      return this.countryCallingCode.value === dcc
        ? this.toLocalString()
        : this.toDisplayInternationalString();
    }
    const subscriber = this.digits.slice(2 + this.countryCallingCode.value.length);
    if (this.isSwedish) return formatSwedishLocal("0" + subscriber);
    return "0" + subscriber;
  }

  toE164String(): string {
    return "+" + this.digits.slice(2);
  }
  toInternationalString(): string {
    return this.toE164String();
  }

  toDisplayInternationalString(): string {
    const subscriber = this.digits.slice(2 + this.countryCallingCode.value.length);
    return (
      "+" +
      this.countryCallingCode.value +
      " " +
      formatInternationalSubscriberDigits(this.countryCallingCode.value, subscriber)
    );
  }

  toString(): string {
    return this.formatted;
  }

  equals(other: PhoneNumber | null | undefined): boolean {
    return other != null && this.digits === other.digits;
  }
  compareTo(other: PhoneNumber | null | undefined): number {
    if (other == null) return 1;
    return this.digits < other.digits ? -1 : this.digits > other.digits ? 1 : 0;
  }
}

/** Mask a phone number, keeping country code and last 4 digits visible. */
export function maskPhoneNumber(p: PhoneNumber): string {
  const f = p.toE164String();
  if (f.length <= 5) return f.replace(/\d/g, "*");
  const cc = "+" + p.countryCallingCode.value;
  const subscriber = f.slice(cc.length);
  if (subscriber.length <= 4) return cc + "*".repeat(subscriber.length);
  return cc + "*".repeat(subscriber.length - 4) + subscriber.slice(-4);
}

function resolveDefaultCallingCode(
  d: string | PhoneCallingCode | Country | null | undefined,
): string | null {
  if (d == null) return PrimitivesDefaults.defaultCallingCode;
  if (typeof d === "string") return d;
  if (d instanceof PhoneCallingCode) return d.value;
  return d.callingCode;
}

function resolveCallingCode(digits: string): string {
  return resolveCallingCodeFromE164(digits.slice(2));
}

function resolveCallingCodeFromE164(e164: string): string {
  if (e164.length === 0) return "";
  if (e164[0] === "1" || e164[0] === "7") return e164.slice(0, 1);
  if (e164.length >= 2 && TWO_DIGIT_CODES.has(e164.slice(0, 2))) return e164.slice(0, 2);
  return e164.length >= 3 ? e164.slice(0, 3) : e164;
}

function stripTrunkZeroAfterCallingCode(e164: string): string {
  const cc = resolveCallingCodeFromE164(e164);
  if (cc.length === 0 || cc.length >= e164.length) return e164;
  const subscriber = e164.slice(cc.length);
  return cc + stripSingleTrunkZero(cc, subscriber);
}

function stripSingleTrunkZero(callingCode: string, subscriber: string): string {
  if (subscriber.length === 0 || subscriber[0] !== "0") return subscriber;
  if (LEADING_ZERO_SIGNIFICANT.has(callingCode)) return subscriber;
  return subscriber.slice(1);
}

function isInPtsRange(local: string, prefix: string, from: number, to: number): boolean {
  if (!local.startsWith(prefix)) return false;
  const suffix = local.slice(prefix.length);
  if (suffix.length !== 2) return false;
  const n = parseInt(suffix, 10);
  return Number.isFinite(n) && n >= from && n <= to;
}

function formatInternationalSubscriberDigits(callingCode: string, digits: string): string {
  if (callingCode === "1" && digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
  switch (digits.length) {
    case 7:
      return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)}`;
    case 8:
      return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
    case 9:
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    case 10:
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
    case 11:
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
    default:
      return digits;
  }
}

function formatSwedishLocal(number: string): string {
  const digits = number.replace(/^0+/, "");
  if (digits.length === 9) {
    return `0${digits.slice(0, 3)}-${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  if (digits.length === 7) {
    const area = digits.slice(0, 1);
    const rest = digits.slice(1);
    return `0${area}-${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 6)}`;
  }
  if (digits.length === 8) {
    const area = digits.slice(0, 1);
    const rest = digits.slice(1);
    return `0${area}-${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 7)}`;
  }
  return number;
}
