import { describe, expect, it } from "vitest";
import { Color } from "../../src/product/index.js";

const BASE_COLOR_NAMES: readonly (readonly [string, string])[] = [
  ["red", "röd"],
  ["blue", "blå"],
  ["green", "grön"],
  ["yellow", "gul"],
  ["orange", "orange"],
  ["purple", "lila"],
  ["pink", "rosa"],
  ["black", "svart"],
  ["white", "vit"],
  ["grey", "grå"],
  ["brown", "brun"],
  ["gold", "guld"],
  ["silver", "silver"],
  ["navy", "marinblå"],
  ["cyan", "cyan"],
  ["magenta", "magenta"],
  ["lime", "lime"],
  ["olive", "oliv"],
  ["maroon", "rödbrun"],
  ["teal", "blågrön"],
  ["coral", "korall"],
  ["salmon", "laxrosa"],
  ["turquoise", "turkos"],
  ["violet", "violett"],
  ["indigo", "indigo"],
  ["beige", "beige"],
  ["ivory", "elfenben"],
  ["khaki", "kaki"],
  ["lavender", "lavendel"],
  ["crimson", "karmosinröd"],
  ["tomato", "tomat"],
  ["plum", "plommon"],
  ["burgundy", "vinröd"],
];

const SHADES_EQUAL_TO_BASE_COLOR = new Set(["mörksvart", "ljusvit", "blekvit"]);

const SHADE_NAMES = BASE_COLOR_NAMES.flatMap(([english, swedish]) =>
  (
    [
      ["ljus", "light"],
      ["mörk", "dark"],
      ["blek", "pale"],
    ] as const
  )
    .filter(([sv]) => !SHADES_EQUAL_TO_BASE_COLOR.has(sv + swedish))
    .flatMap(([sv, en]) => [sv + swedish, `${en} ${english}`]),
);

describe("Color", () => {
  it.each(SHADE_NAMES)("round-trips %s through its hex", (name) => {
    const fromName = Color.parse(name);

    const fromHex = Color.parse(fromName.hex);

    expect(fromHex.nameSwedish).toBe(fromName.nameSwedish);
    expect(fromHex.nameEnglish).toBe(fromName.nameEnglish);
    expect(fromHex.toString()).toBe(fromName.toString());
  });

  it.each([
    ["mörksvart", "black", "svart"],
    ["ljusvit", "white", "vit"],
    ["blekvit", "white", "vit"],
  ])("resolves the hex of %s to the base color name", (shade, english, swedish) => {
    const fromHex = Color.parse(Color.parse(shade).hex);

    expect(fromHex.nameEnglish).toBe(english);
    expect(fromHex.nameSwedish).toBe(swedish);
  });
});
