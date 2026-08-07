import { describe, expect, it } from "vitest";
import {
  collapseWhitespace,
  keepAsciiAlphanumericUppercase,
  keepDigits,
  sanitizeInput,
} from "../../src/internal/input-sanitization.js";

describe("sanitizeInput", () => {
  it("strips invisible LRE/RLE/ZWJ format characters", () => {
    expect(sanitizeInput("a\u202Ab\u200Dc")).toBe("abc");
  });

  it("normalizes typographic single quotes to ASCII apostrophe", () => {
    expect(sanitizeInput("\u2018a\u2019")).toBe("'a'");
    expect(sanitizeInput("a\u201Ab\u201Bc")).toBe("a'b'c");
  });

  it("normalizes typographic and guillemet double quotes to ASCII quote", () => {
    expect(sanitizeInput("\u201Cabc\u201D")).toBe('"abc"');
    expect(sanitizeInput("\u00ABabc\u00BB")).toBe('"abc"');
    expect(sanitizeInput("\u201Eabc\u201F")).toBe('"abc"');
  });

  it("converts tab/newline/carriage return to ASCII space", () => {
    expect(sanitizeInput("a\tb\nc\rd")).toBe("a b c d");
  });

  it("converts Unicode space separators to ASCII space", () => {
    expect(sanitizeInput("a\u00A0b")).toBe("a b");
    expect(sanitizeInput("a\u2003b")).toBe("a b");
  });

  it("drops other control characters", () => {
    expect(sanitizeInput("a\u0007b")).toBe("ab");
  });
});

describe("collapseWhitespace", () => {
  it("returns empty string for null/undefined", () => {
    expect(collapseWhitespace(null)).toBe("");
    expect(collapseWhitespace(undefined)).toBe("");
  });

  it("trims and collapses runs of whitespace", () => {
    expect(collapseWhitespace("  a   b\tc\n d ")).toBe("a b c d");
  });

  it("normalizes invisible characters before collapsing", () => {
    expect(collapseWhitespace("\u202A  hello \u00A0 world  ")).toBe("hello world");
  });
});

describe("keepDigits", () => {
  it("keeps only ASCII digits", () => {
    expect(keepDigits("19880829-1234")).toBe("198808291234");
    expect(keepDigits("abc 1.2.3 def")).toBe("123");
  });

  it("returns empty string when nothing matches", () => {
    expect(keepDigits("")).toBe("");
    expect(keepDigits("abc")).toBe("");
  });
});

describe("keepAsciiAlphanumericUppercase", () => {
  it("uppercases letters and strips other characters", () => {
    expect(keepAsciiAlphanumericUppercase("se 12 34 56 78 90")).toBe("SE1234567890");
    expect(keepAsciiAlphanumericUppercase("aAbB-C123")).toBe("AABBC123");
  });
});
