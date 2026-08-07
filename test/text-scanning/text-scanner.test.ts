import { describe, expect, it } from "vitest";
import { TextScanner } from "../../src/text-scanning/text-scanner.js";
import { TextCandidate } from "../../src/text-scanning/text-candidate.js";
import { TextCandidateCategory } from "../../src/text-scanning/text-candidate-category.js";
import { TextMatchConfidence } from "../../src/text-scanning/text-match-confidence.js";

function makeCandidate(
  text: string,
  start: number,
  length: number,
  opts?: Partial<{
    typeName: string;
    category: TextCandidateCategory;
    confidence: TextMatchConfidence;
    masked: string;
  }>,
): TextCandidate<string> {
  const original = text.slice(start, start + length);
  return new TextCandidate({
    startIndex: start,
    length,
    originalText: original,
    typeName: opts?.typeName ?? "Mock",
    category: opts?.category ?? TextCandidateCategory.PersonalIdentifier,
    normalizedForm: original,
    formattedForm: original,
    maskedForm: opts?.masked ?? "***",
    confidence: opts?.confidence ?? TextMatchConfidence.Medium,
    value: original,
  });
}

describe("TextScanner", () => {
  it("returns no candidates when nothing is registered", () => {
    const r = new TextScanner().scan("anything");
    expect(r.totalCount).toBe(0);
  });

  it("aggregates candidates from registered scanners", () => {
    const text = "abc def";
    const s = new TextScanner();
    s.register({
      typeName: "Abc",
      category: TextCandidateCategory.Contact,
      scan: (t) => (t.includes("abc") ? [makeCandidate(t, 0, 3, { typeName: "Abc" })] : []),
    });
    s.register({
      typeName: "Def",
      category: TextCandidateCategory.Geography,
      scan: (t) => (t.includes("def") ? [makeCandidate(t, 4, 3, { typeName: "Def" })] : []),
    });
    const r = s.scan(text);
    expect(r.totalCount).toBe(2);
    expect(r.byTypeName("Abc").length).toBe(1);
    expect(r.byTypeName("Def").length).toBe(1);
  });

  it("filters by includeCategories", () => {
    const text = "abc def";
    const s = new TextScanner();
    s.register({
      typeName: "Abc",
      category: TextCandidateCategory.Contact,
      scan: () => [makeCandidate(text, 0, 3, { typeName: "Abc" })],
    });
    s.register({
      typeName: "Def",
      category: TextCandidateCategory.Geography,
      scan: () => [makeCandidate(text, 4, 3, { typeName: "Def" })],
    });
    const r = s.scan(text, {
      includeCategories: new Set([TextCandidateCategory.Contact]),
    });
    expect(r.totalCount).toBe(1);
    expect(r.all[0]!.typeName).toBe("Abc");
  });

  it("filters by minimumConfidence", () => {
    const text = "abcdefg";
    const s = new TextScanner();
    s.register({
      typeName: "Mock",
      category: TextCandidateCategory.Contact,
      scan: () => [
        makeCandidate(text, 0, 3, { confidence: TextMatchConfidence.Low }),
        makeCandidate(text, 4, 3, { confidence: TextMatchConfidence.High }),
      ],
    });
    const r = s.scan(text, { minimumConfidence: TextMatchConfidence.Medium });
    expect(r.totalCount).toBe(1);
    expect(r.all[0]!.confidence).toBe(TextMatchConfidence.High);
  });
});

describe("TextScanResult overlap resolution", () => {
  it("longer enclosing match wins", () => {
    const text = "abcdefghij";
    const inner = makeCandidate(text, 1, 3, { typeName: "Inner" });
    const outer = makeCandidate(text, 0, 8, { typeName: "Outer" });
    const s = new TextScanner();
    s.register({
      typeName: "x",
      category: TextCandidateCategory.Contact,
      scan: () => [inner, outer],
    });
    const r = s.scan(text);
    expect(r.resolvedCandidates.length).toBe(1);
    expect(r.resolvedCandidates[0]!.typeName).toBe("Outer");
  });

  it("higher confidence wins when neither contains the other", () => {
    const text = "aaaaaaaaaa";
    const a = makeCandidate(text, 0, 5, {
      typeName: "Low",
      confidence: TextMatchConfidence.Low,
    });
    const b = makeCandidate(text, 3, 5, {
      typeName: "High",
      confidence: TextMatchConfidence.High,
    });
    const s = new TextScanner();
    s.register({
      typeName: "x",
      category: TextCandidateCategory.Contact,
      scan: () => [a, b],
    });
    const r = s.scan(text);
    expect(r.resolvedCandidates.length).toBe(1);
    expect(r.resolvedCandidates[0]!.typeName).toBe("High");
  });

  it("non-overlapping candidates are kept side-by-side", () => {
    const text = "aaa bbb ccc";
    const a = makeCandidate(text, 0, 3);
    const b = makeCandidate(text, 4, 3);
    const c = makeCandidate(text, 8, 3);
    const s = new TextScanner();
    s.register({
      typeName: "x",
      category: TextCandidateCategory.Contact,
      scan: () => [a, b, c],
    });
    const r = s.scan(text);
    expect(r.resolvedCandidates.length).toBe(3);
  });
});

describe("TextScanResult bulk replacement", () => {
  const text = "left 12345 middle 67890 right";

  function setup() {
    const s = new TextScanner();
    s.register({
      typeName: "Mock",
      category: TextCandidateCategory.Financial,
      scan: () => [
        makeCandidate(text, 5, 5, { masked: "***" }),
        makeCandidate(text, 18, 5, { masked: "***" }),
      ],
    });
    return s.scan(text);
  }

  it("maskAll replaces with maskedForm", () => {
    expect(setup().maskAll(text)).toBe("left *** middle *** right");
  });

  it("redactAll uses the supplied replacement", () => {
    expect(setup().redactAll(text, "[X]")).toBe("left [X] middle [X] right");
  });

  it("replaceAll uses the supplied mapper", () => {
    expect(setup().replaceAll(text, (c) => `<${c.originalText}>`)).toBe(
      "left <12345> middle <67890> right",
    );
  });
});
