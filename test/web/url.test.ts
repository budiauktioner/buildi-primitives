import { describe, expect, it } from "vitest";
import { Url, maskUrl } from "../../src/web/index.js";
import { TextMatchConfidence } from "../../src/text-scanning/index.js";

describe("Url.isValid", () => {
  it.each([
    "https://example.com",
    "http://example.com",
    "https://www.example.com/path",
    "https://example.com/path?key=value",
    "https://example.com/path#section",
    "ftp://files.example.com/doc.pdf",
    "https://example.com:8080/",
    "https://sub.domain.example.com",
    "example.com",
    "www.example.com",
    "mailto:user@example.com",
    "tel:+46701234567",
    "ssh://github.com/repo.git",
    "git://github.com/repo.git",
    "sms:+46701234567",
    "callto:+46701234567",
  ])("isValid for %s -> true", (input) => {
    expect(Url.isValid(input)).toBe(true);
  });

  it.each([null, "", "   ", "not a url", "invalid", "just-text"])(
    "isValid for %s -> false",
    (input) => {
      expect(Url.isValid(input)).toBe(false);
    },
  );
});

describe("Url.tryParse / parse", () => {
  it.each([
    ["https://example.com", "https://example.com/"],
    ["HTTP://EXAMPLE.COM", "http://example.com/"],
    ["  https://example.com  ", "https://example.com/"],
    ["example.com", "https://example.com/"],
    ["www.example.com/path", "https://www.example.com/path"],
  ])("normalizes %s -> %s", (input, expected) => {
    const r = Url.tryParse(input);
    expect(r).not.toBeNull();
    expect(r!.value).toBe(expected);
  });

  it.each([null, "", "   ", "not a url"])("returns null for %s", (input) => {
    expect(Url.tryParse(input)).toBeNull();
  });

  it.each([
    ["https://example.com", "https"],
    ["http://example.com", "http"],
    ["ftp://example.com", "ftp"],
    ["ssh://github.com/repo", "ssh"],
    ["git://github.com/repo", "git"],
    ["mailto:user@example.com", "mailto"],
    ["tel:+1234567890", "tel"],
    ["sms:+1234567890", "sms"],
  ])("extracts scheme from %s", (input, expected) => {
    const r = Url.parse(input);
    expect(r.scheme).toBe(expected);
  });

  it("mailto scheme parses authority", () => {
    const r = Url.parse("mailto:user@example.com");
    expect(r.scheme).toBe("mailto");
    expect(r.host).toBe("example.com");
    expect(r.topLevelDomain).toBe("com");
    expect(r.isExampleDomain).toBe(true);
    expect(r.isSecure).toBe(false);
  });

  it.each(["tel:+46701234567", "sms:+46701234567"])(
    "non-hierarchical %s has empty host",
    (input) => {
      const r = Url.parse(input);
      expect(r.host).toBe("");
      expect(r.topLevelDomain).toBe("");
      expect(r.country).toBeNull();
      expect(r.isExampleDomain).toBe(false);
      expect(r.isIpAddress).toBe(false);
      expect(r.isSecure).toBe(false);
    },
  );

  it("extracts host", () => {
    const r = Url.parse("https://www.example.com/path");
    expect(r.host).toBe("www.example.com");
  });

  it("extracts explicit port", () => {
    const r = Url.parse("https://example.com:8080/");
    expect(r.port).toBe(8080);
  });

  it("default port is null", () => {
    expect(Url.parse("https://example.com/").port).toBeNull();
    expect(Url.parse("http://example.com/").port).toBeNull();
  });

  it("extracts path", () => {
    expect(Url.parse("https://example.com/path/to/page").path).toBe("/path/to/page");
  });

  it("extracts query and fragment", () => {
    const r = Url.parse("https://example.com/path?key=value&foo=bar#section");
    expect(r.query).toBe("key=value&foo=bar");
    expect(r.fragment).toBe("section");
  });

  it("no query / no fragment yields null", () => {
    const r = Url.parse("https://example.com/path");
    expect(r.query).toBeNull();
    expect(r.fragment).toBeNull();
  });
});

describe("Url top-level domain and country", () => {
  it("extracts TLD", () => {
    expect(Url.parse("https://www.example.se").topLevelDomain).toBe("se");
  });

  it("maps SE TLD to Sweden", () => {
    const r = Url.parse("https://www.example.se");
    expect(r.country).not.toBeNull();
    expect(r.country!.alpha2Code).toBe("SE");
  });

  it("generic TLD gets no country", () => {
    expect(Url.parse("https://example.com").country).toBeNull();
  });

  it("Norwegian TLD", () => {
    const r = Url.parse("https://vg.no");
    expect(r.country).not.toBeNull();
    expect(r.country!.alpha2Code).toBe("NO");
  });
});

describe("Url isSecure / isExampleDomain / isIpAddress", () => {
  it("https is secure", () => {
    expect(Url.parse("https://example.com").isSecure).toBe(true);
  });
  it("http is not secure", () => {
    expect(Url.parse("http://example.com").isSecure).toBe(false);
  });

  it.each([
    "https://example.com",
    "https://example.org",
    "https://example.net",
    "https://sub.example.com",
    "https://test.test",
    "https://something.invalid",
    "https://app.localhost",
  ])("isExampleDomain true for %s", (input) => {
    expect(Url.parse(input).isExampleDomain).toBe(true);
  });

  it.each(["https://google.com", "https://www.example.se"])(
    "isExampleDomain false for %s",
    (input) => {
      expect(Url.parse(input).isExampleDomain).toBe(false);
    },
  );

  it("isIpAddress true for IP", () => {
    expect(Url.parse("http://192.168.1.1").isIpAddress).toBe(true);
  });
  it("isIpAddress false for domain", () => {
    expect(Url.parse("https://example.com").isIpAddress).toBe(false);
  });
});

describe("Url Parse throws / format / normalize", () => {
  it.each(["not a url", ""])("Parse throws for %s", (input) => {
    expect(() => Url.parse(input)).toThrow();
  });

  it.each([
    ["https://example.com", "https://example.com/"],
    ["HTTP://EXAMPLE.COM/PATH", "http://example.com/PATH"],
    [null, null],
    ["invalid", null],
    ["not-a-url", null],
  ])("format(%s) -> %s", (input, expected) => {
    expect(Url.format(input)).toBe(expected);
  });

  it("format with fallback returns trimmed input", () => {
    expect(Url.format("not a url", { fallbackToTrimmedInputWhenInvalid: true })).toBe("not a url");
  });

  it.each([
    ["https://example.com/", true],
    ["HTTP://EXAMPLE.COM", false],
    ["example.com", false],
  ])("isNormalized(%s) -> %s", (input, expected) => {
    expect(Url.isNormalized(input)).toBe(expected);
  });

  it("toString returns normalized", () => {
    expect(Url.parse("https://example.com").toString()).toBe("https://example.com/");
  });
});

describe("Url auto prefix and SSH", () => {
  it("adds https when no scheme", () => {
    const r = Url.parse("example.com");
    expect(r.scheme).toBe("https");
  });

  it("auto-prefixes domain with port", () => {
    const r = Url.parse("example.com:8080");
    expect(r.scheme).toBe("https");
    expect(r.host).toBe("example.com");
    expect(r.port).toBe(8080);
  });

  it("ssh scheme extracts host and path", () => {
    const r = Url.parse("ssh://github.com/repo.git");
    expect(r.scheme).toBe("ssh");
    expect(r.host).toBe("github.com");
    expect(r.path).toBe("/repo.git");
    expect(r.topLevelDomain).toBe("com");
  });
});

describe("maskUrl", () => {
  it("masks path and query", () => {
    const url = Url.parse("https://www.example.com/secret/page?key=val#top");
    expect(maskUrl(url)).toBe("https://www.example.com/***?***#***");
  });

  it("root path unchanged", () => {
    expect(maskUrl(Url.parse("https://www.example.com"))).toBe("https://www.example.com/");
  });

  it("preserves port", () => {
    expect(maskUrl(Url.parse("https://example.com:8080/path"))).toBe(
      "https://example.com:8080/***",
    );
  });

  it.each([
    ["mailto:user@example.com", "mailto:***"],
    ["tel:+46701234567", "tel:***"],
    ["sms:+46701234567", "sms:***"],
  ])("non-hierarchical %s -> %s", (input, expected) => {
    expect(maskUrl(Url.parse(input))).toBe(expected);
  });
});

describe("Url.findCandidatesInText", () => {
  it("finds https URL", () => {
    const r = Url.findCandidatesInText("Besök oss på https://www.example.com/info tack!");
    expect(r).toHaveLength(1);
    expect(r[0]!.confidence).toBe(TextMatchConfidence.High);
    expect(r[0]!.value.value).toBe("https://www.example.com/info");
  });

  it("finds www URL", () => {
    const r = Url.findCandidatesInText("Se www.example.com för mer info.");
    expect(r).toHaveLength(1);
    expect(r[0]!.originalText).toBe("www.example.com");
  });

  it("finds multiple URLs", () => {
    const r = Url.findCandidatesInText("Kolla https://a.com och https://b.com");
    expect(r).toHaveLength(2);
  });

  it("trims trailing punctuation", () => {
    const r = Url.findCandidatesInText("Besök https://example.com/page.");
    expect(r).toHaveLength(1);
    expect(r[0]!.originalText).toBe("https://example.com/page");
  });

  it("preserves balanced parentheses", () => {
    const r = Url.findCandidatesInText(
      "Se https://en.wikipedia.org/wiki/URL_(disambiguation) för info.",
    );
    expect(r).toHaveLength(1);
    expect(r[0]!.originalText).toContain("(disambiguation)");
  });

  it("returns empty for empty / null input", () => {
    expect(Url.findCandidatesInText("")).toHaveLength(0);
  });

  it("returns empty for text without URLs", () => {
    expect(Url.findCandidatesInText("Vanlig text utan webbadresser.")).toHaveLength(0);
  });

  it("finds mailto link", () => {
    const r = Url.findCandidatesInText("Kontakta oss på mailto:info@example.com tack");
    expect(r).toHaveLength(1);
    expect(r[0]!.value.scheme).toBe("mailto");
    expect(r[0]!.maskedForm).toBe("mailto:***");
  });

  it("finds ssh URL", () => {
    const r = Url.findCandidatesInText("Klona via ssh://git@github.com/repo.git");
    expect(r).toHaveLength(1);
    expect(r[0]!.value.scheme).toBe("ssh");
    expect(r[0]!.value.host).toBe("github.com");
  });

  it("finds tel link", () => {
    const r = Url.findCandidatesInText("Ring tel:+46701234567 för support");
    expect(r).toHaveLength(1);
    expect(r[0]!.value.scheme).toBe("tel");
  });

  it("finds custom scheme", () => {
    const r = Url.findCandidatesInText("Öppna spotify://track/123abc");
    expect(r).toHaveLength(1);
    expect(r[0]!.value.scheme).toBe("spotify");
  });

  it("positions are correct", () => {
    const text = "Prefix https://example.com suffix";
    const r = Url.findCandidatesInText(text);
    expect(r).toHaveLength(1);
    expect(r[0]!.startIndex).toBe(7);
    expect(r[0]!.originalText).toBe("https://example.com");
  });

  it("has masked form", () => {
    const r = Url.findCandidatesInText("Se https://example.com/secret/path");
    expect(r).toHaveLength(1);
    expect(r[0]!.maskedForm).toContain("example.com");
    expect(r[0]!.maskedForm).toContain("***");
  });
});

describe("Url equality and ordering", () => {
  it("same value is equal", () => {
    const a = Url.parse("https://example.com");
    const b = Url.parse("https://example.com");
    expect(a.equals(b)).toBe(true);
  });

  it("different values are not equal", () => {
    const a = Url.parse("https://example.com");
    const b = Url.parse("https://www.example.com/path");
    expect(a.equals(b)).toBe(false);
  });

  it("compareTo orders correctly", () => {
    const a = Url.parse("https://example.com");
    const b = Url.parse("https://google.com");
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(a)).toBe(0);
  });

  it("compareTo null returns positive", () => {
    expect(Url.parse("https://example.com").compareTo(null)).toBe(1);
  });

  it("toUrl exposes a standard URL for interop", () => {
    const url = Url.parse("example.se/path?a=1#top").toUrl();
    expect(url).toBeInstanceOf(URL);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("example.se");
    expect(url.pathname).toBe("/path");
  });

  it("fromUrl round-trips a standard URL", () => {
    const original = Url.parse("https://example.com/a/b");
    expect(Url.fromUrl(original.toUrl()).equals(original)).toBe(true);
  });
});
