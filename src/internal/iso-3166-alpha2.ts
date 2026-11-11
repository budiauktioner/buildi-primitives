/**
 * The 249 officially assigned ISO 3166-1 alpha-2 codes.
 *
 * The `Country` catalog is not a substitute: it omits assigned codes for dependent
 * territories such as `KY` and `VG`, and includes the user-assigned `XK`. User-assigned
 * codes (`AA`, `QM`–`QZ`, `XA`–`XZ`, `ZZ`) and exceptionally or transitionally reserved
 * codes (such as `UK` and `EU`) are excluded.
 *
 * Equivalent of `Buildi.Primitives.Geography.Iso3166Alpha2` (internal in .NET); keep the
 * two lists in sync.
 */
const ASSIGNED_CODES: ReadonlySet<string> = new Set(
  (
    "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ " +
    "BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
    "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ " +
    "DE DJ DK DM DO DZ " +
    "EC EE EG EH ER ES ET " +
    "FI FJ FK FM FO FR " +
    "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY " +
    "HK HM HN HR HT HU " +
    "ID IE IL IM IN IO IQ IR IS IT " +
    "JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ " +
    "LA LB LC LI LK LR LS LT LU LV LY " +
    "MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ " +
    "NA NC NE NF NG NI NL NO NP NR NU NZ " +
    "OM " +
    "PA PE PF PG PH PK PL PM PN PR PS PT PW PY " +
    "QA " +
    "RE RO RS RU RW " +
    "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ " +
    "TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
    "UA UG UM US UY UZ " +
    "VA VC VE VG VI VN VU " +
    "WF WS " +
    "YE YT " +
    "ZA ZM ZW"
  ).split(" "),
);

/** Returns `true` for an officially assigned uppercase code, e.g. `KY`. */
export function isAssignedIso3166Alpha2(code: string): boolean {
  return ASSIGNED_CODES.has(code);
}

/** Number of codes in the list; exposed for tests. */
export const ASSIGNED_ISO_3166_ALPHA2_COUNT = ASSIGNED_CODES.size;
