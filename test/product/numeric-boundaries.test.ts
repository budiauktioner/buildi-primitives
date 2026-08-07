import { describe, expect, it } from "vitest";
import {
  CameraResolution,
  OperatingSystemVersion,
  ScreenResolution,
} from "../../src/product/index.js";

const MAX_INT32 = 2_147_483_647;

describe("ScreenResolution numeric boundaries", () => {
  it("rejects dimensions outside the positive Int32 domain", () => {
    expect(ScreenResolution.tryParse(`${"9".repeat(400)}x1080`)).toBeNull();
    expect(ScreenResolution.tryParse(`${MAX_INT32 + 1}x1080`)).toBeNull();
    expect(() => ScreenResolution.create(MAX_INT32 + 1, 1080)).toThrow(RangeError);
    expect(() => ScreenResolution.create(Number.POSITIVE_INFINITY, 1080)).toThrow(RangeError);
  });

  it("accepts the maximum Int32 dimension", () => {
    expect(ScreenResolution.create(MAX_INT32, 1).width).toBe(MAX_INT32);
    expect(ScreenResolution.tryParse(`${MAX_INT32}x1`)?.width).toBe(MAX_INT32);
  });

  it("calculates and compares total pixels exactly", () => {
    const a = ScreenResolution.create(100_000_000, 100_000_002);
    const b = ScreenResolution.create(100_000_001, 100_000_001);

    expect(a.totalPixels).toBe(10_000_000_200_000_000n);
    expect(b.totalPixels).toBe(10_000_000_200_000_001n);
    expect(a.compareTo(b)).toBe(-1);
  });
});

describe("OperatingSystemVersion numeric boundaries", () => {
  it("accepts Int32-bounded components", () => {
    const version = OperatingSystemVersion.tryParse(
      `${MAX_INT32}.${MAX_INT32}.${MAX_INT32}.${MAX_INT32}`,
    );

    expect(version).not.toBeNull();
    expect(version?.build).toBe(MAX_INT32);
  });

  it.each([
    `${MAX_INT32 + 1}`,
    `1.${MAX_INT32 + 1}`,
    `1.2.${MAX_INT32 + 1}`,
    `1.2.3.${MAX_INT32 + 1}`,
    "999999999999999999999999",
  ])("rejects an out-of-range component in %s", (input) => {
    expect(OperatingSystemVersion.tryParse(input)).toBeNull();
    expect(OperatingSystemVersion.isValid(input)).toBe(false);
  });
});

describe("CameraResolution total-pixel factory", () => {
  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "rejects %s because it is not a non-negative safe integer",
    (totalPixels) => {
      expect(() => CameraResolution.fromTotalPixels(totalPixels)).toThrow(RangeError);
    },
  );

  it("accepts a non-negative safe integer", () => {
    expect(CameraResolution.fromTotalPixels(12_200_001).totalPixels).toBe(12_200_001);
  });
});
