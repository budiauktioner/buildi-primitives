import { Country } from "../geography/index.js";
import {
  defineCountryZipCode,
  digitsWithPrefix,
  digitsWithSeparator,
  digitsWithSpace,
  fixedDigits,
  onlyDigits,
} from "./country-zip-code-factory.js";

const dutch = (input: string): { value: string; formatted: string } | null => {
  const cleaned = input.toUpperCase().replace(/-/g, "").replace("NL", "");
  const m = /^\s*(\d{4})\s*([A-Z]{2})\s*$/.exec(cleaned);
  if (!m) return null;
  return { value: `${m[1]}${m[2]}`, formatted: `${m[1]} ${m[2]}` };
};

const british = (input: string): { value: string; formatted: string } | null => {
  const cleaned = input.toUpperCase().trim().replace(/\s+/g, "");
  const m = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/.exec(cleaned);
  if (!m) return null;
  return { value: cleaned, formatted: `${m[1]} ${m[2]}` };
};

const irish = (input: string): { value: string; formatted: string } | null => {
  const cleaned = input.toUpperCase().trim().replace(/\s+/g, "");
  const m = /^([A-Z]\d{2})([A-Z\d]{4})$/.exec(cleaned);
  if (!m) return null;
  return { value: cleaned, formatted: `${m[1]} ${m[2]}` };
};

const maltese = (input: string): { value: string; formatted: string } | null => {
  const cleaned = input.toUpperCase().trim().replace(/\s+/g, "");
  const m = /^([A-Z]{3})(\d{4})$/.exec(cleaned);
  if (!m) return null;
  return { value: cleaned, formatted: `${m[1]} ${m[2]}` };
};

const portuguese = (input: string): { value: string; formatted: string } | null => {
  const d = onlyDigits(input);
  if (d.length !== 7) return null;
  return { value: d, formatted: `${d.slice(0, 4)}-${d.slice(4)}` };
};

const SwedishLessZipFactory = (
  englishName: string,
  localizedName: string,
  emoji: string,
  sources: readonly string[],
  country: Country,
  invalidMessage: string,
  parseRaw: (input: string) => { value: string; formatted: string } | null,
) =>
  defineCountryZipCode({
    englishName,
    localizedName,
    emoji,
    sources,
    country,
    invalidMessage,
    parseRaw,
  });

export const NorwegianAddressZipCode = SwedishLessZipFactory(
  "Norwegian Zip Code",
  "Norskt postnummer",
  "\u{1F1F3}\u{1F1F4}",
  ["https://www.posten.no/", "https://en.wikipedia.org/wiki/Postal_codes_in_Norway"],
  Country.Norway,
  "Invalid Norwegian zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const FinnishAddressZipCode = SwedishLessZipFactory(
  "Finnish Zip Code",
  "Finskt postnummer",
  "\u{1F1EB}\u{1F1EE}",
  ["https://www.posti.fi/", "https://en.wikipedia.org/wiki/Postal_codes_in_Finland"],
  Country.Finland,
  "Invalid Finnish zip code. Expected 5-digit format (NNNNN).",
  fixedDigits(5),
).static;

export const DanishAddressZipCode = SwedishLessZipFactory(
  "Danish Zip Code",
  "Danskt postnummer",
  "\u{1F1E9}\u{1F1F0}",
  ["https://www.postnord.dk/", "https://en.wikipedia.org/wiki/Postal_codes_in_Denmark"],
  Country.Denmark,
  "Invalid Danish zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const GermanAddressZipCode = SwedishLessZipFactory(
  "German Zip Code",
  "Tyskt postnummer",
  "\u{1F1E9}\u{1F1EA}",
  ["https://www.deutschepost.de/", "https://en.wikipedia.org/wiki/Postal_codes_in_Germany"],
  Country.Germany,
  "Invalid German zip code. Expected 5-digit format (NNNNN).",
  fixedDigits(5),
).static;

export const PolishAddressZipCode = SwedishLessZipFactory(
  "Polish Zip Code",
  "Polskt postnummer",
  "\u{1F1F5}\u{1F1F1}",
  ["https://www.poczta-polska.pl/", "https://en.wikipedia.org/wiki/Postal_codes_in_Poland"],
  Country.Poland,
  "Invalid Polish zip code. Expected 5-digit format (NN-NNN).",
  digitsWithSeparator(5, 2, "-"),
).static;

export const EstonianAddressZipCode = SwedishLessZipFactory(
  "Estonian Zip Code",
  "Estniskt postnummer",
  "\u{1F1EA}\u{1F1EA}",
  ["https://www.omniva.ee/", "https://en.wikipedia.org/wiki/Postal_codes_in_Estonia"],
  Country.Estonia,
  "Invalid Estonian zip code. Expected 5-digit format (NNNNN).",
  fixedDigits(5),
).static;

export const LithuanianAddressZipCode = SwedishLessZipFactory(
  "Lithuanian Zip Code",
  "Litauiskt postnummer",
  "\u{1F1F1}\u{1F1F9}",
  ["https://www.post.lt/", "https://en.wikipedia.org/wiki/Postal_codes_in_Lithuania"],
  Country.Lithuania,
  "Invalid Lithuanian zip code. Expected format LT-NNNNN.",
  digitsWithPrefix(5, "LT-"),
).static;

export const RomanianAddressZipCode = SwedishLessZipFactory(
  "Romanian Zip Code",
  "Rumänskt postnummer",
  "\u{1F1F7}\u{1F1F4}",
  ["https://www.posta-romana.ro/", "https://en.wikipedia.org/wiki/Postal_codes_in_Romania"],
  Country.Romania,
  "Invalid Romanian zip code. Expected 6-digit format (NNNNNN).",
  fixedDigits(6),
).static;

export const BulgarianAddressZipCode = SwedishLessZipFactory(
  "Bulgarian Zip Code",
  "Bulgariskt postnummer",
  "\u{1F1E7}\u{1F1EC}",
  ["https://www.bgpost.bg/", "https://en.wikipedia.org/wiki/Postal_codes_in_Bulgaria"],
  Country.Bulgaria,
  "Invalid Bulgarian zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const LatvianAddressZipCode = SwedishLessZipFactory(
  "Latvian Zip Code",
  "Lettiskt postnummer",
  "\u{1F1F1}\u{1F1FB}",
  ["https://www.pasts.lv/", "https://en.wikipedia.org/wiki/Postal_codes_in_Latvia"],
  Country.Latvia,
  "Invalid Latvian zip code. Expected format LV-NNNN.",
  digitsWithPrefix(4, "LV-"),
).static;

export const CzechAddressZipCode = SwedishLessZipFactory(
  "Czech Zip Code",
  "Tjeckiskt postnummer",
  "\u{1F1E8}\u{1F1FF}",
  [
    "https://www.ceskaposta.cz/",
    "https://en.wikipedia.org/wiki/Postal_codes_in_the_Czech_Republic",
  ],
  Country.tryParse("CZ")!,
  "Invalid Czech zip code. Expected 5-digit format (NNN NN).",
  digitsWithSpace(5, 3),
).static;

export const SpanishAddressZipCode = SwedishLessZipFactory(
  "Spanish Zip Code",
  "Spanskt postnummer",
  "\u{1F1EA}\u{1F1F8}",
  ["https://www.correos.es/", "https://en.wikipedia.org/wiki/Postal_codes_in_Spain"],
  Country.tryParse("ES")!,
  "Invalid Spanish zip code. Expected 5-digit format (NNNNN).",
  fixedDigits(5),
).static;

export const DutchAddressZipCode = SwedishLessZipFactory(
  "Dutch Zip Code",
  "Nederländskt postnummer",
  "\u{1F1F3}\u{1F1F1}",
  ["https://www.postnl.nl/", "https://en.wikipedia.org/wiki/Postal_codes_in_the_Netherlands"],
  Country.tryParse("NL")!,
  "Invalid Dutch zip code. Expected format NNNN AA (e.g. 1012 AB).",
  dutch,
).static;

export const GreekAddressZipCode = SwedishLessZipFactory(
  "Greek Zip Code",
  "Grekiskt postnummer",
  "\u{1F1EC}\u{1F1F7}",
  ["https://www.elta.gr/", "https://en.wikipedia.org/wiki/Postal_codes_in_Greece"],
  Country.tryParse("GR")!,
  "Invalid Greek zip code. Expected 5-digit format (NNN NN).",
  digitsWithSpace(5, 3),
).static;

export const ItalianAddressZipCode = SwedishLessZipFactory(
  "Italian Zip Code",
  "Italienskt postnummer",
  "\u{1F1EE}\u{1F1F9}",
  ["https://www.poste.it/", "https://en.wikipedia.org/wiki/Postal_codes_in_Italy"],
  Country.tryParse("IT")!,
  "Invalid Italian zip code. Expected 5-digit format (NNNNN).",
  fixedDigits(5),
).static;

export const SlovenianAddressZipCode = SwedishLessZipFactory(
  "Slovenian Zip Code",
  "Slovenskt postnummer",
  "\u{1F1F8}\u{1F1EE}",
  ["https://www.posta.si/", "https://en.wikipedia.org/wiki/Postal_codes_in_Slovenia"],
  Country.tryParse("SI")!,
  "Invalid Slovenian zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const CroatianAddressZipCode = SwedishLessZipFactory(
  "Croatian Zip Code",
  "Kroatiskt postnummer",
  "\u{1F1ED}\u{1F1F7}",
  ["https://www.posta.hr/", "https://en.wikipedia.org/wiki/Postal_codes_in_Croatia"],
  Country.tryParse("HR")!,
  "Invalid Croatian zip code. Expected 5-digit format (NNNNN).",
  fixedDigits(5),
).static;

export const PortugueseAddressZipCode = SwedishLessZipFactory(
  "Portuguese Zip Code",
  "Portugisiskt postnummer",
  "\u{1F1F5}\u{1F1F9}",
  ["https://www.ctt.pt/", "https://en.wikipedia.org/wiki/Postal_codes_in_Portugal"],
  Country.tryParse("PT")!,
  "Invalid Portuguese zip code. Expected format NNNN-NNN (e.g. 1100-148).",
  portuguese,
).static;

export const HungarianAddressZipCode = SwedishLessZipFactory(
  "Hungarian Zip Code",
  "Ungerskt postnummer",
  "\u{1F1ED}\u{1F1FA}",
  ["https://www.posta.hu/", "https://en.wikipedia.org/wiki/Postal_codes_in_Hungary"],
  Country.tryParse("HU")!,
  "Invalid Hungarian zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const FrenchAddressZipCode = SwedishLessZipFactory(
  "French Zip Code",
  "Franskt postnummer",
  "\u{1F1EB}\u{1F1F7}",
  ["https://www.laposte.fr/", "https://en.wikipedia.org/wiki/Postal_codes_in_France"],
  Country.tryParse("FR")!,
  "Invalid French zip code. Expected 5-digit format (NNNNN).",
  fixedDigits(5),
).static;

export const SlovakAddressZipCode = SwedishLessZipFactory(
  "Slovak Zip Code",
  "Slovakiskt postnummer",
  "\u{1F1F8}\u{1F1F0}",
  ["https://www.posta.sk/", "https://en.wikipedia.org/wiki/Postal_codes_in_Slovakia"],
  Country.tryParse("SK")!,
  "Invalid Slovak zip code. Expected 5-digit format (NNN NN).",
  digitsWithSpace(5, 3),
).static;

export const BelgianAddressZipCode = SwedishLessZipFactory(
  "Belgian Zip Code",
  "Belgiskt postnummer",
  "\u{1F1E7}\u{1F1EA}",
  ["https://www.bpost.be/", "https://en.wikipedia.org/wiki/Postal_codes_in_Belgium"],
  Country.tryParse("BE")!,
  "Invalid Belgian zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const BritishAddressZipCode = SwedishLessZipFactory(
  "British Postcode",
  "Brittiskt postnummer",
  "\u{1F1EC}\u{1F1E7}",
  ["https://www.royalmail.com/", "https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom"],
  Country.tryParse("GB")!,
  "Invalid British postcode (e.g. SW1A 1AA).",
  british,
).static;

export const AustrianAddressZipCode = SwedishLessZipFactory(
  "Austrian Zip Code",
  "Österrikiskt postnummer",
  "\u{1F1E6}\u{1F1F9}",
  ["https://www.post.at/", "https://en.wikipedia.org/wiki/Postal_codes_in_Austria"],
  Country.tryParse("AT")!,
  "Invalid Austrian zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const CypriotAddressZipCode = SwedishLessZipFactory(
  "Cypriot Zip Code",
  "Cypriotiskt postnummer",
  "\u{1F1E8}\u{1F1FE}",
  ["https://www.cypruspost.post/", "https://en.wikipedia.org/wiki/Postal_codes_in_Cyprus"],
  Country.tryParse("CY")!,
  "Invalid Cypriot zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const IcelandicAddressZipCode = SwedishLessZipFactory(
  "Icelandic Zip Code",
  "Isländskt postnummer",
  "\u{1F1EE}\u{1F1F8}",
  ["https://www.postur.is/", "https://en.wikipedia.org/wiki/Postal_codes_in_Iceland"],
  Country.tryParse("IS")!,
  "Invalid Icelandic zip code. Expected 3-digit format (NNN).",
  fixedDigits(3),
).static;

export const SwissAddressZipCode = SwedishLessZipFactory(
  "Swiss Zip Code",
  "Schweiziskt postnummer",
  "\u{1F1E8}\u{1F1ED}",
  ["https://www.post.ch/", "https://en.wikipedia.org/wiki/Postal_codes_in_Switzerland"],
  Country.tryParse("CH")!,
  "Invalid Swiss zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const IrishAddressZipCode = SwedishLessZipFactory(
  "Irish Eircode",
  "Iriskt postnummer",
  "\u{1F1EE}\u{1F1EA}",
  ["https://www.eircode.ie/", "https://en.wikipedia.org/wiki/Postal_codes_in_Ireland"],
  Country.tryParse("IE")!,
  "Invalid Irish Eircode (e.g. D02 XR20).",
  irish,
).static;

export const LuxembourgishAddressZipCode = SwedishLessZipFactory(
  "Luxembourgish Zip Code",
  "Luxemburgskt postnummer",
  "\u{1F1F1}\u{1F1FA}",
  ["https://www.post.lu/", "https://en.wikipedia.org/wiki/Postal_codes_in_Luxembourg"],
  Country.tryParse("LU")!,
  "Invalid Luxembourgish zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;

export const MalteseAddressZipCode = SwedishLessZipFactory(
  "Maltese Zip Code",
  "Maltesiskt postnummer",
  "\u{1F1F2}\u{1F1F9}",
  ["https://www.maltapost.com/", "https://en.wikipedia.org/wiki/Postal_codes_in_Malta"],
  Country.tryParse("MT")!,
  "Invalid Maltese zip code (e.g. VLT 1535).",
  maltese,
).static;

export const LiechtensteinAddressZipCode = SwedishLessZipFactory(
  "Liechtenstein Zip Code",
  "Liechtensteinskt postnummer",
  "\u{1F1F1}\u{1F1EE}",
  ["https://www.post.li/", "https://en.wikipedia.org/wiki/Postal_codes_in_Liechtenstein"],
  Country.tryParse("LI")!,
  "Invalid Liechtenstein zip code. Expected 4-digit format (NNNN).",
  fixedDigits(4),
).static;
