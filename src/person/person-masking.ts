import { PersonAge } from "./person-age.js";
import { PersonFamilyName } from "./person-family-name.js";
import { PersonFullName } from "./person-full-name.js";
import { PersonGivenName } from "./person-given-name.js";

const MaskedNamePart = "***";

export interface PersonNameMaskingOptions {
  readonly useInitials?: boolean;
}

export interface FullNameMaskingOptions extends PersonNameMaskingOptions {
  readonly showGivenName?: boolean;
}

/** Mask given names, e.g. `Anna Maria` -> `*** ***`. */
export function maskGivenName(value: PersonGivenName, options?: PersonNameMaskingOptions): string {
  if (options?.useInitials) return value.names.map(toInitial).join(" ");
  return value.names.map(() => MaskedNamePart).join(" ");
}

/** Mask a family name, e.g. `Andersson` -> `***`. */
export function maskFamilyName(
  value: PersonFamilyName,
  options?: PersonNameMaskingOptions,
): string {
  if (options?.useInitials) return toInitial(value.value);
  return MaskedNamePart;
}

/** Mask a full name, e.g. `Anna Andersson` -> `*** ***`. */
export function maskFullName(value: PersonFullName, options?: FullNameMaskingOptions): string {
  const family = maskFamilyName(value.familyName, options);
  if (options?.showGivenName) return `${value.givenName.value} ${family}`;
  return `${maskGivenName(value.givenName, options)} ${family}`;
}

/** Mask an age, keeping only its magnitude, e.g. `42` -> `** år`. */
export function maskPersonAge(value: PersonAge): string {
  if (value.years >= 1) return `${"*".repeat(String(value.years).length)} år`;
  return `${"*".repeat(String(value.totalMonths).length)} månader`;
}

function toInitial(value: string): string {
  return `${value[0]}.`;
}
