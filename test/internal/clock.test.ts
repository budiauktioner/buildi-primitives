import { describe, expect, it } from "vitest";
import { fixedClock, systemClock } from "../../src/internal/clock.js";

describe("systemClock", () => {
  it("returns Date instances close to now", () => {
    const before = Date.now();
    const t = systemClock.now().getTime();
    const after = Date.now();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });
});

describe("fixedClock", () => {
  it("always returns the same instant", () => {
    const c = fixedClock(new Date(Date.UTC(2024, 0, 1)));
    expect(c.now().getUTCFullYear()).toBe(2024);
    expect(c.now().toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("returns fresh Date instances callers can mutate without affecting the clock", () => {
    const c = fixedClock(new Date(Date.UTC(2024, 0, 1)));
    const a = c.now();
    a.setUTCFullYear(1999);
    expect(c.now().getUTCFullYear()).toBe(2024);
  });
});
