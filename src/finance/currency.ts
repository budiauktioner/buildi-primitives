import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
// `geography/country.ts` imports this module for its currency accessors. Both
// directions are only used inside function bodies, never at module-evaluation
// time, so the cycle resolves safely under ESM.
import { Country } from "../geography/country.js";

interface CurrencyRow {
  code: string;
  en: string;
  sv: string;
  symbol: string;
  decimalPlaces: number;
}

const KNOWN_CURRENCIES: readonly CurrencyRow[] = [
  { code: "SEK", en: "Swedish krona", sv: "Svensk krona", symbol: "kr", decimalPlaces: 2 },
  { code: "NOK", en: "Norwegian krone", sv: "Norsk krona", symbol: "kr", decimalPlaces: 2 },
  { code: "DKK", en: "Danish krone", sv: "Dansk krona", symbol: "kr", decimalPlaces: 2 },
  { code: "ISK", en: "Icelandic króna", sv: "Isländsk krona", symbol: "kr", decimalPlaces: 0 },
  { code: "EUR", en: "Euro", sv: "Euro", symbol: "€", decimalPlaces: 2 },
  {
    code: "USD",
    en: "United States dollar",
    sv: "Amerikansk dollar",
    symbol: "$",
    decimalPlaces: 2,
  },
  { code: "GBP", en: "Pound sterling", sv: "Brittiskt pund", symbol: "£", decimalPlaces: 2 },
  { code: "CHF", en: "Swiss franc", sv: "Schweizisk franc", symbol: "CHF", decimalPlaces: 2 },
  { code: "JPY", en: "Japanese yen", sv: "Japansk yen", symbol: "¥", decimalPlaces: 0 },
  { code: "CNY", en: "Chinese yuan", sv: "Kinesisk yuan", symbol: "¥", decimalPlaces: 2 },
  { code: "CAD", en: "Canadian dollar", sv: "Kanadensisk dollar", symbol: "CA$", decimalPlaces: 2 },
  { code: "AUD", en: "Australian dollar", sv: "Australisk dollar", symbol: "A$", decimalPlaces: 2 },
  {
    code: "NZD",
    en: "New Zealand dollar",
    sv: "Nyzeeländsk dollar",
    symbol: "NZ$",
    decimalPlaces: 2,
  },
  { code: "PLN", en: "Polish złoty", sv: "Polsk zloty", symbol: "zł", decimalPlaces: 2 },
  { code: "CZK", en: "Czech koruna", sv: "Tjeckisk koruna", symbol: "Kč", decimalPlaces: 2 },
  { code: "HUF", en: "Hungarian forint", sv: "Ungersk forint", symbol: "Ft", decimalPlaces: 2 },
  { code: "RON", en: "Romanian leu", sv: "Rumänsk leu", symbol: "lei", decimalPlaces: 2 },
  { code: "BGN", en: "Bulgarian lev", sv: "Bulgarisk lev", symbol: "лв", decimalPlaces: 2 },
  { code: "HRK", en: "Croatian kuna", sv: "Kroatisk kuna", symbol: "kn", decimalPlaces: 2 },
  { code: "TRY", en: "Turkish lira", sv: "Turkisk lira", symbol: "₺", decimalPlaces: 2 },
  { code: "RUB", en: "Russian ruble", sv: "Rysk rubel", symbol: "₽", decimalPlaces: 2 },
  { code: "INR", en: "Indian rupee", sv: "Indisk rupie", symbol: "₹", decimalPlaces: 2 },
  { code: "BRL", en: "Brazilian real", sv: "Brasiliansk real", symbol: "R$", decimalPlaces: 2 },
  { code: "ZAR", en: "South African rand", sv: "Sydafrikansk rand", symbol: "R", decimalPlaces: 2 },
  { code: "MXN", en: "Mexican peso", sv: "Mexikansk peso", symbol: "MX$", decimalPlaces: 2 },
  {
    code: "SGD",
    en: "Singapore dollar",
    sv: "Singaporiansk dollar",
    symbol: "S$",
    decimalPlaces: 2,
  },
  { code: "HKD", en: "Hong Kong dollar", sv: "Hongkongdollar", symbol: "HK$", decimalPlaces: 2 },
  { code: "KRW", en: "South Korean won", sv: "Sydkoreansk won", symbol: "₩", decimalPlaces: 0 },
  { code: "THB", en: "Thai baht", sv: "Thailändsk baht", symbol: "฿", decimalPlaces: 2 },
  {
    code: "TWD",
    en: "New Taiwan dollar",
    sv: "Taiwanesisk dollar",
    symbol: "NT$",
    decimalPlaces: 2,
  },
  { code: "ILS", en: "Israeli new shekel", sv: "Israelisk shekel", symbol: "₪", decimalPlaces: 2 },
  {
    code: "AED",
    en: "United Arab Emirates dirham",
    sv: "Emiratisk dirham",
    symbol: "د.إ",
    decimalPlaces: 2,
  },
  { code: "SAR", en: "Saudi riyal", sv: "Saudisk riyal", symbol: "﷼", decimalPlaces: 2 },
  { code: "PHP", en: "Philippine peso", sv: "Filippinsk peso", symbol: "₱", decimalPlaces: 2 },
  { code: "IDR", en: "Indonesian rupiah", sv: "Indonesisk rupiah", symbol: "Rp", decimalPlaces: 2 },
  { code: "MYR", en: "Malaysian ringgit", sv: "Malaysisk ringgit", symbol: "RM", decimalPlaces: 2 },
  { code: "VND", en: "Vietnamese đồng", sv: "Vietnamesisk dong", symbol: "₫", decimalPlaces: 0 },
  { code: "UAH", en: "Ukrainian hryvnia", sv: "Ukrainsk hryvnia", symbol: "₴", decimalPlaces: 2 },
  { code: "EGP", en: "Egyptian pound", sv: "Egyptiskt pund", symbol: "E£", decimalPlaces: 2 },
  { code: "NGN", en: "Nigerian naira", sv: "Nigeriansk naira", symbol: "₦", decimalPlaces: 2 },
  { code: "KES", en: "Kenyan shilling", sv: "Kenyansk shilling", symbol: "KSh", decimalPlaces: 2 },
  { code: "COP", en: "Colombian peso", sv: "Colombiansk peso", symbol: "CO$", decimalPlaces: 2 },
  { code: "ARS", en: "Argentine peso", sv: "Argentinsk peso", symbol: "AR$", decimalPlaces: 2 },
  { code: "CLP", en: "Chilean peso", sv: "Chilensk peso", symbol: "CL$", decimalPlaces: 0 },
  { code: "PEN", en: "Peruvian sol", sv: "Peruansk sol", symbol: "S/.", decimalPlaces: 2 },
];

/**
 * An ISO 4217 currency identified by its three-letter code (e.g. `SEK`, `EUR`).
 */
export class Currency {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Currency",
    localizedName: "Valuta",
    emoji: "\u{1F4B1}",
    sources: Object.freeze([
      "https://www.iso.org/iso-4217-currency-codes.html",
      "https://en.wikipedia.org/wiki/ISO_4217",
    ]),
  });

  readonly code: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly symbol: string;
  readonly decimalPlaces: number;

  private constructor(row: CurrencyRow) {
    this.code = row.code;
    this.englishName = row.en;
    this.localizedName = row.sv;
    this.symbol = row.symbol;
    this.decimalPlaces = row.decimalPlaces;
  }

  /** @internal */
  static _fromRow(row: CurrencyRow): Currency {
    return new Currency(row);
  }

  /** Display name in current UI culture (Swedish or English). */
  /**
   * The currency name as used in its issuing country. Falls back to
   * {@link englishName} when no issuing country is known.
   */
  get nativeName(): string {
    const country = Country.all.find(
      (c) => c.currencyCode != null && c.currencyCode.toUpperCase() === this.code.toUpperCase(),
    );
    if (country === undefined) return this.englishName;
    return country.nativeName === country.englishName ? this.englishName : this.localizedName;
  }

  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  static tryParse(input: string | null | undefined): Currency | null {
    if (input == null || input.trim() === "") return null;
    const trimmed = sanitizeInput(input).trim();
    const byCode = BY_CODE.get(trimmed.toUpperCase());
    if (byCode) return byCode;
    const byName = BY_NAME.get(trimmed.toLowerCase());
    if (byName) return byName;
    return null;
  }

  static parse(input: string): Currency {
    const r = Currency.tryParse(input);
    if (r === null) throw new Error("Unknown currency.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Currency.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Currency.tryParse(input);
    if (r) return r.displayName;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Currency.tryParse(input);
    if (r) return r.code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Currency.normalize(input) === input;
  }

  /** All known currencies. */
  static get all(): readonly Currency[] {
    return ALL_CURRENCIES;
  }

  /** @internal Lookup by symbol. */
  static tryParseSymbol(symbol: string | null | undefined): Currency | null {
    if (symbol == null || symbol.trim() === "") return null;
    return BY_SYMBOL.get(symbol.trim().toLowerCase()) ?? null;
  }

  toNormalizedString(): string {
    return this.code;
  }

  toString(): string {
    return this.displayName;
  }

  toDisplayString(): string {
    return this.displayName;
  }

  toEnglishString(): string {
    return this.englishName;
  }

  toNativeString(): string {
    return this.nativeName;
  }

  equals(other: Currency | null | undefined): boolean {
    return other != null && this.code === other.code;
  }

  compareTo(other: Currency | null | undefined): number {
    if (other == null) return 1;
    return this.code < other.code ? -1 : this.code > other.code ? 1 : 0;
  }

  static get SEK(): Currency {
    return BY_CODE.get("SEK")!;
  }
  static get EUR(): Currency {
    return BY_CODE.get("EUR")!;
  }
  static get USD(): Currency {
    return BY_CODE.get("USD")!;
  }
  static get NOK(): Currency {
    return BY_CODE.get("NOK")!;
  }
  static get DKK(): Currency {
    return BY_CODE.get("DKK")!;
  }
  static get GBP(): Currency {
    return BY_CODE.get("GBP")!;
  }
}

const ALL_CURRENCIES: readonly Currency[] = KNOWN_CURRENCIES.map((r) => Currency._fromRow(r));

const BY_CODE = new Map<string, Currency>();
for (const c of ALL_CURRENCIES) BY_CODE.set(c.code.toUpperCase(), c);

const BY_NAME = new Map<string, Currency>();
for (const c of ALL_CURRENCIES) {
  BY_NAME.set(c.englishName.toLowerCase(), c);
  BY_NAME.set(c.localizedName.toLowerCase(), c);
}

const BY_SYMBOL = new Map<string, Currency>();
for (const c of ALL_CURRENCIES) {
  if (!BY_SYMBOL.has(c.symbol.toLowerCase())) BY_SYMBOL.set(c.symbol.toLowerCase(), c);
}

/**
 * Returns the primary currency for a country, or `null` when no association
 * is known. Resolves the country's first `currencyCodes` entry to a
 * {@link Currency} instance.
 */
export function getCurrencyForCountry(country: Country): Currency | null {
  const codes = country.currencyCodes;
  if (codes.length === 0) return null;
  const first = codes[0];
  if (first == null) return null;
  return Currency.tryParse(first);
}
