import { Country } from "../geography/index.js";
import { defineCountryAddress } from "./country-address-factory.js";
import * as Z from "./country-zip-codes.js";

export const NorwegianAddress = defineCountryAddress({
  englishName: "Norwegian Address",
  localizedName: "Norsk adress",
  emoji: "\u{1F1F3}\u{1F1F4}",
  sources: ["https://www.posten.no/", "https://en.wikipedia.org/wiki/Postal_codes_in_Norway"],
  country: Country.Norway,
  invalidMessage: "Invalid Norwegian address.",
  zipCode: Z.NorwegianAddressZipCode,
});

export const FinnishAddress = defineCountryAddress({
  englishName: "Finnish Address",
  localizedName: "Finsk adress",
  emoji: "\u{1F1EB}\u{1F1EE}",
  sources: ["https://www.posti.fi/"],
  country: Country.Finland,
  invalidMessage: "Invalid Finnish address.",
  zipCode: Z.FinnishAddressZipCode,
});

export const DanishAddress = defineCountryAddress({
  englishName: "Danish Address",
  localizedName: "Dansk adress",
  emoji: "\u{1F1E9}\u{1F1F0}",
  sources: ["https://www.postnord.dk/"],
  country: Country.Denmark,
  invalidMessage: "Invalid Danish address.",
  zipCode: Z.DanishAddressZipCode,
});

export const GermanAddress = defineCountryAddress({
  englishName: "German Address",
  localizedName: "Tysk adress",
  emoji: "\u{1F1E9}\u{1F1EA}",
  sources: ["https://www.deutschepost.de/"],
  country: Country.Germany,
  invalidMessage: "Invalid German address.",
  zipCode: Z.GermanAddressZipCode,
});

export const PolishAddress = defineCountryAddress({
  englishName: "Polish Address",
  localizedName: "Polsk adress",
  emoji: "\u{1F1F5}\u{1F1F1}",
  sources: ["https://www.poczta-polska.pl/"],
  country: Country.tryParse("PL")!,
  invalidMessage: "Invalid Polish address.",
  zipCode: Z.PolishAddressZipCode,
});

export const EstonianAddress = defineCountryAddress({
  englishName: "Estonian Address",
  localizedName: "Estnisk adress",
  emoji: "\u{1F1EA}\u{1F1EA}",
  sources: ["https://www.omniva.ee/"],
  country: Country.tryParse("EE")!,
  invalidMessage: "Invalid Estonian address.",
  zipCode: Z.EstonianAddressZipCode,
});

export const LithuanianAddress = defineCountryAddress({
  englishName: "Lithuanian Address",
  localizedName: "Litauisk adress",
  emoji: "\u{1F1F1}\u{1F1F9}",
  sources: ["https://www.post.lt/"],
  country: Country.tryParse("LT")!,
  invalidMessage: "Invalid Lithuanian address.",
  zipCode: Z.LithuanianAddressZipCode,
});

export const RomanianAddress = defineCountryAddress({
  englishName: "Romanian Address",
  localizedName: "Rumänsk adress",
  emoji: "\u{1F1F7}\u{1F1F4}",
  sources: ["https://www.posta-romana.ro/"],
  country: Country.tryParse("RO")!,
  invalidMessage: "Invalid Romanian address.",
  zipCode: Z.RomanianAddressZipCode,
});

export const BulgarianAddress = defineCountryAddress({
  englishName: "Bulgarian Address",
  localizedName: "Bulgarisk adress",
  emoji: "\u{1F1E7}\u{1F1EC}",
  sources: ["https://www.bgpost.bg/"],
  country: Country.tryParse("BG")!,
  invalidMessage: "Invalid Bulgarian address.",
  zipCode: Z.BulgarianAddressZipCode,
});

export const LatvianAddress = defineCountryAddress({
  englishName: "Latvian Address",
  localizedName: "Lettisk adress",
  emoji: "\u{1F1F1}\u{1F1FB}",
  sources: ["https://www.pasts.lv/"],
  country: Country.tryParse("LV")!,
  invalidMessage: "Invalid Latvian address.",
  zipCode: Z.LatvianAddressZipCode,
});

export const CzechAddress = defineCountryAddress({
  englishName: "Czech Address",
  localizedName: "Tjeckisk adress",
  emoji: "\u{1F1E8}\u{1F1FF}",
  sources: ["https://www.ceskaposta.cz/"],
  country: Country.tryParse("CZ")!,
  invalidMessage: "Invalid Czech address.",
  zipCode: Z.CzechAddressZipCode,
});

export const SpanishAddress = defineCountryAddress({
  englishName: "Spanish Address",
  localizedName: "Spansk adress",
  emoji: "\u{1F1EA}\u{1F1F8}",
  sources: ["https://www.correos.es/"],
  country: Country.tryParse("ES")!,
  invalidMessage: "Invalid Spanish address.",
  zipCode: Z.SpanishAddressZipCode,
});

export const DutchAddress = defineCountryAddress({
  englishName: "Dutch Address",
  localizedName: "Nederländsk adress",
  emoji: "\u{1F1F3}\u{1F1F1}",
  sources: ["https://www.postnl.nl/"],
  country: Country.tryParse("NL")!,
  invalidMessage: "Invalid Dutch address.",
  zipCode: Z.DutchAddressZipCode,
});

export const GreekAddress = defineCountryAddress({
  englishName: "Greek Address",
  localizedName: "Grekisk adress",
  emoji: "\u{1F1EC}\u{1F1F7}",
  sources: ["https://www.elta.gr/"],
  country: Country.tryParse("GR")!,
  invalidMessage: "Invalid Greek address.",
  zipCode: Z.GreekAddressZipCode,
});

export const ItalianAddress = defineCountryAddress({
  englishName: "Italian Address",
  localizedName: "Italiensk adress",
  emoji: "\u{1F1EE}\u{1F1F9}",
  sources: ["https://www.poste.it/"],
  country: Country.tryParse("IT")!,
  invalidMessage: "Invalid Italian address.",
  zipCode: Z.ItalianAddressZipCode,
});

export const SlovenianAddress = defineCountryAddress({
  englishName: "Slovenian Address",
  localizedName: "Slovensk adress",
  emoji: "\u{1F1F8}\u{1F1EE}",
  sources: ["https://www.posta.si/"],
  country: Country.tryParse("SI")!,
  invalidMessage: "Invalid Slovenian address.",
  zipCode: Z.SlovenianAddressZipCode,
});

export const CroatianAddress = defineCountryAddress({
  englishName: "Croatian Address",
  localizedName: "Kroatisk adress",
  emoji: "\u{1F1ED}\u{1F1F7}",
  sources: ["https://www.posta.hr/"],
  country: Country.tryParse("HR")!,
  invalidMessage: "Invalid Croatian address.",
  zipCode: Z.CroatianAddressZipCode,
});

export const PortugueseAddress = defineCountryAddress({
  englishName: "Portuguese Address",
  localizedName: "Portugisisk adress",
  emoji: "\u{1F1F5}\u{1F1F9}",
  sources: ["https://www.ctt.pt/"],
  country: Country.tryParse("PT")!,
  invalidMessage: "Invalid Portuguese address.",
  zipCode: Z.PortugueseAddressZipCode,
});

export const HungarianAddress = defineCountryAddress({
  englishName: "Hungarian Address",
  localizedName: "Ungersk adress",
  emoji: "\u{1F1ED}\u{1F1FA}",
  sources: ["https://www.posta.hu/"],
  country: Country.tryParse("HU")!,
  invalidMessage: "Invalid Hungarian address.",
  zipCode: Z.HungarianAddressZipCode,
});

export const FrenchAddress = defineCountryAddress({
  englishName: "French Address",
  localizedName: "Fransk adress",
  emoji: "\u{1F1EB}\u{1F1F7}",
  sources: ["https://www.laposte.fr/"],
  country: Country.tryParse("FR")!,
  invalidMessage: "Invalid French address.",
  zipCode: Z.FrenchAddressZipCode,
});

export const SlovakAddress = defineCountryAddress({
  englishName: "Slovak Address",
  localizedName: "Slovakisk adress",
  emoji: "\u{1F1F8}\u{1F1F0}",
  sources: ["https://www.posta.sk/"],
  country: Country.tryParse("SK")!,
  invalidMessage: "Invalid Slovak address.",
  zipCode: Z.SlovakAddressZipCode,
});

export const BelgianAddress = defineCountryAddress({
  englishName: "Belgian Address",
  localizedName: "Belgisk adress",
  emoji: "\u{1F1E7}\u{1F1EA}",
  sources: ["https://www.bpost.be/"],
  country: Country.tryParse("BE")!,
  invalidMessage: "Invalid Belgian address.",
  zipCode: Z.BelgianAddressZipCode,
});

export const BritishAddress = defineCountryAddress({
  englishName: "British Address",
  localizedName: "Brittisk adress",
  emoji: "\u{1F1EC}\u{1F1E7}",
  sources: ["https://www.royalmail.com/"],
  country: Country.tryParse("GB")!,
  invalidMessage: "Invalid British address.",
  zipCode: Z.BritishAddressZipCode,
});

export const AustrianAddress = defineCountryAddress({
  englishName: "Austrian Address",
  localizedName: "Österrikisk adress",
  emoji: "\u{1F1E6}\u{1F1F9}",
  sources: ["https://www.post.at/"],
  country: Country.tryParse("AT")!,
  invalidMessage: "Invalid Austrian address.",
  zipCode: Z.AustrianAddressZipCode,
});

export const CypriotAddress = defineCountryAddress({
  englishName: "Cypriot Address",
  localizedName: "Cypriotisk adress",
  emoji: "\u{1F1E8}\u{1F1FE}",
  sources: ["https://www.cypruspost.post/"],
  country: Country.tryParse("CY")!,
  invalidMessage: "Invalid Cypriot address.",
  zipCode: Z.CypriotAddressZipCode,
});

export const IcelandicAddress = defineCountryAddress({
  englishName: "Icelandic Address",
  localizedName: "Isländsk adress",
  emoji: "\u{1F1EE}\u{1F1F8}",
  sources: ["https://www.postur.is/"],
  country: Country.tryParse("IS")!,
  invalidMessage: "Invalid Icelandic address.",
  zipCode: Z.IcelandicAddressZipCode,
});

export const SwissAddress = defineCountryAddress({
  englishName: "Swiss Address",
  localizedName: "Schweizisk adress",
  emoji: "\u{1F1E8}\u{1F1ED}",
  sources: ["https://www.post.ch/"],
  country: Country.tryParse("CH")!,
  invalidMessage: "Invalid Swiss address.",
  zipCode: Z.SwissAddressZipCode,
});

export const IrishAddress = defineCountryAddress({
  englishName: "Irish Address",
  localizedName: "Irisk adress",
  emoji: "\u{1F1EE}\u{1F1EA}",
  sources: ["https://www.eircode.ie/"],
  country: Country.tryParse("IE")!,
  invalidMessage: "Invalid Irish address.",
  zipCode: Z.IrishAddressZipCode,
});

export const LuxembourgishAddress = defineCountryAddress({
  englishName: "Luxembourgish Address",
  localizedName: "Luxemburgsk adress",
  emoji: "\u{1F1F1}\u{1F1FA}",
  sources: ["https://www.post.lu/"],
  country: Country.tryParse("LU")!,
  invalidMessage: "Invalid Luxembourgish address.",
  zipCode: Z.LuxembourgishAddressZipCode,
});

export const MalteseAddress = defineCountryAddress({
  englishName: "Maltese Address",
  localizedName: "Maltesisk adress",
  emoji: "\u{1F1F2}\u{1F1F9}",
  sources: ["https://www.maltapost.com/"],
  country: Country.tryParse("MT")!,
  invalidMessage: "Invalid Maltese address.",
  zipCode: Z.MalteseAddressZipCode,
});

export const LiechtensteinAddress = defineCountryAddress({
  englishName: "Liechtenstein Address",
  localizedName: "Liechtensteinsk adress",
  emoji: "\u{1F1F1}\u{1F1EE}",
  sources: ["https://www.post.li/"],
  country: Country.tryParse("LI")!,
  invalidMessage: "Invalid Liechtenstein address.",
  zipCode: Z.LiechtensteinAddressZipCode,
});
