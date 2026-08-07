/**
 * Exact base-10 arithmetic matching the observable semantics of .NET
 * `System.Decimal`, which is what every `Measurement` quantity in
 * `Buildi.Primitives` stores its value as.
 *
 * A binary `number` cannot stand in here. Unit conversion multiplies by exact
 * decimal factors, and the result is what `normalize()` writes out as the
 * canonical storage form:
 *
 * ```text
 * 3 ft -> meters      number: 0.9144000000000001      decimal: 0.9144
 * ```
 *
 * Since `isNormalized(input)` is defined as `input === normalize(input)`, that
 * drift would break the contract the package is built around, and would fail
 * the parity vectors ported from the .NET test suite.
 *
 * A value is `units / 10 ** scale`. Both the 96-bit magnitude limit and the
 * maximum scale of 28 are reproduced so that inputs .NET rejects as overflow
 * are rejected here too.
 *
 * Equivalent of .NET `System.Decimal`. Internal; not re-exported publicly.
 */

/** Largest number of fractional digits a .NET decimal can carry. */
const MAX_SCALE = 28;

/** 2^96 - 1 — the largest unscaled magnitude, i.e. `decimal.MaxValue`. */
const MAX_UNSCALED = (1n << 96n) - 1n;

/**
 * How to break a tie when discarding digits.
 *
 * .NET uses `HalfEven` for arithmetic (verified: `1m / 536870912m` yields
 * `0.0000000018626451492309570312`, keeping the even `2` where away-from-zero
 * would produce `3`), while `Math.Round(x, n, MidpointRounding.AwayFromZero)`
 * is what the quantity formatters ask for explicitly.
 */
export type RoundingMode = "half-even" | "away-from-zero";

const POW10_CACHE: bigint[] = [];

function pow10(exponent: number): bigint {
  if (exponent < 0) throw new RangeError("Negative power of ten.");
  const cached = POW10_CACHE[exponent];
  if (cached !== undefined) return cached;
  let value = 1n;
  for (let i = 0; i < exponent; i++) value *= 10n;
  POW10_CACHE[exponent] = value;
  return value;
}

function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

/** Divides and rounds in one step, keeping the sign out of the tie logic. */
function divideRounded(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  let n = numerator;
  let d = denominator;
  if (d < 0n) {
    n = -n;
    d = -d;
  }

  const negative = n < 0n;
  const magnitude = negative ? -n : n;

  let quotient = magnitude / d;
  const doubledRemainder = (magnitude % d) * 2n;

  if (doubledRemainder > d) {
    quotient += 1n;
  } else if (doubledRemainder === d) {
    if (mode === "away-from-zero" || quotient % 2n === 1n) quotient += 1n;
  }

  return negative ? -quotient : quotient;
}

/** Thrown when a result cannot be represented, mirroring .NET `OverflowException`. */
export class DecimalOverflowError extends Error {
  constructor() {
    super("Decimal overflow.");
    this.name = "DecimalOverflowError";
  }
}

/** Thrown by division by zero, mirroring .NET `DivideByZeroException`. */
export class DecimalDivisionByZeroError extends Error {
  constructor() {
    super("Decimal division by zero.");
    this.name = "DecimalDivisionByZeroError";
  }
}

const DECIMAL_PATTERN = /^[+-]?(?:\d+)(?:\.\d+)?$/;

export class Decimal {
  static readonly zero = new Decimal(0n, 0);
  static readonly one = new Decimal(1n, 0);

  private constructor(
    private readonly units: bigint,
    private readonly scale: number,
  ) {}

  /**
   * Drops scale until the value fits in 96 bits and 28 fractional digits.
   *
   * .NET reduces precision before it gives up, which is why `1e-16 * 1e-16`
   * yields a scale-28 zero rather than throwing.
   */
  private static fit(units: bigint, scale: number, mode: RoundingMode): Decimal {
    let u = units;
    let s = scale;
    while (s > MAX_SCALE || absBigInt(u) > MAX_UNSCALED) {
      if (s === 0) throw new DecimalOverflowError();
      u = divideRounded(u, 10n, mode);
      s -= 1;
    }
    return new Decimal(u, s);
  }

  /** Builds a value from an integer. Throws if it does not fit. */
  static fromBigInt(value: bigint): Decimal {
    if (absBigInt(value) > MAX_UNSCALED) throw new DecimalOverflowError();
    return new Decimal(value, 0);
  }

  /**
   * Parses a plain decimal literal such as `-12.750`. Trailing zeros are
   * significant and preserved, as in .NET. Exponent notation is not accepted.
   * Returns `null` when the input is malformed or too large.
   */
  static parse(input: string): Decimal | null {
    if (!DECIMAL_PATTERN.test(input)) return null;

    const negative = input.startsWith("-");
    const unsigned = input.startsWith("+") || negative ? input.slice(1) : input;

    const pointIndex = unsigned.indexOf(".");
    const integerDigits = pointIndex < 0 ? unsigned : unsigned.slice(0, pointIndex);
    const fractionDigits = pointIndex < 0 ? "" : unsigned.slice(pointIndex + 1);

    let units = BigInt(integerDigits + fractionDigits);
    if (negative) units = -units;

    try {
      return Decimal.fit(units, fractionDigits.length, "half-even");
    } catch {
      return null;
    }
  }

  get isZero(): boolean {
    return this.units === 0n;
  }

  get isNegative(): boolean {
    return this.units < 0n;
  }

  plus(other: Decimal): Decimal {
    const scale = Math.max(this.scale, other.scale);
    const a = this.units * pow10(scale - this.scale);
    const b = other.units * pow10(scale - other.scale);
    return Decimal.fit(a + b, scale, "half-even");
  }

  minus(other: Decimal): Decimal {
    const scale = Math.max(this.scale, other.scale);
    const a = this.units * pow10(scale - this.scale);
    const b = other.units * pow10(scale - other.scale);
    return Decimal.fit(a - b, scale, "half-even");
  }

  /** Scales add, as in .NET: `1.0 * 1.0` is `1.00`. */
  times(other: Decimal): Decimal {
    return Decimal.fit(this.units * other.units, this.scale + other.scale, "half-even");
  }

  /**
   * Divides at the highest precision that still fits, which is how .NET arrives
   * at `1m / 0.0254m === 39.370078740157480314960629921` — 27 fractional
   * digits, because 28 would not fit in 96 bits.
   *
   * Unlike the other operations, division discards trailing zeros down to a
   * preferred scale of `dividend scale - divisor scale`. That is what makes
   * `536870912m / 2.5m` come out as `214748364.8` while `1.00m / 2m` keeps both
   * digits as `0.50`.
   */
  dividedBy(other: Decimal): Decimal {
    if (other.units === 0n) throw new DecimalDivisionByZeroError();

    const preferredScale = Math.max(0, this.scale - other.scale);

    for (let target = MAX_SCALE; target >= 0; target--) {
      const shift = target - this.scale + other.scale;
      let numerator = this.units;
      let denominator = other.units;
      if (shift >= 0) numerator *= pow10(shift);
      else denominator *= pow10(-shift);

      let quotient = divideRounded(numerator, denominator, "half-even");
      if (absBigInt(quotient) > MAX_UNSCALED) continue;

      // A quotient that underflows to zero loses its scale entirely rather
      // than honouring the preferred scale.
      const floorScale = quotient === 0n ? 0 : preferredScale;

      let scale = target;
      while (scale > floorScale && quotient % 10n === 0n) {
        quotient /= 10n;
        scale -= 1;
      }
      return new Decimal(quotient, scale);
    }

    throw new DecimalOverflowError();
  }

  negated(): Decimal {
    return new Decimal(-this.units, this.scale);
  }

  abs(): Decimal {
    return this.units < 0n ? this.negated() : this;
  }

  /**
   * Rounds to `decimals` fractional digits. Asking for more digits than the
   * value carries leaves it untouched, matching .NET `Math.Round`.
   */
  round(decimals: number, mode: RoundingMode = "half-even"): Decimal {
    if (decimals < 0) throw new RangeError("Negative decimals.");
    if (decimals >= this.scale) return this;
    const dropped = this.scale - decimals;
    return new Decimal(divideRounded(this.units, pow10(dropped), mode), decimals);
  }

  /** Compares by value; scale is ignored, so `1.0` and `1.00` are equal. */
  compareTo(other: Decimal): number {
    const scale = Math.max(this.scale, other.scale);
    const a = this.units * pow10(scale - this.scale);
    const b = other.units * pow10(scale - other.scale);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  equals(other: Decimal): boolean {
    return this.compareTo(other) === 0;
  }

  /** Renders with trailing zeros intact, as .NET does. */
  toString(): string {
    const negative = this.units < 0n;
    const digits = absBigInt(this.units).toString();

    if (this.scale === 0) return negative ? `-${digits}` : digits;

    const padded = digits.padStart(this.scale + 1, "0");
    const split = padded.length - this.scale;
    const rendered = `${padded.slice(0, split)}.${padded.slice(split)}`;
    return negative ? `-${rendered}` : rendered;
  }

  /**
   * Renders without trailing fractional zeros, e.g. `0.9144` rather than
   * `0.914400`. This is the form the quantity types display.
   */
  toTrimmedString(): string {
    const rendered = this.toString();
    if (!rendered.includes(".")) return rendered;
    return rendered.replace(/0+$/, "").replace(/\.$/, "");
  }

  /**
   * Converts to a binary `number` for ergonomic consumer-facing accessors.
   * Lossy beyond 17 significant digits — never round-trip a value through this
   * on the normalization path.
   */
  toNumber(): number {
    return Number(this.toString());
  }
}
