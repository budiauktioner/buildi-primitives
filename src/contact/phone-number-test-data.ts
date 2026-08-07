/**
 * PTS (Post- och telestyrelsen) reserves phone number ranges for use in fiction
 * and testing — these numbers are never assigned to real subscribers.
 *
 * {@link PhoneNumberTestData} enumerates every reserved number;
 * `PhoneNumber.isSwedishTestPhoneNumber` checks whether a parsed number falls in
 * a reserved range.
 *
 * Source: https://pts.se/internet-och-telefoni/telefonnummer-och-adressering/telefonnummer-till-bocker-och-filmer/
 */
function generateRange(prefix: string, from: number, to: number): readonly string[] {
  const result: string[] = [];
  for (let i = from; i <= to; i++) {
    result.push(prefix + String(i).padStart(2, "0"));
  }
  return Object.freeze(result);
}

export const PhoneNumberTestData = {
  /** Mobile: 070-174 06 05 through 070-174 06 99 (95 numbers). */
  get mobile(): readonly string[] {
    return generateRange("07017406", 5, 99);
  },

  /** Landline Gothenburg: 031-390 06 00 through 031-390 06 99 (100 numbers). */
  get landlineGothenburg(): readonly string[] {
    return generateRange("03139006", 0, 99);
  },

  /** Landline Malmö: 040-628 04 00 through 040-628 04 99 (100 numbers). */
  get landlineMalmo(): readonly string[] {
    return generateRange("04062804", 0, 99);
  },

  /** Landline Stockholm: 08-4650 04 00 through 08-4650 04 99 (100 numbers). */
  get landlineStockholm(): readonly string[] {
    return generateRange("08465004", 0, 99);
  },

  /** Landline Kiruna: 0980-31 92 00 through 0980-31 92 99 (100 numbers). */
  get landlineKiruna(): readonly string[] {
    return generateRange("09803192", 0, 99);
  },

  /** All reserved test phone numbers across all ranges (495 numbers). */
  get all(): readonly string[] {
    return Object.freeze([
      ...PhoneNumberTestData.mobile,
      ...PhoneNumberTestData.landlineGothenburg,
      ...PhoneNumberTestData.landlineMalmo,
      ...PhoneNumberTestData.landlineStockholm,
      ...PhoneNumberTestData.landlineKiruna,
    ]);
  },
};
