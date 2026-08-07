import { afterEach, describe, expect, it } from "vitest";
import { PrimitivesDefaults } from "../../src/primitives-defaults.js";
import { Language, TextDirection, WritingScript } from "../../src/geography/language.js";

describe("Language", () => {
  afterEach(() => PrimitivesDefaults.reset());

  it.each([
    "sv",
    "SV",
    "en",
    "de",
    "ar",
    "zh",
    "swe",
    "eng",
    "deu",
    "Swedish",
    "swedish",
    "English",
    "German",
    "Svenska",
    "Tyska",
    "Deutsch",
    "Français",
    " sv ",
  ])("isValid accepts %s", (input) => {
    expect(Language.isValid(input)).toBe(true);
  });

  it.each([[null], [""], [" "], ["xx"], ["xyz"], ["Klingon"], ["abcdefghij"]])(
    "isValid rejects %s",
    (input) => {
      expect(Language.isValid(input as string | null)).toBe(false);
      expect(Language.tryParse(input as string | null)).toBeNull();
    },
  );

  it.each([
    ["sv", "sv", "swe", "Swedish", "Svenska", "Svenska"],
    ["en", "en", "eng", "English", "Engelska", "English"],
    ["de", "de", "deu", "German", "Tyska", "Deutsch"],
    ["fr", "fr", "fra", "French", "Franska", "Français"],
    ["ar", "ar", "ara", "Arabic", "Arabiska", "العربية"],
    ["zh", "zh", "zho", "Chinese", "Kinesiska", "中文"],
    ["ja", "ja", "jpn", "Japanese", "Japanska", "日本語"],
    ["fi", "fi", "fin", "Finnish", "Finska", "Suomi"],
    ["da", "da", "dan", "Danish", "Danska", "Dansk"],
    ["no", "no", "nor", "Norwegian", "Norska", "Norsk"],
  ])(
    "tryParse(%s) returns expected properties",
    (input, alpha2, alpha3, english, localized, nativeName) => {
      const result = Language.tryParse(input);
      expect(result?.alpha2Code).toBe(alpha2);
      expect(result?.alpha3Code).toBe(alpha3);
      expect(result?.englishName).toBe(english);
      expect(result?.localizedName).toBe(localized);
      expect(result?.nativeName).toBe(nativeName);
    },
  );

  it.each([
    ["swe", "sv"],
    ["deu", "de"],
    ["fra", "fr"],
    ["eng", "en"],
    ["jpn", "ja"],
    ["Swedish", "sv"],
    ["Tyska", "de"],
    ["Deutsch", "de"],
    ["Français", "fr"],
    ["日本語", "ja"],
    ["中文", "zh"],
    ["العربية", "ar"],
  ])("resolves aliases and names %s to %s", (input, expectedAlpha2) => {
    expect(Language.tryParse(input)?.alpha2Code).toBe(expectedAlpha2);
  });

  it("parse throws for invalid inputs", () => {
    expect(() => Language.parse("")).toThrow("Unknown language.");
    expect(() => Language.parse("Klingon")).toThrow("Unknown language.");
  });

  it.each([
    ["sv", "sv"],
    ["SV", "sv"],
    ["swe", "sv"],
    ["Swedish", "sv"],
    ["Svenska", "sv"],
    ["de", "de"],
    ["Deutsch", "de"],
    [" sv ", "sv"],
    [null, null],
    ["", null],
    ["xx", null],
  ])("normalize(%s) returns %s", (input, expected) => {
    expect(Language.normalize(input as string | null)).toBe(expected);
  });

  it("normalize can fall back to trimmed invalid input", () => {
    expect(Language.normalize("xx", { fallbackToTrimmedInputWhenInvalid: true })).toBe("xx");
    expect(Language.normalize(" bogus ", { fallbackToTrimmedInputWhenInvalid: true })).toBe(
      "bogus",
    );
  });

  it.each([
    ["sv", true],
    ["en", true],
    ["de", true],
    ["SV", false],
    ["Swedish", false],
    ["swe", false],
    [null, false],
  ])("isNormalized(%s) returns %s", (input, expected) => {
    expect(Language.isNormalized(input as string | null)).toBe(expected);
  });

  it("format, display string, and toString follow UI culture", () => {
    PrimitivesDefaults.uiCulture = "en-US";
    expect(Language.format("sv")).toBe("Swedish");
    expect(Language.German.toDisplayString()).toBe("German");
    expect(Language.Swedish.toString()).toBe("Swedish");

    PrimitivesDefaults.uiCulture = "sv-SE";
    expect(Language.format("sv")).toBe("Svenska");
    expect(Language.German.toDisplayString()).toBe("Tyska");
    expect(Language.Swedish.toString()).toBe("Svenska");
  });

  it("format returns null or fallback for invalid input", () => {
    expect(Language.format(null)).toBeNull();
    expect(Language.format("")).toBeNull();
    expect(Language.format("xx")).toBeNull();
    expect(Language.format("Klingon", { fallbackToTrimmedInputWhenInvalid: true })).toBe("Klingon");
  });

  it("string helpers expose normalized, English, native, and value forms", () => {
    expect(Language.Swedish.toNormalizedString()).toBe("sv");
    expect(Language.German.toEnglishString()).toBe("German");
    expect(Language.Arabic.toEnglishString()).toBe("Arabic");
    expect(Language.German.toNativeString()).toBe("Deutsch");
    expect(Language.Arabic.toNativeString()).toBe("العربية");
    expect(Language.Japanese.toNativeString()).toBe("日本語");
    expect(Language.Chinese.toNativeString()).toBe("中文");
    expect(Language.Swedish.value).toBe("sv");
  });

  it.each([
    ["ar", WritingScript.Arabic, TextDirection.RightToLeft],
    ["he", WritingScript.Hebrew, TextDirection.RightToLeft],
    ["fa", WritingScript.Arabic, TextDirection.RightToLeft],
    ["ur", WritingScript.Arabic, TextDirection.RightToLeft],
    ["yi", WritingScript.Hebrew, TextDirection.RightToLeft],
    ["ps", WritingScript.Arabic, TextDirection.RightToLeft],
    ["sd", WritingScript.Arabic, TextDirection.RightToLeft],
    ["ug", WritingScript.Arabic, TextDirection.RightToLeft],
    ["dv", WritingScript.Thaana, TextDirection.RightToLeft],
    ["ks", WritingScript.Arabic, TextDirection.RightToLeft],
  ])("marks %s as right-to-left", (alpha2, script, direction) => {
    const lang = Language.parse(alpha2);
    expect(lang.script).toBe(script);
    expect(lang.direction).toBe(direction);
  });

  it.each([
    ["sv", WritingScript.Latin],
    ["en", WritingScript.Latin],
    ["de", WritingScript.Latin],
    ["ru", WritingScript.Cyrillic],
    ["el", WritingScript.Greek],
    ["ja", WritingScript.Han],
    ["ko", WritingScript.Hangul],
    ["th", WritingScript.Thai],
    ["ka", WritingScript.Georgian],
    ["hy", WritingScript.Armenian],
    ["hi", WritingScript.Devanagari],
    ["bn", WritingScript.Bengali],
    ["ta", WritingScript.Tamil],
    ["te", WritingScript.Telugu],
    ["kn", WritingScript.Kannada],
    ["ml", WritingScript.Malayalam],
    ["si", WritingScript.Sinhala],
    ["km", WritingScript.Khmer],
    ["lo", WritingScript.Lao],
    ["my", WritingScript.Myanmar],
    ["am", WritingScript.Ethiopic],
    ["bo", WritingScript.Tibetan],
    ["gu", WritingScript.Gujarati],
    ["pa", WritingScript.Gurmukhi],
  ])("marks %s with expected left-to-right script", (alpha2, script) => {
    const lang = Language.parse(alpha2);
    expect(lang.script).toBe(script);
    expect(lang.direction).toBe(TextDirection.LeftToRight);
  });

  it("all languages have unique alpha-2 codes", () => {
    const codes = Language.all.map((l) => l.alpha2Code);
    expect(Language.all.length).toBeGreaterThanOrEqual(180);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("static properties expose common languages", () => {
    expect(Language.Swedish.alpha2Code).toBe("sv");
    expect(Language.English.alpha2Code).toBe("en");
    expect(Language.German.alpha2Code).toBe("de");
    expect(Language.French.alpha2Code).toBe("fr");
    expect(Language.Spanish.alpha2Code).toBe("es");
    expect(Language.Norwegian.alpha2Code).toBe("no");
    expect(Language.Danish.alpha2Code).toBe("da");
    expect(Language.Finnish.alpha2Code).toBe("fi");
    expect(Language.Icelandic.alpha2Code).toBe("is");
    expect(Language.Dutch.alpha2Code).toBe("nl");
    expect(Language.Italian.alpha2Code).toBe("it");
    expect(Language.Portuguese.alpha2Code).toBe("pt");
    expect(Language.Polish.alpha2Code).toBe("pl");
    expect(Language.Arabic.alpha2Code).toBe("ar");
    expect(Language.Chinese.alpha2Code).toBe("zh");
    expect(Language.Japanese.alpha2Code).toBe("ja");
    expect(Language.Korean.alpha2Code).toBe("ko");
    expect(Language.Russian.alpha2Code).toBe("ru");
    expect(Language.Hindi.alpha2Code).toBe("hi");
    expect(Language.Turkish.alpha2Code).toBe("tr");
  });

  it("equals and compareTo match alpha-2 identity", () => {
    expect(Language.parse("sv").equals(Language.parse("Swedish"))).toBe(true);
    expect(Language.Swedish.equals(Language.English)).toBe(false);
    expect(Language.Danish.compareTo(Language.Swedish)).toBeLessThan(0);
    expect(Language.Swedish.compareTo(Language.Danish)).toBeGreaterThan(0);
    expect(Language.Swedish.compareTo(null)).toBe(1);
  });
});
