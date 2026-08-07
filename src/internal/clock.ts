/**
 * Provides the current date/time for date-dependent primitives such as
 * `SwedishPersonalIdentityNumber` (century derivation), `PersonAge`, and
 * coordination numbers.
 *
 * The .NET equivalent is `IBudiTimeProvider`. JS doesn't have an idiomatic
 * "ambient clock" abstraction, so date-dependent functions accept an optional
 * `Clock` parameter and fall back to {@link systemClock} when absent.
 */
export interface Clock {
  /** Returns the current date/time. */
  now(): Date;
}

/** A {@link Clock} backed by `new Date()`. */
export const systemClock: Clock = {
  now: () => new Date(),
};

/**
 * Creates a {@link Clock} that always returns the same {@link Date} instance
 * (the date object is cloned on each `now()` call so callers can't mutate it).
 */
export function fixedClock(date: Date): Clock {
  const ms = date.getTime();
  return { now: () => new Date(ms) };
}
