/**
 * Configurable defaults that control locale-sensitive behaviour across all
 * primitive types. When not explicitly set, values fall back to safe Swedish
 * defaults (the .NET version derives them from `CultureInfo.CurrentCulture`,
 * which has no direct equivalent in standard JavaScript).
 *
 * Set properties at application startup or override per-request as needed.
 */

const DEFAULT_CULTURE = "sv-SE";
const DEFAULT_UI_CULTURE = "sv-SE";
const DEFAULT_COUNTRY = "SE";
const DEFAULT_CALLING_CODE = "46";

interface PrimitivesDefaultsState {
  culture: string;
  uiCulture: string;
  countryAlpha2Code: string;
  defaultCallingCode: string;
}

const state: PrimitivesDefaultsState = {
  culture: DEFAULT_CULTURE,
  uiCulture: DEFAULT_UI_CULTURE,
  countryAlpha2Code: DEFAULT_COUNTRY,
  defaultCallingCode: DEFAULT_CALLING_CODE,
};

/**
 * Configurable global defaults for locale, UI language, and default country.
 *
 * These mirror the .NET `PrimitivesDefaults` static class. `culture` controls
 * formatting and casing (Swedish-aware character handling for `Å`/`Ä`/`Ö`),
 * `uiCulture` controls display-name language selection (Swedish vs English),
 * and `countryAlpha2Code` is used as the default ISO 3166-1 alpha-2 country
 * when no explicit country is supplied.
 */
export const PrimitivesDefaults = {
  /**
   * BCP-47 locale tag used for casing and number formatting.
   * Defaults to `'sv-SE'`.
   */
  get culture(): string {
    return state.culture;
  },
  set culture(value: string) {
    state.culture = value;
  },

  /**
   * BCP-47 locale tag used for display-name language selection.
   * Defaults to `'sv-SE'`.
   */
  get uiCulture(): string {
    return state.uiCulture;
  },
  set uiCulture(value: string) {
    state.uiCulture = value;
  },

  /**
   * Default ISO 3166-1 alpha-2 country code. Used by types like
   * `PhoneNumber` and `SwedishOrganizationIdentifierParser` when no explicit
   * country is supplied. Defaults to `'SE'`.
   */
  get countryAlpha2Code(): string {
    return state.countryAlpha2Code;
  },
  set countryAlpha2Code(value: string) {
    state.countryAlpha2Code = value;
  },

  /**
   * Default phone calling code (digits only, no `+`). Used by {@link PhoneNumber}
   * for inputs without an explicit country prefix. Defaults to `'46'` (Sweden).
   */
  get defaultCallingCode(): string {
    return state.defaultCallingCode;
  },
  set defaultCallingCode(value: string) {
    state.defaultCallingCode = value;
  },

  /**
   * `true` when {@link uiCulture} is Swedish (`sv` or `sv-*`).
   * Types use this to select between localized and English display names.
   */
  get useLocalizedDisplayNames(): boolean {
    const lang = state.uiCulture.toLowerCase().split("-")[0];
    return lang === "sv";
  },

  /** Resets all overrides to the package defaults. */
  reset(): void {
    state.culture = DEFAULT_CULTURE;
    state.uiCulture = DEFAULT_UI_CULTURE;
    state.countryAlpha2Code = DEFAULT_COUNTRY;
    state.defaultCallingCode = DEFAULT_CALLING_CODE;
  },
};
