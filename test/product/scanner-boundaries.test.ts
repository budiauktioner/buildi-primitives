import { describe, expect, it } from "vitest";
import { CameraResolution } from "../../src/product/camera-resolution.js";
import { IpRating } from "../../src/product/ip-rating.js";
import { ScreenSize } from "../../src/product/screen-size.js";

const BOUNDARIES = [
  ["Unicode letter", "å"],
  ["Unicode number", "٣"],
  ["underscore", "_"],
] as const;

const PRODUCT_SCANNERS = [
  ["IP rating", "IP65", IpRating.findCandidatesInText.bind(IpRating)],
  ["camera resolution", "12 MP", CameraResolution.findCandidatesInText.bind(CameraResolution)],
] as const;

const SCREEN_SIZE_FORMS = [
  ["quote", '55"'],
  ["double prime", "55″"],
  ["doubled apostrophe", "55''"],
  ["-inch", "55-inch"],
] as const;

describe("product scanner Unicode boundaries", () => {
  it.each(
    PRODUCT_SCANNERS.flatMap(([scannerName, sample, scan]) =>
      BOUNDARIES.flatMap(([boundaryName, boundary]) => [
        [`${scannerName} after ${boundaryName}`, () => scan(`${boundary}${sample})`)] as const,
        [`${scannerName} before ${boundaryName}`, () => scan(`(${sample}${boundary}`)] as const,
      ]),
    ),
  )("does not find %s", (_name, scan) => {
    expect(scan()).toEqual([]);
  });

  it.each(
    SCREEN_SIZE_FORMS.flatMap(([formName, sample]) =>
      BOUNDARIES.flatMap(([boundaryName, boundary]) => [
        [
          `${formName} after ${boundaryName}`,
          () => ScreenSize.findCandidatesInText(`${boundary}${sample})`),
        ] as const,
        [
          `${formName} before ${boundaryName}`,
          () => ScreenSize.findCandidatesInText(`(${sample}${boundary}`),
        ] as const,
      ]),
    ),
  )("does not find a screen size using %s", (_name, scan) => {
    expect(scan()).toEqual([]);
  });
});
