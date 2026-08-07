import { describe, expect, it } from "vitest";
import {
  SwedishOcrReferenceNumber,
  OcrReferenceOptions,
  OcrReferenceControlType,
  maskSwedishOcrReferenceNumber,
} from "../../src/banking/index.js";
import { ValidationErrorReason } from "../../src/validation/index.js";

describe("SwedishOcrReferenceNumber.isValid", () => {
  it.each(["18", "26", "12345674"])("returns true for valid Luhn %s", (input) => {
    expect(SwedishOcrReferenceNumber.isValid(input)).toBe(true);
  });

  it.each([null, "", " ", "1", "12345670", "abc"])("returns false for %s", (input) => {
    expect(SwedishOcrReferenceNumber.isValid(input)).toBe(false);
  });
});

describe("SwedishOcrReferenceNumber.tryParse", () => {
  it("returns properties", () => {
    const r = SwedishOcrReferenceNumber.tryParse("12345674")!;
    expect(r.value).toBe("12345674");
    expect(r.length).toBe(8);
    expect(r.checkDigit).toBe(4);
    expect(r.lengthDigit).toBeNull();
  });

  it("strips whitespace and non-digits", () => {
    expect(SwedishOcrReferenceNumber.tryParse(" 12 345 674 ")!.value).toBe("12345674");
  });
});

describe("SwedishOcrReferenceNumber variable length digit", () => {
  it("validates length digit", () => {
    // length=4: second-to-last digit must equal 4 (4 % 10). "1040" is Luhn-valid and matches.
    const r = SwedishOcrReferenceNumber.tryParseVariableLengthDigit("1040");
    expect(r).not.toBeNull();
    expect(r!.lengthDigit).toBe(4);
  });

  it("rejects when length digit doesn't match", () => {
    // length=8 requires second-to-last == 8; "12345674" has 7 there.
    const r = SwedishOcrReferenceNumber.tryParseVariableLengthDigit("12345674");
    expect(r).toBeNull();
  });
});

describe("SwedishOcrReferenceNumber fixed length", () => {
  it("accepts when length matches", () => {
    expect(SwedishOcrReferenceNumber.tryParseFixedLength("12345674", 8)).not.toBeNull();
  });
  it("rejects when length doesn't match", () => {
    expect(SwedishOcrReferenceNumber.tryParseFixedLength("12345674", 10)).toBeNull();
  });
  it("accepts when length is in array", () => {
    expect(SwedishOcrReferenceNumber.tryParseFixedLength("12345674", [6, 8, 10])).not.toBeNull();
  });
});

describe("SwedishOcrReferenceNumber options", () => {
  it("CheckDigitOnly is default", () => {
    expect(OcrReferenceOptions.Default.controlType).toBe(OcrReferenceControlType.CheckDigitOnly);
  });
  it("VariableLengthDigit option", () => {
    expect(OcrReferenceOptions.VariableLengthDigit.controlType).toBe(
      OcrReferenceControlType.VariableLengthDigit,
    );
  });
  it("fixedLength factory", () => {
    const o = OcrReferenceOptions.fixedLength(6, 10);
    expect(o.controlType).toBe(OcrReferenceControlType.FixedLength);
    expect(o.allowedLengths).toEqual([6, 10]);
  });
});

describe("SwedishOcrReferenceNumber.validate", () => {
  it.each([
    [null, false, ValidationErrorReason.InputIsEmpty],
    ["1", false, ValidationErrorReason.InvalidLength],
    ["12", false, ValidationErrorReason.InvalidCheckDigit],
    ["18", true, null],
  ])("validates %s", (input, expected, reason) => {
    const r = SwedishOcrReferenceNumber.validate(input as string | null);
    expect(r.isValid).toBe(expected);
    if (reason) expect(r.issues[0]!.reason).toBe(reason);
  });
});

describe("maskSwedishOcrReferenceNumber", () => {
  it("masks all digits", () => {
    expect(maskSwedishOcrReferenceNumber(SwedishOcrReferenceNumber.parse("12345674"))).toBe(
      "********",
    );
  });
});
