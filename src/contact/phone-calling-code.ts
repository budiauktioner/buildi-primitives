import { PrimitiveTypeInfo } from "../primitive-type-info.js";

const CODE_TO_COUNTRY: Readonly<Record<string, string>> = Object.freeze({
  "1": "US",
  "7": "RU",
  "20": "EG",
  "27": "ZA",
  "30": "GR",
  "31": "NL",
  "32": "BE",
  "33": "FR",
  "34": "ES",
  "36": "HU",
  "39": "IT",
  "40": "RO",
  "41": "CH",
  "43": "AT",
  "44": "GB",
  "45": "DK",
  "46": "SE",
  "47": "NO",
  "48": "PL",
  "49": "DE",
  "51": "PE",
  "52": "MX",
  "53": "CU",
  "54": "AR",
  "55": "BR",
  "56": "CL",
  "57": "CO",
  "58": "VE",
  "60": "MY",
  "61": "AU",
  "62": "ID",
  "63": "PH",
  "64": "NZ",
  "65": "SG",
  "66": "TH",
  "81": "JP",
  "82": "KR",
  "84": "VN",
  "86": "CN",
  "90": "TR",
  "91": "IN",
  "92": "PK",
  "93": "AF",
  "94": "LK",
  "95": "MM",
  "98": "IR",
  "211": "SS",
  "212": "MA",
  "213": "DZ",
  "216": "TN",
  "218": "LY",
  "220": "GM",
  "221": "SN",
  "222": "MR",
  "223": "ML",
  "224": "GN",
  "225": "CI",
  "226": "BF",
  "227": "NE",
  "228": "TG",
  "229": "BJ",
  "230": "MU",
  "231": "LR",
  "232": "SL",
  "233": "GH",
  "234": "NG",
  "235": "TD",
  "236": "CF",
  "237": "CM",
  "238": "CV",
  "239": "ST",
  "240": "GQ",
  "241": "GA",
  "242": "CG",
  "243": "CD",
  "244": "AO",
  "245": "GW",
  "248": "SC",
  "249": "SD",
  "250": "RW",
  "251": "ET",
  "252": "SO",
  "253": "DJ",
  "254": "KE",
  "255": "TZ",
  "256": "UG",
  "257": "BI",
  "258": "MZ",
  "260": "ZM",
  "261": "MG",
  "263": "ZW",
  "264": "NA",
  "265": "MW",
  "266": "LS",
  "267": "BW",
  "268": "SZ",
  "269": "KM",
  "291": "ER",
  "297": "AW",
  "298": "FO",
  "299": "GL",
  "350": "GI",
  "351": "PT",
  "352": "LU",
  "353": "IE",
  "354": "IS",
  "355": "AL",
  "356": "MT",
  "357": "CY",
  "358": "FI",
  "359": "BG",
  "370": "LT",
  "371": "LV",
  "372": "EE",
  "373": "MD",
  "374": "AM",
  "375": "BY",
  "376": "AD",
  "377": "MC",
  "378": "SM",
  "379": "VA",
  "380": "UA",
  "381": "RS",
  "382": "ME",
  "383": "XK",
  "385": "HR",
  "386": "SI",
  "387": "BA",
  "389": "MK",
  "420": "CZ",
  "421": "SK",
  "423": "LI",
  "501": "BZ",
  "502": "GT",
  "503": "SV",
  "504": "HN",
  "505": "NI",
  "506": "CR",
  "507": "PA",
  "509": "HT",
  "591": "BO",
  "592": "GY",
  "593": "EC",
  "595": "PY",
  "597": "SR",
  "598": "UY",
  "599": "CW",
  "670": "TL",
  "673": "BN",
  "674": "NR",
  "675": "PG",
  "676": "TO",
  "677": "SB",
  "678": "VU",
  "679": "FJ",
  "680": "PW",
  "685": "WS",
  "686": "KI",
  "688": "TV",
  "691": "FM",
  "692": "MH",
  "850": "KP",
  "852": "HK",
  "853": "MO",
  "855": "KH",
  "856": "LA",
  "880": "BD",
  "886": "TW",
  "960": "MV",
  "961": "LB",
  "962": "JO",
  "963": "SY",
  "964": "IQ",
  "965": "KW",
  "966": "SA",
  "967": "YE",
  "968": "OM",
  "970": "PS",
  "971": "AE",
  "972": "IL",
  "973": "BH",
  "974": "QA",
  "975": "BT",
  "976": "MN",
  "977": "NP",
  "992": "TJ",
  "993": "TM",
  "994": "AZ",
  "995": "GE",
  "996": "KG",
  "998": "UZ",
});

/** A phone country calling code (`landsnummer`) e.g. `+46` for Sweden. */
export class PhoneCallingCode {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Calling Code",
    localizedName: "Landsnummer",
    emoji: "\u{1F4DE}",
    sources: Object.freeze([
      "https://www.itu.int/rec/T-REC-E.164/",
      "https://en.wikipedia.org/wiki/List_of_country_calling_codes",
    ]),
  });

  readonly value: string;
  readonly countryCode: string | null;

  private constructor(value: string, countryCode: string | null) {
    this.value = value;
    this.countryCode = countryCode;
  }

  /** @internal */
  static _new(value: string, countryCode: string | null): PhoneCallingCode {
    return new PhoneCallingCode(value, countryCode);
  }

  /** @internal */
  static fromResolvedDigits(digits: string): PhoneCallingCode {
    return new PhoneCallingCode(digits, CODE_TO_COUNTRY[digits] ?? null);
  }

  static tryParse(input: string | null | undefined): PhoneCallingCode | null {
    if (input == null || input.trim() === "") return null;
    const digits = extractDigits(input.trim());
    if (digits === null) return null;
    const country = CODE_TO_COUNTRY[digits];
    if (country == null) return null;
    return new PhoneCallingCode(digits, country);
  }

  static parse(input: string): PhoneCallingCode {
    const r = PhoneCallingCode.tryParse(input);
    if (r === null) throw new Error("Unknown phone calling code.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return PhoneCallingCode.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = PhoneCallingCode.tryParse(input);
    if (r) return r.toString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = PhoneCallingCode.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && PhoneCallingCode.normalize(input) === input;
  }

  static get all(): readonly PhoneCallingCode[] {
    return ALL;
  }

  toNormalizedString(): string {
    return this.value;
  }
  toString(): string {
    return `+${this.value}`;
  }

  equals(other: PhoneCallingCode | null | undefined): boolean {
    return other != null && this.value === other.value;
  }
  compareTo(other: PhoneCallingCode | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }

  /** Sweden (+46). */
  static get Sweden(): PhoneCallingCode {
    return PhoneCallingCode.parse("+46");
  }
  /** Norway (+47). */
  static get Norway(): PhoneCallingCode {
    return PhoneCallingCode.parse("+47");
  }
  /** Finland (+358). */
  static get Finland(): PhoneCallingCode {
    return PhoneCallingCode.parse("+358");
  }
  /** Denmark (+45). */
  static get Denmark(): PhoneCallingCode {
    return PhoneCallingCode.parse("+45");
  }
  /** Germany (+49). */
  static get Germany(): PhoneCallingCode {
    return PhoneCallingCode.parse("+49");
  }
  /** Poland (+48). */
  static get Poland(): PhoneCallingCode {
    return PhoneCallingCode.parse("+48");
  }
  /** Estonia (+372). */
  static get Estonia(): PhoneCallingCode {
    return PhoneCallingCode.parse("+372");
  }
  /** Lithuania (+370). */
  static get Lithuania(): PhoneCallingCode {
    return PhoneCallingCode.parse("+370");
  }
  /** Romania (+40). */
  static get Romania(): PhoneCallingCode {
    return PhoneCallingCode.parse("+40");
  }
  /** Bulgaria (+359). */
  static get Bulgaria(): PhoneCallingCode {
    return PhoneCallingCode.parse("+359");
  }
  /** Latvia (+371). */
  static get Latvia(): PhoneCallingCode {
    return PhoneCallingCode.parse("+371");
  }
  /** Czech Republic (+420). */
  static get CzechRepublic(): PhoneCallingCode {
    return PhoneCallingCode.parse("+420");
  }
  /** Spain (+34). */
  static get Spain(): PhoneCallingCode {
    return PhoneCallingCode.parse("+34");
  }
  /** Netherlands (+31). */
  static get Netherlands(): PhoneCallingCode {
    return PhoneCallingCode.parse("+31");
  }
  /** Greece (+30). */
  static get Greece(): PhoneCallingCode {
    return PhoneCallingCode.parse("+30");
  }
  /** Italy (+39). */
  static get Italy(): PhoneCallingCode {
    return PhoneCallingCode.parse("+39");
  }
  /** Slovenia (+386). */
  static get Slovenia(): PhoneCallingCode {
    return PhoneCallingCode.parse("+386");
  }
  /** Croatia (+385). */
  static get Croatia(): PhoneCallingCode {
    return PhoneCallingCode.parse("+385");
  }
  /** Portugal (+351). */
  static get Portugal(): PhoneCallingCode {
    return PhoneCallingCode.parse("+351");
  }
  /** Hungary (+36). */
  static get Hungary(): PhoneCallingCode {
    return PhoneCallingCode.parse("+36");
  }
  /** France (+33). */
  static get France(): PhoneCallingCode {
    return PhoneCallingCode.parse("+33");
  }
  /** Slovakia (+421). */
  static get Slovakia(): PhoneCallingCode {
    return PhoneCallingCode.parse("+421");
  }
  /** Belgium (+32). */
  static get Belgium(): PhoneCallingCode {
    return PhoneCallingCode.parse("+32");
  }
  /** United Kingdom (+44). */
  static get UnitedKingdom(): PhoneCallingCode {
    return PhoneCallingCode.parse("+44");
  }
  /** Austria (+43). */
  static get Austria(): PhoneCallingCode {
    return PhoneCallingCode.parse("+43");
  }
  /** Cyprus (+357). */
  static get Cyprus(): PhoneCallingCode {
    return PhoneCallingCode.parse("+357");
  }
  /** Iceland (+354). */
  static get Iceland(): PhoneCallingCode {
    return PhoneCallingCode.parse("+354");
  }
  /** Switzerland (+41). */
  static get Switzerland(): PhoneCallingCode {
    return PhoneCallingCode.parse("+41");
  }
  /** Ireland (+353). */
  static get Ireland(): PhoneCallingCode {
    return PhoneCallingCode.parse("+353");
  }
  /** Luxembourg (+352). */
  static get Luxembourg(): PhoneCallingCode {
    return PhoneCallingCode.parse("+352");
  }
  /** Malta (+356). */
  static get Malta(): PhoneCallingCode {
    return PhoneCallingCode.parse("+356");
  }
  /** Liechtenstein (+423). */
  static get Liechtenstein(): PhoneCallingCode {
    return PhoneCallingCode.parse("+423");
  }
  /** United States (+1). */
  static get UnitedStates(): PhoneCallingCode {
    return PhoneCallingCode.parse("+1");
  }
  /** Russia (+7). */
  static get Russia(): PhoneCallingCode {
    return PhoneCallingCode.parse("+7");
  }
}

const ALL: readonly PhoneCallingCode[] = Object.entries(CODE_TO_COUNTRY).map(([code, cc]) =>
  PhoneCallingCode._new(code, cc),
);

function extractDigits(input: string): string | null {
  if (input.startsWith("+")) return input.slice(1);
  if (input.startsWith("00") && input.length > 2) return input.slice(2);
  if (input.length >= 1 && input.length <= 3 && /^\d+$/.test(input)) return input;
  return null;
}
