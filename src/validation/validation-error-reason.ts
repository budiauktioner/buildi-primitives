/**
 * Describes why a value failed validation. Shared across all types that support
 * the `validate` method. Not every reason applies to every type.
 *
 * Maps 1:1 to the .NET `ValidationErrorReason` enum.
 */
export const ValidationErrorReason = {
  // --- Common ---
  InputIsEmpty: "InputIsEmpty",
  InputTooLong: "InputTooLong",
  InputTooShort: "InputTooShort",
  InvalidLength: "InvalidLength",
  InvalidFormat: "InvalidFormat",
  InvalidCharacters: "InvalidCharacters",
  InvalidCheckDigit: "InvalidCheckDigit",

  // --- Banking / clearing ---
  UnknownClearingRange: "UnknownClearingRange",
  InvalidSwedbankFormat: "InvalidSwedbankFormat",
  InvalidAccountLengthForBank: "InvalidAccountLengthForBank",
  InvalidClearingNumber: "InvalidClearingNumber",

  // --- Identity / organization ---
  InvalidDate: "InvalidDate",
  InvalidPrefix: "InvalidPrefix",
  InvalidEntityPattern: "InvalidEntityPattern",

  // --- International / country ---
  UnknownCountryCode: "UnknownCountryCode",
  InvalidCountryPrefix: "InvalidCountryPrefix",
  InvalidLengthForCountry: "InvalidLengthForCountry",

  // --- OCR ---
  InvalidLengthDigit: "InvalidLengthDigit",

  // --- Email ---
  MissingAtSign: "MissingAtSign",
  InvalidLocalPart: "InvalidLocalPart",
  InvalidDomain: "InvalidDomain",

  // --- Watercraft identification ---
  InvalidManufacturerCode: "InvalidManufacturerCode",
  InvalidSerialNumber: "InvalidSerialNumber",
  InvalidMonthCode: "InvalidMonthCode",
  InvalidYearDigits: "InvalidYearDigits",
} as const;

export type ValidationErrorReason =
  (typeof ValidationErrorReason)[keyof typeof ValidationErrorReason];
