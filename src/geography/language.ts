import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { sanitizeInput } from "../internal/input-sanitization.js";

/** Text direction for a writing system. */
export const TextDirection = {
  LeftToRight: "LeftToRight",
  RightToLeft: "RightToLeft",
} as const;
export type TextDirection = (typeof TextDirection)[keyof typeof TextDirection];

/** Primary writing script / writing system used by a language. */
export const WritingScript = {
  Unknown: "Unknown",
  Latin: "Latin",
  Cyrillic: "Cyrillic",
  Arabic: "Arabic",
  Greek: "Greek",
  Hebrew: "Hebrew",
  Devanagari: "Devanagari",
  Bengali: "Bengali",
  Gurmukhi: "Gurmukhi",
  Gujarati: "Gujarati",
  Oriya: "Oriya",
  Tamil: "Tamil",
  Telugu: "Telugu",
  Kannada: "Kannada",
  Malayalam: "Malayalam",
  Sinhala: "Sinhala",
  Thai: "Thai",
  Lao: "Lao",
  Tibetan: "Tibetan",
  Myanmar: "Myanmar",
  Georgian: "Georgian",
  Hangul: "Hangul",
  Ethiopic: "Ethiopic",
  Cherokee: "Cherokee",
  Canadian: "Canadian",
  Khmer: "Khmer",
  Mongolian: "Mongolian",
  Han: "Han",
  Armenian: "Armenian",
  Thaana: "Thaana",
} as const;
export type WritingScript = (typeof WritingScript)[keyof typeof WritingScript];

const MAX_INPUT_LENGTH = 100;

export interface LanguageFormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

/**
 * A language (`språk`) identified by its ISO 639-1 two-letter code, ISO 639-2/T
 * three-letter code, English name, Swedish name, or native name (endonym).
 */
export class Language {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Language",
    localizedName: "Språk",
    emoji: "\u{1F5E3}\uFE0F",
    sources: Object.freeze([
      "https://www.loc.gov/standards/iso639-2/php/code_list.php",
      "https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes",
      "https://iso639-3.sil.org/",
    ]),
  });

  readonly alpha2Code: string;
  readonly alpha3Code: string;
  readonly englishName: string;
  readonly localizedName: string;
  readonly nativeName: string;
  readonly script: WritingScript;
  readonly direction: TextDirection;

  private constructor(
    alpha2: string,
    alpha3: string,
    en: string,
    sv: string,
    native: string,
    script: WritingScript,
    direction: TextDirection,
  ) {
    this.alpha2Code = alpha2;
    this.alpha3Code = alpha3;
    this.englishName = en;
    this.localizedName = sv;
    this.nativeName = native;
    this.script = script;
    this.direction = direction;
  }

  get displayName(): string {
    return PrimitivesDefaults.useLocalizedDisplayNames ? this.localizedName : this.englishName;
  }

  get value(): string {
    return this.alpha2Code;
  }

  /** @internal Used by Country and other types. */
  static _create(
    alpha2: string,
    alpha3: string,
    en: string,
    sv: string,
    native: string,
    script: WritingScript,
    direction: TextDirection = TextDirection.LeftToRight,
  ): Language {
    return new Language(alpha2, alpha3, en, sv, native, script, direction);
  }

  static tryParse(input: string | null | undefined): Language | null {
    if (input == null || input.trim() === "") return null;
    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) return null;
    const lower = trimmed.toLowerCase();
    return BY_KEY.get(lower) ?? null;
  }

  static parse(input: string): Language {
    const r = Language.tryParse(input);
    if (r === null) throw new Error("Unknown language.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Language.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: LanguageFormatOptions): string | null {
    const r = Language.tryParse(input);
    if (r) return r.displayName;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: LanguageFormatOptions,
  ): string | null {
    const r = Language.tryParse(input);
    if (r) return r.alpha2Code;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const trimmed = input.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Language.normalize(input) === input;
  }

  toNormalizedString(): string {
    return this.alpha2Code;
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

  toString(): string {
    return this.displayName;
  }

  equals(other: Language | null | undefined): boolean {
    return other != null && this.alpha2Code === other.alpha2Code;
  }

  compareTo(other: Language | null | undefined): number {
    if (other == null) return 1;
    return this.alpha2Code < other.alpha2Code ? -1 : this.alpha2Code > other.alpha2Code ? 1 : 0;
  }

  /** All recognized ISO 639-1 languages. */
  static get all(): readonly Language[] {
    return ALL;
  }

  // Frequently used language constants — populated below ALL.
  static readonly Afrikaans: Language;
  static readonly Albanian: Language;
  static readonly Arabic: Language;
  static readonly Bulgarian: Language;
  static readonly Catalan: Language;
  static readonly Chinese: Language;
  static readonly Croatian: Language;
  static readonly Czech: Language;
  static readonly Danish: Language;
  static readonly Dutch: Language;
  static readonly English: Language;
  static readonly Estonian: Language;
  static readonly Faroese: Language;
  static readonly Finnish: Language;
  static readonly French: Language;
  static readonly German: Language;
  static readonly Greek: Language;
  static readonly Hindi: Language;
  static readonly Hungarian: Language;
  static readonly Icelandic: Language;
  static readonly Italian: Language;
  static readonly Japanese: Language;
  static readonly Korean: Language;
  static readonly Latvian: Language;
  static readonly Lithuanian: Language;
  static readonly NorthernSami: Language;
  static readonly Norwegian: Language;
  static readonly NorwegianBokmal: Language;
  static readonly NorwegianNynorsk: Language;
  static readonly Polish: Language;
  static readonly Portuguese: Language;
  static readonly Romanian: Language;
  static readonly Russian: Language;
  static readonly Slovak: Language;
  static readonly Slovenian: Language;
  static readonly Spanish: Language;
  static readonly Swahili: Language;
  static readonly Swedish: Language;
  static readonly Turkish: Language;
  static readonly Ukrainian: Language;
}

const L = Language._create;

const ALL: readonly Language[] = Object.freeze([
  L("aa", "aar", "Afar", "Afar", "Afaraf", WritingScript.Latin),
  L("ab", "abk", "Abkhazian", "Abchaziska", "Аҧсуа", WritingScript.Cyrillic),
  L("af", "afr", "Afrikaans", "Afrikaans", "Afrikaans", WritingScript.Latin),
  L("ak", "aka", "Akan", "Akan", "Akan", WritingScript.Latin),
  L("am", "amh", "Amharic", "Amhariska", "አማርኛ", WritingScript.Ethiopic),
  L("an", "arg", "Aragonese", "Aragonesiska", "Aragonés", WritingScript.Latin),
  L("ar", "ara", "Arabic", "Arabiska", "العربية", WritingScript.Arabic, TextDirection.RightToLeft),
  L("as", "asm", "Assamese", "Assamesiska", "অসমীয়া", WritingScript.Bengali),
  L("av", "ava", "Avaric", "Avariska", "Авар", WritingScript.Cyrillic),
  L("ay", "aym", "Aymara", "Aymara", "Aymar", WritingScript.Latin),
  L("az", "aze", "Azerbaijani", "Azerbajdzjanska", "Azərbaycan", WritingScript.Latin),
  L("ba", "bak", "Bashkir", "Basjkiriska", "Башҡорт", WritingScript.Cyrillic),
  L("be", "bel", "Belarusian", "Vitryska", "Беларуская", WritingScript.Cyrillic),
  L("bg", "bul", "Bulgarian", "Bulgariska", "Български", WritingScript.Cyrillic),
  L("bh", "bih", "Bihari", "Bihari", "भोजपुरी", WritingScript.Devanagari),
  L("bi", "bis", "Bislama", "Bislama", "Bislama", WritingScript.Latin),
  L("bm", "bam", "Bambara", "Bambara", "Bamanankan", WritingScript.Latin),
  L("bn", "ben", "Bengali", "Bengali", "বাংলা", WritingScript.Bengali),
  L("bo", "bod", "Tibetan", "Tibetanska", "བོད་ཡིག", WritingScript.Tibetan),
  L("br", "bre", "Breton", "Bretonska", "Brezhoneg", WritingScript.Latin),
  L("bs", "bos", "Bosnian", "Bosniska", "Bosanski", WritingScript.Latin),
  L("ca", "cat", "Catalan", "Katalanska", "Català", WritingScript.Latin),
  L("ce", "che", "Chechen", "Tjetjenska", "Нохчийн", WritingScript.Cyrillic),
  L("ch", "cha", "Chamorro", "Chamorro", "Chamoru", WritingScript.Latin),
  L("co", "cos", "Corsican", "Korsikanska", "Corsu", WritingScript.Latin),
  L("cr", "cre", "Cree", "Cree", "ᓀᐦᐃᔭᐍᐏᐣ", WritingScript.Canadian),
  L("cs", "ces", "Czech", "Tjeckiska", "Čeština", WritingScript.Latin),
  L("cu", "chu", "Church Slavonic", "Kyrkoslaviska", "Словѣньскъ", WritingScript.Cyrillic),
  L("cv", "chv", "Chuvash", "Tjuvasjiska", "Чӑваш", WritingScript.Cyrillic),
  L("cy", "cym", "Welsh", "Walesiska", "Cymraeg", WritingScript.Latin),
  L("da", "dan", "Danish", "Danska", "Dansk", WritingScript.Latin),
  L("de", "deu", "German", "Tyska", "Deutsch", WritingScript.Latin),
  L("dv", "div", "Divehi", "Divehi", "ދިވެހި", WritingScript.Thaana, TextDirection.RightToLeft),
  L("dz", "dzo", "Dzongkha", "Dzongkha", "རྫོང་ཁ", WritingScript.Tibetan),
  L("ee", "ewe", "Ewe", "Ewe", "Eʋegbe", WritingScript.Latin),
  L("el", "ell", "Greek", "Grekiska", "Ελληνικά", WritingScript.Greek),
  L("en", "eng", "English", "Engelska", "English", WritingScript.Latin),
  L("eo", "epo", "Esperanto", "Esperanto", "Esperanto", WritingScript.Latin),
  L("es", "spa", "Spanish", "Spanska", "Español", WritingScript.Latin),
  L("et", "est", "Estonian", "Estniska", "Eesti", WritingScript.Latin),
  L("eu", "eus", "Basque", "Baskiska", "Euskara", WritingScript.Latin),
  L("fa", "fas", "Persian", "Persiska", "فارسی", WritingScript.Arabic, TextDirection.RightToLeft),
  L("ff", "ful", "Fulah", "Fulani", "Fulfulde", WritingScript.Latin),
  L("fi", "fin", "Finnish", "Finska", "Suomi", WritingScript.Latin),
  L("fj", "fij", "Fijian", "Fijianska", "Vosa Vakaviti", WritingScript.Latin),
  L("fo", "fao", "Faroese", "Färöiska", "Føroyskt", WritingScript.Latin),
  L("fr", "fra", "French", "Franska", "Français", WritingScript.Latin),
  L("fy", "fry", "Western Frisian", "Frisiska", "Frysk", WritingScript.Latin),
  L("ga", "gle", "Irish", "Iriska", "Gaeilge", WritingScript.Latin),
  L("gd", "gla", "Scottish Gaelic", "Skotsk gaeliska", "Gàidhlig", WritingScript.Latin),
  L("gl", "glg", "Galician", "Galiciska", "Galego", WritingScript.Latin),
  L("gn", "grn", "Guarani", "Guaraní", "Avañe'ẽ", WritingScript.Latin),
  L("gu", "guj", "Gujarati", "Gujarati", "ગુજરાતી", WritingScript.Gujarati),
  L("gv", "glv", "Manx", "Manx", "Gaelg", WritingScript.Latin),
  L("ha", "hau", "Hausa", "Hausa", "Hausa", WritingScript.Latin),
  L("he", "heb", "Hebrew", "Hebreiska", "עברית", WritingScript.Hebrew, TextDirection.RightToLeft),
  L("hi", "hin", "Hindi", "Hindi", "हिन्दी", WritingScript.Devanagari),
  L("ho", "hmo", "Hiri Motu", "Hiri Motu", "Hiri Motu", WritingScript.Latin),
  L("hr", "hrv", "Croatian", "Kroatiska", "Hrvatski", WritingScript.Latin),
  L("ht", "hat", "Haitian Creole", "Haitisk kreol", "Kreyòl Ayisyen", WritingScript.Latin),
  L("hu", "hun", "Hungarian", "Ungerska", "Magyar", WritingScript.Latin),
  L("hy", "hye", "Armenian", "Armeniska", "Հայերեն", WritingScript.Armenian),
  L("ia", "ina", "Interlingua", "Interlingua", "Interlingua", WritingScript.Latin),
  L("id", "ind", "Indonesian", "Indonesiska", "Bahasa Indonesia", WritingScript.Latin),
  L("ie", "ile", "Interlingue", "Interlingue", "Interlingue", WritingScript.Latin),
  L("ig", "ibo", "Igbo", "Igbo", "Igbo", WritingScript.Latin),
  L("ii", "iii", "Sichuan Yi", "Yi", "ꆈꌠ꒡", WritingScript.Unknown),
  L("ik", "ipk", "Inupiaq", "Inupiaq", "Iñupiaq", WritingScript.Latin),
  L("io", "ido", "Ido", "Ido", "Ido", WritingScript.Latin),
  L("is", "isl", "Icelandic", "Isländska", "Íslenska", WritingScript.Latin),
  L("it", "ita", "Italian", "Italienska", "Italiano", WritingScript.Latin),
  L("iu", "iku", "Inuktitut", "Inuktitut", "ᐃᓄᒃᑎᑐᑦ", WritingScript.Canadian),
  L("ja", "jpn", "Japanese", "Japanska", "日本語", WritingScript.Han),
  L("jv", "jav", "Javanese", "Javanesiska", "Basa Jawa", WritingScript.Latin),
  L("ka", "kat", "Georgian", "Georgiska", "ქართული", WritingScript.Georgian),
  L("kg", "kon", "Kongo", "Kikongo", "KiKongo", WritingScript.Latin),
  L("ki", "kik", "Kikuyu", "Kikuyu", "Gĩkũyũ", WritingScript.Latin),
  L("kj", "kua", "Kuanyama", "Kuanyama", "Kuanyama", WritingScript.Latin),
  L("kk", "kaz", "Kazakh", "Kazakiska", "Қазақша", WritingScript.Cyrillic),
  L("kl", "kal", "Kalaallisut", "Grönländska", "Kalaallisut", WritingScript.Latin),
  L("km", "khm", "Khmer", "Khmer", "ភាសាខ្មែរ", WritingScript.Khmer),
  L("kn", "kan", "Kannada", "Kannada", "ಕನ್ನಡ", WritingScript.Kannada),
  L("ko", "kor", "Korean", "Koreanska", "한국어", WritingScript.Hangul),
  L("kr", "kau", "Kanuri", "Kanuri", "Kanuri", WritingScript.Latin),
  L(
    "ks",
    "kas",
    "Kashmiri",
    "Kashmiri",
    "कश्मीरी",
    WritingScript.Arabic,
    TextDirection.RightToLeft,
  ),
  L("ku", "kur", "Kurdish", "Kurdiska", "Kurdî", WritingScript.Latin),
  L("kv", "kom", "Komi", "Komi", "Коми", WritingScript.Cyrillic),
  L("kw", "cor", "Cornish", "Korniska", "Kernewek", WritingScript.Latin),
  L("ky", "kir", "Kyrgyz", "Kirgiziska", "Кыргызча", WritingScript.Cyrillic),
  L("la", "lat", "Latin", "Latin", "Latina", WritingScript.Latin),
  L("lb", "ltz", "Luxembourgish", "Luxemburgiska", "Lëtzebuergesch", WritingScript.Latin),
  L("lg", "lug", "Ganda", "Luganda", "Luganda", WritingScript.Latin),
  L("li", "lim", "Limburgish", "Limburgiska", "Limburgs", WritingScript.Latin),
  L("ln", "lin", "Lingala", "Lingala", "Lingála", WritingScript.Latin),
  L("lo", "lao", "Lao", "Laotiska", "ພາສາລາວ", WritingScript.Lao),
  L("lt", "lit", "Lithuanian", "Litauiska", "Lietuvių", WritingScript.Latin),
  L("lu", "lub", "Luba-Katanga", "Luba-Katanga", "Kiluba", WritingScript.Latin),
  L("lv", "lav", "Latvian", "Lettiska", "Latviešu", WritingScript.Latin),
  L("mg", "mlg", "Malagasy", "Malagassiska", "Malagasy", WritingScript.Latin),
  L("mh", "mah", "Marshallese", "Marshallesiska", "Kajin M̧ajeļ", WritingScript.Latin),
  L("mi", "mri", "Maori", "Maori", "Te Reo Māori", WritingScript.Latin),
  L("mk", "mkd", "Macedonian", "Makedonska", "Македонски", WritingScript.Cyrillic),
  L("ml", "mal", "Malayalam", "Malayalam", "മലയാളം", WritingScript.Malayalam),
  L("mn", "mon", "Mongolian", "Mongoliska", "Монгол", WritingScript.Cyrillic),
  L("mr", "mar", "Marathi", "Marathi", "मराठी", WritingScript.Devanagari),
  L("ms", "msa", "Malay", "Malajiska", "Bahasa Melayu", WritingScript.Latin),
  L("mt", "mlt", "Maltese", "Maltesiska", "Malti", WritingScript.Latin),
  L("my", "mya", "Burmese", "Burmesiska", "မြန်မာစာ", WritingScript.Myanmar),
  L("na", "nau", "Nauru", "Nauru", "Dorerin Naoero", WritingScript.Latin),
  L("nb", "nob", "Norwegian Bokmål", "Norska (bokmål)", "Norsk bokmål", WritingScript.Latin),
  L("nd", "nde", "Northern Ndebele", "Nordndebele", "isiNdebele", WritingScript.Latin),
  L("ne", "nep", "Nepali", "Nepalesiska", "नेपाली", WritingScript.Devanagari),
  L("ng", "ndo", "Ndonga", "Ndonga", "Owambo", WritingScript.Latin),
  L("nl", "nld", "Dutch", "Nederländska", "Nederlands", WritingScript.Latin),
  L("nn", "nno", "Norwegian Nynorsk", "Norska (nynorsk)", "Norsk nynorsk", WritingScript.Latin),
  L("no", "nor", "Norwegian", "Norska", "Norsk", WritingScript.Latin),
  L("nr", "nbl", "Southern Ndebele", "Sydndebele", "isiNdebele", WritingScript.Latin),
  L("nv", "nav", "Navajo", "Navajo", "Diné Bizaad", WritingScript.Latin),
  L("ny", "nya", "Chichewa", "Chichewa", "Chichewa", WritingScript.Latin),
  L("oc", "oci", "Occitan", "Occitanska", "Occitan", WritingScript.Latin),
  L("oj", "oji", "Ojibwa", "Ojibwa", "ᐊᓂᔑᓈᐯᒧᐎᓐ", WritingScript.Canadian),
  L("om", "orm", "Oromo", "Oromo", "Afaan Oromoo", WritingScript.Latin),
  L("or", "ori", "Oriya", "Oriya", "ଓଡ଼ିଆ", WritingScript.Oriya),
  L("os", "oss", "Ossetian", "Ossetiska", "Ирон", WritingScript.Cyrillic),
  L("pa", "pan", "Punjabi", "Punjabi", "ਪੰਜਾਬੀ", WritingScript.Gurmukhi),
  L("pi", "pli", "Pali", "Pali", "पालि", WritingScript.Devanagari),
  L("pl", "pol", "Polish", "Polska", "Polski", WritingScript.Latin),
  L("ps", "pus", "Pashto", "Pashto", "پښتو", WritingScript.Arabic, TextDirection.RightToLeft),
  L("pt", "por", "Portuguese", "Portugisiska", "Português", WritingScript.Latin),
  L("qu", "que", "Quechua", "Quechua", "Runa Simi", WritingScript.Latin),
  L("rm", "roh", "Romansh", "Rätoromanska", "Rumantsch", WritingScript.Latin),
  L("rn", "run", "Rundi", "Kirundi", "Ikirundi", WritingScript.Latin),
  L("ro", "ron", "Romanian", "Rumänska", "Română", WritingScript.Latin),
  L("ru", "rus", "Russian", "Ryska", "Русский", WritingScript.Cyrillic),
  L("rw", "kin", "Kinyarwanda", "Kinyarwanda", "Ikinyarwanda", WritingScript.Latin),
  L("sa", "san", "Sanskrit", "Sanskrit", "संस्कृतम्", WritingScript.Devanagari),
  L("sc", "srd", "Sardinian", "Sardiska", "Sardu", WritingScript.Latin),
  L("sd", "snd", "Sindhi", "Sindhi", "سنڌي", WritingScript.Arabic, TextDirection.RightToLeft),
  L("se", "sme", "Northern Sami", "Nordsamiska", "Davvisámegiella", WritingScript.Latin),
  L("sg", "sag", "Sango", "Sango", "Yângâ tî Sängö", WritingScript.Latin),
  L("si", "sin", "Sinhala", "Singalesiska", "සිංහල", WritingScript.Sinhala),
  L("sk", "slk", "Slovak", "Slovakiska", "Slovenčina", WritingScript.Latin),
  L("sl", "slv", "Slovenian", "Slovenska", "Slovenščina", WritingScript.Latin),
  L("sm", "smo", "Samoan", "Samoanska", "Gagana Sāmoa", WritingScript.Latin),
  L("sn", "sna", "Shona", "Shona", "ChiShona", WritingScript.Latin),
  L("so", "som", "Somali", "Somaliska", "Soomaali", WritingScript.Latin),
  L("sq", "sqi", "Albanian", "Albanska", "Shqip", WritingScript.Latin),
  L("sr", "srp", "Serbian", "Serbiska", "Српски", WritingScript.Cyrillic),
  L("ss", "ssw", "Swati", "Swati", "SiSwati", WritingScript.Latin),
  L("st", "sot", "Southern Sotho", "Sotho", "Sesotho", WritingScript.Latin),
  L("su", "sun", "Sundanese", "Sundanesiska", "Basa Sunda", WritingScript.Latin),
  L("sv", "swe", "Swedish", "Svenska", "Svenska", WritingScript.Latin),
  L("sw", "swa", "Swahili", "Swahili", "Kiswahili", WritingScript.Latin),
  L("ta", "tam", "Tamil", "Tamil", "தமிழ்", WritingScript.Tamil),
  L("te", "tel", "Telugu", "Telugu", "తెలుగు", WritingScript.Telugu),
  L("tg", "tgk", "Tajik", "Tadzjikiska", "Тоҷикӣ", WritingScript.Cyrillic),
  L("th", "tha", "Thai", "Thailändska", "ไทย", WritingScript.Thai),
  L("ti", "tir", "Tigrinya", "Tigrinja", "ትግርኛ", WritingScript.Ethiopic),
  L("tk", "tuk", "Turkmen", "Turkmeniska", "Türkmen", WritingScript.Latin),
  L("tl", "tgl", "Tagalog", "Tagalog", "Tagalog", WritingScript.Latin),
  L("tn", "tsn", "Tswana", "Tswana", "Setswana", WritingScript.Latin),
  L("to", "ton", "Tongan", "Tonganska", "Lea Faka-Tonga", WritingScript.Latin),
  L("tr", "tur", "Turkish", "Turkiska", "Türkçe", WritingScript.Latin),
  L("ts", "tso", "Tsonga", "Tsonga", "Xitsonga", WritingScript.Latin),
  L("tt", "tat", "Tatar", "Tatariska", "Татар", WritingScript.Cyrillic),
  L("tw", "twi", "Twi", "Twi", "Twi", WritingScript.Latin),
  L("ty", "tah", "Tahitian", "Tahitiska", "Reo Tahiti", WritingScript.Latin),
  L(
    "ug",
    "uig",
    "Uyghur",
    "Uiguriska",
    "ئۇيغۇرچە",
    WritingScript.Arabic,
    TextDirection.RightToLeft,
  ),
  L("uk", "ukr", "Ukrainian", "Ukrainska", "Українська", WritingScript.Cyrillic),
  L("ur", "urd", "Urdu", "Urdu", "اردو", WritingScript.Arabic, TextDirection.RightToLeft),
  L("uz", "uzb", "Uzbek", "Uzbekiska", "Oʻzbek", WritingScript.Latin),
  L("ve", "ven", "Venda", "Venda", "Tshivenḓa", WritingScript.Latin),
  L("vi", "vie", "Vietnamese", "Vietnamesiska", "Tiếng Việt", WritingScript.Latin),
  L("vo", "vol", "Volapük", "Volapük", "Volapük", WritingScript.Latin),
  L("wa", "wln", "Walloon", "Vallonska", "Walon", WritingScript.Latin),
  L("wo", "wol", "Wolof", "Wolof", "Wollof", WritingScript.Latin),
  L("xh", "xho", "Xhosa", "Xhosa", "isiXhosa", WritingScript.Latin),
  L("yi", "yid", "Yiddish", "Jiddisch", "ייִדיש", WritingScript.Hebrew, TextDirection.RightToLeft),
  L("yo", "yor", "Yoruba", "Yoruba", "Yorùbá", WritingScript.Latin),
  L("za", "zha", "Zhuang", "Zhuang", "Saɯ cueŋƅ", WritingScript.Latin),
  L("zh", "zho", "Chinese", "Kinesiska", "中文", WritingScript.Han),
  L("zu", "zul", "Zulu", "Zulu", "isiZulu", WritingScript.Latin),
]);

const BY_KEY = (() => {
  const m = new Map<string, Language>();
  for (const lang of ALL) {
    m.set(lang.alpha2Code, lang);
    m.set(lang.alpha3Code, lang);
    m.set(lang.englishName.toLowerCase(), lang);
    if (!m.has(lang.localizedName.toLowerCase())) {
      m.set(lang.localizedName.toLowerCase(), lang);
    }
    if (
      lang.nativeName.toLowerCase() !== lang.englishName.toLowerCase() &&
      !m.has(lang.nativeName.toLowerCase())
    ) {
      m.set(lang.nativeName.toLowerCase(), lang);
    }
  }
  return m;
})();

const byA2 = (a2: string) => BY_KEY.get(a2)!;

(Language as { Afrikaans: Language }).Afrikaans = byA2("af");
(Language as { Albanian: Language }).Albanian = byA2("sq");
(Language as { Arabic: Language }).Arabic = byA2("ar");
(Language as { Bulgarian: Language }).Bulgarian = byA2("bg");
(Language as { Catalan: Language }).Catalan = byA2("ca");
(Language as { Chinese: Language }).Chinese = byA2("zh");
(Language as { Croatian: Language }).Croatian = byA2("hr");
(Language as { Czech: Language }).Czech = byA2("cs");
(Language as { Danish: Language }).Danish = byA2("da");
(Language as { Dutch: Language }).Dutch = byA2("nl");
(Language as { English: Language }).English = byA2("en");
(Language as { Estonian: Language }).Estonian = byA2("et");
(Language as { Faroese: Language }).Faroese = byA2("fo");
(Language as { Finnish: Language }).Finnish = byA2("fi");
(Language as { French: Language }).French = byA2("fr");
(Language as { German: Language }).German = byA2("de");
(Language as { Greek: Language }).Greek = byA2("el");
(Language as { Hindi: Language }).Hindi = byA2("hi");
(Language as { Hungarian: Language }).Hungarian = byA2("hu");
(Language as { Icelandic: Language }).Icelandic = byA2("is");
(Language as { Italian: Language }).Italian = byA2("it");
(Language as { Japanese: Language }).Japanese = byA2("ja");
(Language as { Korean: Language }).Korean = byA2("ko");
(Language as { Latvian: Language }).Latvian = byA2("lv");
(Language as { Lithuanian: Language }).Lithuanian = byA2("lt");
(Language as { NorthernSami: Language }).NorthernSami = byA2("se");
(Language as { Norwegian: Language }).Norwegian = byA2("no");
(Language as { NorwegianBokmal: Language }).NorwegianBokmal = byA2("nb");
(Language as { NorwegianNynorsk: Language }).NorwegianNynorsk = byA2("nn");
(Language as { Polish: Language }).Polish = byA2("pl");
(Language as { Portuguese: Language }).Portuguese = byA2("pt");
(Language as { Romanian: Language }).Romanian = byA2("ro");
(Language as { Russian: Language }).Russian = byA2("ru");
(Language as { Slovak: Language }).Slovak = byA2("sk");
(Language as { Slovenian: Language }).Slovenian = byA2("sl");
(Language as { Spanish: Language }).Spanish = byA2("es");
(Language as { Swahili: Language }).Swahili = byA2("sw");
(Language as { Swedish: Language }).Swedish = byA2("sv");
(Language as { Turkish: Language }).Turkish = byA2("tr");
(Language as { Ukrainian: Language }).Ukrainian = byA2("uk");
