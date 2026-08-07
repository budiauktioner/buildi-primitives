import { describe, expect, it } from "vitest";
import {
  EmailAddress,
  PublicEmailProvider,
  maskEmailAddress,
  toMailtoUri,
} from "../../src/web/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("EmailAddress.tryParse / parse", () => {
  it.each([
    ["user@example.com", "user@example.com"],
    ["User@Example.COM", "user@example.com"],
    ["  user@example.com  ", "user@example.com"],
    ["user+tag@example.com", "user+tag@example.com"],
  ])("parses valid input %s -> %s", (input, expected) => {
    const r = EmailAddress.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.value).toBe(expected);
  });

  it.each([null, "", "   ", "notanemail", "@example.com", "user@"])(
    "fails on invalid input %s",
    (input) => {
      expect(EmailAddress.tryParse(input)).toBeNull();
    },
  );

  it("extracts local part and domain", () => {
    const r = EmailAddress.parse("user@example.com");
    expect(r.localPart).toBe("user");
    expect(r.domain).toBe("example.com");
  });

  it("extracts top-level domain", () => {
    const r = EmailAddress.parse("user@example.com");
    expect(r.topLevelDomain).toBe("com");
  });

  it("maps country-code TLD", () => {
    const r = EmailAddress.parse("user@company.se");
    expect(r.topLevelDomain).toBe("se");
    expect(r.country).not.toBeNull();
    expect(r.country!.englishName).toBe("Sweden");
  });

  it("returns null country for generic TLD", () => {
    const r = EmailAddress.parse("user@example.com");
    expect(r.country).toBeNull();
  });

  it.each([
    ["user@gmail.com", PublicEmailProvider.Gmail],
    ["user@hotmail.com", PublicEmailProvider.Outlook],
    ["user@yahoo.com", PublicEmailProvider.Yahoo],
    ["user@telia.com", PublicEmailProvider.Telia],
  ])("detects provider %s -> %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.provider).toBe(expected);
    expect(r.isPublicEmailProvider).toBe(true);
  });

  it("returns null provider for unknown domain", () => {
    const r = EmailAddress.parse("user@company.example");
    expect(r.provider).toBeNull();
    expect(r.isPublicEmailProvider).toBe(false);
  });

  it.each([
    ["user@wp.pl", PublicEmailProvider.WirtualnaPolska],
    ["user@onet.pl", PublicEmailProvider.Onet],
    ["user@o2.pl", PublicEmailProvider.Onet],
    ["user@interia.pl", PublicEmailProvider.Interia],
    ["user@web.de", PublicEmailProvider.WebDe],
    ["user@mail.ru", PublicEmailProvider.MailRu],
    ["user@abv.bg", PublicEmailProvider.Abv],
    ["user@inbox.lv", PublicEmailProvider.InboxLv],
    ["user@seznam.cz", PublicEmailProvider.Seznam],
    ["user@libero.it", PublicEmailProvider.Libero],
    ["user@naver.com", PublicEmailProvider.Naver],
    ["user@freemail.hu", PublicEmailProvider.FreemailHu],
    ["user@ukr.net", PublicEmailProvider.UkrNet],
    ["user@tuta.io", PublicEmailProvider.Tuta],
    ["user@tutanota.com", PublicEmailProvider.Tuta],
    ["user@hey.com", PublicEmailProvider.Hey],
    ["user@duck.com", PublicEmailProvider.DuckDuckGoEmail],
    ["user@simplelogin.com", PublicEmailProvider.SimpleLogin],
    ["user@bredband2.com", PublicEmailProvider.Bredband2],
    ["user@ownit.nu", PublicEmailProvider.Ownit],
    ["user@online.no", PublicEmailProvider.OnlineNo],
    ["user@kolumbus.fi", PublicEmailProvider.Kolumbus],
    ["user@aland.net", PublicEmailProvider.Aland],
    ["user@rocketmail.com", PublicEmailProvider.Yahoo],
    ["user@windowslive.com", PublicEmailProvider.Outlook],
    ["user@protonmail.ch", PublicEmailProvider.ProtonMail],
    ["user@yahoo.it", PublicEmailProvider.Yahoo],
    ["user@hotmail.it", PublicEmailProvider.Outlook],
    ["user@live.fr", PublicEmailProvider.Outlook],
    ["user@outlook.se", PublicEmailProvider.Outlook],
  ])("detects regional provider %s -> %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.provider).toBe(expected);
  });

  it("parse throws on invalid input", () => {
    expect(() => EmailAddress.parse("notanemail")).toThrow();
  });

  it.each([
    ["user@example.com", true],
    ["notanemail", false],
    [null, false],
  ])("isValid for %s -> %s", (input, expected) => {
    expect(EmailAddress.isValid(input)).toBe(expected);
  });

  it.each([
    ["User@Example.COM", "user@example.com"],
    ["notanemail", null],
    [null, null],
  ])("normalize %s -> %s", (input, expected) => {
    expect(EmailAddress.normalize(input)).toBe(expected);
  });

  it("toString and toNormalizedString return value", () => {
    const r = EmailAddress.parse("user@example.com");
    expect(r.toString()).toBe("user@example.com");
    expect(r.toNormalizedString()).toBe("user@example.com");
  });
});

describe("EmailAddress mailto and display-name extraction", () => {
  it.each([
    ["mailto:user@example.com", "user@example.com"],
    ["MAILTO:user@example.com", "user@example.com"],
    ["mailto: user@example.com", "user@example.com"],
    ["mailto:oresundsplattsattning@gmail.com", "oresundsplattsattning@gmail.com"],
  ])("strips mailto prefix from %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });

  it.each([
    ["John Doe <john@example.com>", "john@example.com"],
    ['"John Doe" <john@example.com>', "john@example.com"],
    ["<john@example.com>", "john@example.com"],
    ["John Doe <JOHN@Example.COM>", "john@example.com"],
    ["John <john@example.com> ", "john@example.com"],
  ])("extracts email from display-name format %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });

  it.each([
    ["<mailto:john@example.com>", "john@example.com"],
    ["<mailto:john@example.com?subject=Hello>", "john@example.com"],
  ])("handles mailto inside angle brackets %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });

  it.each([
    ["mailto:user@example.com?subject=Hello", "user@example.com"],
    ["mailto:user@example.com?subject=Hello&body=World", "user@example.com"],
    ["mailto:user@example.com?subject=Hello%20World&cc=other@example.com", "user@example.com"],
    ["mailto:user@example.com?body=Check%20this%20out", "user@example.com"],
    ["MAILTO:User@Example.COM?Subject=Test", "user@example.com"],
  ])("strips mailto query string from %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });
});

describe("EmailAddress sanitization", () => {
  it.each([
    ["user@example.com.", "user@example.com"],
    ["katarina.lofberg@enkoping.se.", "katarina.lofberg@enkoping.se"],
    ["tonylindqvist206@hotmail.com.", "tonylindqvist206@hotmail.com"],
  ])("strips trailing dot from %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });

  it.each([
    ["user@example.com\u200B", "user@example.com"],
    ["\u200Buser@example.com", "user@example.com"],
    ["user\u200B@example.com", "user@example.com"],
    ["user@example\u200B.com", "user@example.com"],
  ])("strips invisible characters", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });

  it.each([
    ["bamfo @hotmail.com", "bamfo@hotmail.com"],
    ["user @example.com", "user@example.com"],
  ])("removes internal whitespace from %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });

  it.each([
    ["_anton@live.se", "_anton@live.se"],
    ["_user@example.com", "_user@example.com"],
  ])("allows leading underscore in local part: %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });
});

describe("EmailAddress IDN domains", () => {
  it.each([
    ["stefan@högquist.se", "stefan@högquist.se"],
    ["micke@lindströmsskylt.se", "micke@lindströmsskylt.se"],
    ["info@flinksbetonghåltagning.se", "info@flinksbetonghåltagning.se"],
    ["jo@ohöinplattsattning.se", "jo@ohöinplattsattning.se"],
  ])("handles IDN domain %s", (input, expected) => {
    const r = EmailAddress.parse(input);
    expect(r.value).toBe(expected);
  });

  it("idn domain extracts ascii form and country", () => {
    const r = EmailAddress.parse("stefan@högquist.se");
    expect(r.localPart).toBe("stefan");
    expect(r.domain).toBe("högquist.se");
    expect(r.topLevelDomain).toBe("se");
    expect(r.country).not.toBeNull();
    expect(r.country!.englishName).toBe("Sweden");
    expect(r.isInternationalizedDomain).toBe(true);
    expect(r.domainAscii).not.toBe(r.domain);
    expect(r.domainAscii.startsWith("xn--")).toBe(true);
    expect(r.domainAscii.endsWith(".se")).toBe(true);
  });

  it("ascii domain is not internationalized", () => {
    const r = EmailAddress.parse("user@example.com");
    expect(r.isInternationalizedDomain).toBe(false);
    expect(r.domainAscii).toBe("example.com");
    expect(r.domainAscii).toBe(r.domain);
  });

  it("toAsciiString returns punycode for IDN domains", () => {
    const r = EmailAddress.parse("user@örneholm.com");
    expect(r.toString()).toBe("user@örneholm.com");
    expect(r.toAsciiString().startsWith("user@xn--")).toBe(true);
    expect(r.toAsciiString().endsWith(".com")).toBe(true);
  });

  it("toAsciiString equals toString for ascii domains", () => {
    const r = EmailAddress.parse("user@example.com");
    expect(r.toAsciiString()).toBe(r.toString());
  });
});

describe("EmailAddress typo correction", () => {
  it.each([
    ["user@gnail.com", "gmail.com"],
    ["user@gamil.com", "gmail.com"],
    ["user@gmai.com", "gmail.com"],
    ["user@gmail.con", "gmail.com"],
    ["user@gmail.vom", "gmail.com"],
    ["user@gmail.cim", "gmail.com"],
    ["user@gmail.comi", "gmail.com"],
    ["user@gmail.se", "gmail.com"],
    ["user@gmail.co", "gmail.com"],
  ])("fixes Gmail misspelling %s -> %s", (input, expected) => {
    const r = EmailAddress.tryParse(input, { tryCorrectTypos: true });
    expect(r).not.toBeNull();
    expect(r!.domain).toBe(expected);
    expect(r!.wasCorrected).toBe(true);
    expect(r!.provider).toBe(PublicEmailProvider.Gmail);
  });

  it.each([
    ["user@hotmai.com", "hotmail.com"],
    ["user@hotmil.com", "hotmail.com"],
    ["user@hotmail.con", "hotmail.com"],
    ["user@outlook.con", "outlook.com"],
  ])("fixes Hotmail/Outlook misspelling %s -> %s", (input, expected) => {
    const r = EmailAddress.tryParse(input, { tryCorrectTypos: true });
    expect(r).not.toBeNull();
    expect(r!.domain).toBe(expected);
    expect(r!.wasCorrected).toBe(true);
    expect(r!.provider).toBe(PublicEmailProvider.Outlook);
  });

  it.each([
    ["user@icloude.com", "icloud.com"],
    ["user@icloud.se", "icloud.com"],
    ["user@icloud.co", "icloud.com"],
  ])("fixes iCloud misspelling %s -> %s", (input, expected) => {
    const r = EmailAddress.tryParse(input, { tryCorrectTypos: true });
    expect(r).not.toBeNull();
    expect(r!.domain).toBe(expected);
    expect(r!.wasCorrected).toBe(true);
    expect(r!.provider).toBe(PublicEmailProvider.ICloud);
  });

  it("preserves original domain after correction", () => {
    const r = EmailAddress.tryParse("user@gnail.com", { tryCorrectTypos: true });
    expect(r).not.toBeNull();
    expect(r!.originalDomain).toBe("gnail.com");
    expect(r!.domain).toBe("gmail.com");
    expect(r!.value).toBe("user@gmail.com");
  });

  it("does not mark valid email as corrected", () => {
    const r = EmailAddress.tryParse("user@gmail.com", { tryCorrectTypos: true });
    expect(r).not.toBeNull();
    expect(r!.wasCorrected).toBe(false);
    expect(r!.originalDomain).toBeNull();
  });

  it("does not correct when option is off", () => {
    const r = EmailAddress.tryParse("user@gnail.com");
    expect(r).not.toBeNull();
    expect(r!.domain).toBe("gnail.com");
    expect(r!.wasCorrected).toBe(false);
    expect(r!.originalDomain).toBeNull();
  });

  it("format with typo correction returns corrected", () => {
    expect(EmailAddress.format("user@gnail.com", { tryCorrectTypos: true })).toBe("user@gmail.com");
  });

  it("normalize with typo correction returns corrected", () => {
    expect(EmailAddress.normalize("user@gmail.con", { tryCorrectTypos: true })).toBe(
      "user@gmail.com",
    );
  });
});

describe("EmailAddress invalid edge cases", () => {
  it.each([
    "olles.@oktv.se",
    "fotografspider.@gmail.com",
    "rabei.taha.altaha.@gmail.com",
    "hlena..ua@gmail.com",
    "diana..persson@icloud.com",
    "biljana.celar@biljana.celar@hotmail.se",
    "magnus.lefvert@@lwab.se",
    "rooftop@gambia@gmail.com",
    "kenneth.markl####und@gmail.com",
    "david@alveskars.e",
    "leifgustafsson49@gmail.co.n",
    "lars-erik@zleep.se6",
    "mariasjodin(@gmail.com",
    "oldgus56@)gmail.com",
    "albert@£take1.se",
    "jennie.z@mac.",
    "10366",
    "moayad",
    "rasmus",
    "karolina",
    "mikaela",
    "eva74eva",
    "benedetto santoro",
    "mattias bratt",
    "christopher eriksson",
    "pdabyggab",
  ])("remains invalid for genuinely bad input: %s", (input) => {
    expect(EmailAddress.tryParse(input)).toBeNull();
  });
});

describe("EmailAddress equality and ordering", () => {
  it("same value is equal", () => {
    const a = EmailAddress.parse("user@example.com");
    const b = EmailAddress.parse("user@example.com");
    expect(a.equals(b)).toBe(true);
  });

  it("different values are not equal", () => {
    const a = EmailAddress.parse("user@example.com");
    const b = EmailAddress.parse("user+tag@example.com");
    expect(a.equals(b)).toBe(false);
  });

  it("compareTo orders correctly", () => {
    const a = EmailAddress.parse("user+tag@example.com");
    const b = EmailAddress.parse("user@example.com");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(a)).toBe(0);
  });

  it("compareTo null returns positive", () => {
    const a = EmailAddress.parse("user@example.com");
    expect(a.compareTo(null)).toBe(1);
  });
});

describe("EmailAddress.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["", false, ValidationErrorReason.InputIsEmpty],
    [" ", false, ValidationErrorReason.InputIsEmpty],
    ["user", false, ValidationErrorReason.MissingAtSign],
    ["user@", false, ValidationErrorReason.MissingAtSign],
    ["@example.com", false, ValidationErrorReason.MissingAtSign],
    ["user@.com", false, ValidationErrorReason.InvalidFormat],
    ["user@example.com", true, null],
  ])("validate(%s) isValid=%s reason=%s", (input, expectedIsValid, expectedReason) => {
    const r = EmailAddress.validate(input);
    expect(r.rawInput).toBe(input ?? null);
    expect(r.isValid).toBe(expectedIsValid);
    if (expectedReason != null) {
      expect(r.issues).toHaveLength(1);
      expect(r.issues[0]!.reason).toBe(expectedReason);
    } else {
      expect(r.issues).toHaveLength(0);
    }
  });

  it("issues contain both language descriptions", () => {
    const r = EmailAddress.validate("user");
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0]!.englishDescription.trim().length).toBeGreaterThan(0);
    expect(r.issues[0]!.localizedDescription.trim().length).toBeGreaterThan(0);
  });

  it.each(["user@example.com", null, "", "user", "user@", "@example.com", "user@.com"])(
    "validate.isValid matches isValid for %s",
    (input) => {
      expect(EmailAddress.validate(input).isValid).toBe(EmailAddress.isValid(input));
    },
  );
});

describe("maskEmailAddress", () => {
  it.each([
    ["peter@example.com", false, "p***@example.com"],
    ["peter.orneholm@example.com", false, "p***@example.com"],
    ["ab@example.com", false, "a*@example.com"],
    ["a@example.com", false, "a@example.com"],
    ["peter@example.com", true, "p***@e***.com"],
    ["user@mail.co.uk", true, "u***@m***.co.uk"],
  ])("masks %s (maskDomain=%s) -> %s", (input, maskDomain, expected) => {
    expect(maskEmailAddress(EmailAddress.parse(input), { maskDomain })).toBe(expected);
  });

  it("default does not mask domain", () => {
    const e = EmailAddress.parse("peter@example.com");
    const masked = maskEmailAddress(e);
    expect(masked).toContain("@example.com");
    expect(masked).not.toContain("peter");
  });
});

describe("toMailtoUri", () => {
  it("returns mailto: URI", () => {
    const e = EmailAddress.parse("info@example.com");
    expect(toMailtoUri(e)).toBe("mailto:info@example.com");
  });
});
