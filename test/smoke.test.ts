import { describe, expect, it } from "vitest";
import { PrimitivesDefaults } from "../src/primitives-defaults.js";

describe("smoke", () => {
  it("exports the package entry point", async () => {
    const mod = await import("../src/index.js");
    expect(mod).toBeDefined();
  });

  it("PrimitivesDefaults has Swedish defaults", () => {
    PrimitivesDefaults.reset();
    expect(PrimitivesDefaults.culture).toBe("sv-SE");
    expect(PrimitivesDefaults.uiCulture).toBe("sv-SE");
    expect(PrimitivesDefaults.countryAlpha2Code).toBe("SE");
    expect(PrimitivesDefaults.useLocalizedDisplayNames).toBe(true);
  });

  it("PrimitivesDefaults overrides round-trip", () => {
    PrimitivesDefaults.reset();
    PrimitivesDefaults.uiCulture = "en-US";
    expect(PrimitivesDefaults.useLocalizedDisplayNames).toBe(false);
    PrimitivesDefaults.reset();
    expect(PrimitivesDefaults.useLocalizedDisplayNames).toBe(true);
  });
});
