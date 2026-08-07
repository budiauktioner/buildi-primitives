import { Decimal } from "../internal/decimal.js";
import type { PrimitiveTypeInfo } from "../primitive-type-info.js";

const NINE = Decimal.parse("9")!;
const FIVE = Decimal.parse("5")!;

/**
 * A temperature difference, stored in kelvin.
 *
 * Differences do not carry the offset that absolute temperatures do: one kelvin
 * of difference is one degree Celsius, while a Fahrenheit interval scales by
 * 9/5. Subtracting two {@link Temperature} values produces one of these.
 */
export class TemperatureDelta {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Temperature Difference",
    localizedName: "Temperaturskillnad",
    emoji: "🌡️",
    sources: Object.freeze([]),
  });

  private constructor(private readonly deltaKelvin: Decimal) {}

  /** The interval in kelvin, numerically the same as {@link celsius}. */
  get kelvin(): number {
    return this.deltaKelvin.toNumber();
  }

  /** The interval in degrees Celsius, numerically the same as {@link kelvin}. */
  get celsius(): number {
    return this.deltaKelvin.toNumber();
  }

  /** The interval in degrees Fahrenheit, so a 5 K interval is 9 °F. */
  get fahrenheit(): number {
    return this.fahrenheitDecimal().toNumber();
  }

  /** @internal The exact interval in kelvin, for {@link Temperature} arithmetic. */
  get exactKelvin(): Decimal {
    return this.deltaKelvin;
  }

  static fromKelvin(value: number | Decimal): TemperatureDelta {
    return new TemperatureDelta(toDecimal(value));
  }

  static fromCelsius(value: number | Decimal): TemperatureDelta {
    return new TemperatureDelta(toDecimal(value));
  }

  static fromFahrenheit(value: number | Decimal): TemperatureDelta {
    return new TemperatureDelta(toDecimal(value).times(FIVE).dividedBy(NINE));
  }

  plus(other: TemperatureDelta): TemperatureDelta {
    return new TemperatureDelta(this.deltaKelvin.plus(other.deltaKelvin));
  }

  minus(other: TemperatureDelta): TemperatureDelta {
    return new TemperatureDelta(this.deltaKelvin.minus(other.deltaKelvin));
  }

  times(factor: number | Decimal): TemperatureDelta {
    return new TemperatureDelta(this.deltaKelvin.times(toDecimal(factor)));
  }

  dividedBy(divisor: number | Decimal): TemperatureDelta {
    return new TemperatureDelta(this.deltaKelvin.dividedBy(toDecimal(divisor)));
  }

  negated(): TemperatureDelta {
    return new TemperatureDelta(this.deltaKelvin.negated());
  }

  compareTo(other: TemperatureDelta | null | undefined): number {
    if (other == null) return 1;
    return this.deltaKelvin.compareTo(other.deltaKelvin);
  }

  equals(other: TemperatureDelta | null | undefined): boolean {
    return other != null && this.deltaKelvin.equals(other.deltaKelvin);
  }

  isLessThan(other: TemperatureDelta): boolean {
    return this.compareTo(other) < 0;
  }

  isGreaterThan(other: TemperatureDelta): boolean {
    return this.compareTo(other) > 0;
  }

  private fahrenheitDecimal(): Decimal {
    return this.deltaKelvin.times(NINE).dividedBy(FIVE);
  }
}

function toDecimal(value: number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  const parsed = Decimal.fromNumber(value);
  if (parsed === null) throw new Error(`Value cannot be represented as a temperature: ${value}`);
  return parsed;
}
