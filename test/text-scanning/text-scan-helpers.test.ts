import { describe, expect, it } from "vitest";
import {
  isAlreadyCovered,
  isStrongStart,
  isWordBoundary,
  scanBackward,
  scanForward,
} from "../../src/text-scanning/text-scan-helpers.js";

describe("scanForward", () => {
  it("stops at sentence-ending punctuation", () => {
    const text = "Hello world. More text.";
    expect(scanForward(text, 0, 100)).toBe(11);
  });

  it("stops at double newline", () => {
    const text = "Hello world\n\nMore text";
    expect(scanForward(text, 0, 100)).toBe(11);
  });

  it("respects maxDistance", () => {
    expect(scanForward("aaaaaaaaaa", 0, 5)).toBe(5);
  });

  it("includes a country-name word after a comma", () => {
    const text = "Stora Vägen 1, Sverige";
    expect(text.slice(0, scanForward(text, 0, 100))).toBe("Stora Vägen 1, Sverige");
  });
});

describe("scanBackward", () => {
  it("stops at sentence-ending punctuation", () => {
    const text = "Stop. start here";
    const start = scanBackward(text, text.length, 100);
    expect(text.slice(start)).toBe("start here");
  });

  it("respects maxDistance", () => {
    const text = "aaaaaaaaaa";
    expect(scanBackward(text, 10, 4)).toBe(6);
  });
});

describe("isWordBoundary", () => {
  it("treats start of string as a boundary", () => {
    expect(isWordBoundary("abc", 0)).toBe(true);
  });

  it("treats positions after whitespace/punctuation as boundaries", () => {
    expect(isWordBoundary("a b", 2)).toBe(true);
    expect(isWordBoundary("a,b", 2)).toBe(true);
  });

  it("does not treat mid-word positions as boundaries", () => {
    expect(isWordBoundary("abc", 1)).toBe(false);
  });
});

describe("isAlreadyCovered", () => {
  it("detects overlap", () => {
    expect(isAlreadyCovered([[5, 10]], 7, 12)).toBe(true);
    expect(isAlreadyCovered([[5, 10]], 0, 5)).toBe(false);
    expect(isAlreadyCovered([[5, 10]], 10, 15)).toBe(false);
  });
});

describe("isStrongStart", () => {
  it("returns true after sentence punctuation followed by space", () => {
    expect(isStrongStart("Hello. World", 7)).toBe(true);
    expect(isStrongStart("Hello: World", 7)).toBe(true);
  });

  it("returns true at start of a new line", () => {
    expect(isStrongStart("Hello\nWorld", 6)).toBe(true);
  });

  it("returns false in the middle of a clause", () => {
    expect(isStrongStart("Hello world", 6)).toBe(false);
  });
});
