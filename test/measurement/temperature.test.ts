import { describe, expect, it } from "vitest";
import {
  Temperature,
  TemperatureDelta,
  TemperatureUnit,
  maskTemperature,
} from "../../src/measurement/index.js";
import vectors from "./temperature-dotnet-vectors.json" with { type: "json" };

/**
 * Temperature is the one dimension that converts by offset rather than by
 * factor, so it does not share the quantity base class. These expectations come
 * from the .NET type.
 */

const SCALES: Record<string, TemperatureUnit> = {
  C: TemperatureUnit.Celsius,
  F: TemperatureUnit.Fahrenheit,
  K: TemperatureUnit.Kelvin,
};

const fromScale = (scale: string, value: string): Temperature => {
  if (scale === "C") return Temperature.fromCelsius(Number(value));
  if (scale === "F") return Temperature.fromFahrenheit(Number(value));
  return Temperature.fromKelvin(Number(value));
};

describe("Temperature conversion against .NET vectors", () => {
  it.each(vectors.conversions.map((c) => [`${c.value} ${c.scale}`, c] as const))(
    "converts %s the same way",
    (_label, vector) => {
      const temperature = fromScale(vector.scale, vector.value);

      expect(String(temperature.celsius)).toBe(String(Number(vector.celsius)));
      expect(String(temperature.fahrenheit)).toBe(String(Number(vector.fahrenheit)));
      expect(String(temperature.kelvin)).toBe(String(Number(vector.kelvin)));
      expect(temperature.toString()).toBe(vector.toString);
      expect(temperature.toNormalizedString()).toBe(vector.normalized);
      expect(temperature.toStringInUnit(TemperatureUnit.Celsius)).toBe(vector.inCelsius);
      expect(temperature.toStringInUnit(TemperatureUnit.Fahrenheit, 2)).toBe(vector.inFahrenheit2);

      const onOwnScale = { C: vector.celsius, F: vector.fahrenheit, K: vector.kelvin }[
        vector.scale
      ]!;
      expect(String(temperature.in(SCALES[vector.scale]!))).toBe(String(Number(onOwnScale)));
    },
  );

  it("reproduces .NET's Fahrenheit round-trip drift rather than hiding it", () => {
    // 0 °F is stored as 255.37222…2 K, and converting back cannot recover a
    // clean zero. .NET lands on the same value, so the port matches rather than
    // silently rounding.
    expect(Temperature.fromFahrenheit(0).fahrenheit).toBe(-4e-27);
    expect(Temperature.fromFahrenheit(0).toString()).toBe("-0.000000000000000000000000004 °F");
  });
});

describe("TemperatureDelta against .NET vectors", () => {
  it.each(vectors.deltas.map((d) => [`${d.value} ${d.from}`, d] as const))(
    "scales %s without an offset",
    (_label, vector) => {
      const delta =
        vector.from === "K"
          ? TemperatureDelta.fromKelvin(Number(vector.value))
          : vector.from === "C"
            ? TemperatureDelta.fromCelsius(Number(vector.value))
            : TemperatureDelta.fromFahrenheit(Number(vector.value));

      expect(String(delta.kelvin)).toBe(String(Number(vector.kelvin)));
      expect(String(delta.celsius)).toBe(String(Number(vector.celsius)));
      expect(String(delta.fahrenheit)).toBe(String(Number(vector.fahrenheit)));
    },
  );
});

describe("Temperature arithmetic against .NET vectors", () => {
  it.each(vectors.arithmetic.map((a) => [a.temperature, a] as const))(
    "adds and subtracts a difference to %s",
    (_label, vector) => {
      const temperature = Temperature.parse(vector.temperature);
      const delta = TemperatureDelta.fromKelvin(Number(vector.deltaKelvin));

      expect(temperature.plus(delta).toString()).toBe(vector.plus);
      expect(temperature.minus(delta).toString()).toBe(vector.minus);
      expect(temperature.plus(delta).toNormalizedString()).toBe(vector.plusNormalized);
    },
  );

  it.each(vectors.differences.map((d) => [`${d.a} - ${d.b}`, d] as const))(
    "takes the difference %s",
    (_label, vector) => {
      const difference = Temperature.parse(vector.a).difference(Temperature.parse(vector.b));

      expect(String(difference.kelvin)).toBe(String(Number(vector.kelvin)));
      expect(String(difference.fahrenheit)).toBe(String(Number(vector.fahrenheit)));
    },
  );
});

describe("Temperature", () => {
  it("keeps the freezing and boiling points exact", () => {
    expect(Temperature.parse("0 °C").kelvin).toBe(273.15);
    expect(Temperature.parse("100 °C").fahrenheit).toBe(212);
    expect(Temperature.parse("-40 °C").fahrenheit).toBe(-40);
  });

  it("preserves the parsed scale", () => {
    expect(Temperature.parse("68 °F").toString()).toBe("68 °F");
    expect(Temperature.parse("68 °F").toNormalizedString()).toBe("293.15 K");
  });

  it("compares across scales", () => {
    expect(Temperature.parse("0 °C").equals(Temperature.parse("273.15 K"))).toBe(true);
    expect(Temperature.parse("1 °C").isGreaterThan(Temperature.parse("273.15 K"))).toBe(true);
    expect(Temperature.parse("0 °C").isLessThan(Temperature.parse("1 °C"))).toBe(true);
    expect(Temperature.parse("0 °C").compareTo(null)).toBe(1);
    expect(Temperature.parse("0 °C").equals(null)).toBe(false);
  });

  it("masks to the parsed scale", () => {
    expect(maskTemperature(Temperature.parse("20 °C"))).toBe("*** °C");
    expect(maskTemperature(Temperature.parse("300 K"))).toBe("*** K");
  });

  it("throws for an unknown scale", () => {
    expect(() => Temperature.parse("20 °X")).toThrow("Invalid temperature.");
    expect(() => TemperatureUnit.parse("Rankine")).toThrow("Unknown temperature unit.");
  });
});

describe("TemperatureDelta", () => {
  it("treats a kelvin and a Celsius degree as the same interval", () => {
    expect(TemperatureDelta.fromKelvin(5).celsius).toBe(5);
    expect(TemperatureDelta.fromCelsius(5).kelvin).toBe(5);
  });

  it("scales Fahrenheit intervals by 9/5", () => {
    expect(TemperatureDelta.fromKelvin(5).fahrenheit).toBe(9);
    expect(TemperatureDelta.fromFahrenheit(9).kelvin).toBe(5);
  });

  it("supports arithmetic and comparison", () => {
    const five = TemperatureDelta.fromKelvin(5);
    const three = TemperatureDelta.fromKelvin(3);

    expect(five.plus(three).kelvin).toBe(8);
    expect(five.minus(three).kelvin).toBe(2);
    expect(five.times(2).kelvin).toBe(10);
    expect(five.dividedBy(2).kelvin).toBe(2.5);
    expect(five.negated().kelvin).toBe(-5);
    expect(five.isGreaterThan(three)).toBe(true);
    expect(three.isLessThan(five)).toBe(true);
    expect(five.equals(TemperatureDelta.fromKelvin(5))).toBe(true);
    expect(five.equals(null)).toBe(false);
    expect(five.compareTo(null)).toBe(1);
  });
});
