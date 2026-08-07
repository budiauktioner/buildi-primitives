import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { PrimitivesDefaults } from "../primitives-defaults.js";
import { collapseWhitespace } from "../internal/input-sanitization.js";
import { Country } from "../geography/index.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";
import { AddressCity } from "./address-city.js";
import { AddressStreet } from "./address-street.js";
import { AddressZipCode } from "./address-zip-code.js";
import type { ICountryAddress } from "./country-address.js";
import {
  getCountryAddressRegistration,
  getRegisteredCountryAddressCountries,
} from "./country-address-registry.js";

const MAX_INPUT_LENGTH = 1000;

/** A complete address combining street, zip, city and country. */
export class Address {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Address",
    localizedName: "Adress",
    emoji: "\u{1F3E0}",
    sources: Object.freeze([
      "https://www.postnord.se/",
      "https://www.lantmateriet.se/",
      "https://www.iso.org/iso-3166-country-codes.html",
    ]),
  });

  readonly street: AddressStreet;
  readonly zipCode: AddressZipCode | null;
  readonly city: AddressCity | null;
  readonly country: Country | null;

  constructor(
    street: AddressStreet,
    zipCode: AddressZipCode | null = null,
    city: AddressCity | null = null,
    country: Country | null = null,
  ) {
    this.street = street;
    this.zipCode = zipCode;
    this.city = city;
    this.country = country;
  }

  get careOf(): string | null {
    return this.street.careOf;
  }
  get apartmentNumber(): string | null {
    return this.street.apartmentNumber;
  }
  get postBox(): string | null {
    return this.street.postBox;
  }
  get isPostBox(): boolean {
    return this.street.isPostBox;
  }
  get value(): string {
    return this.toNormalizedString();
  }
  get formatted(): string {
    return this.toString();
  }

  static tryParse(input: string | null | undefined): Address | null;
  static tryParse(parts: {
    street: string | null | undefined;
    zipCode?: string | null;
    city?: string | null;
    country?: string | null;
  }): Address | null;
  static tryParse(arg: unknown): Address | null {
    if (typeof arg === "object" && arg !== null) {
      const p = arg as {
        street?: string | null;
        zipCode?: string | null;
        city?: string | null;
        country?: string | null;
      };
      const cityM = p.city != null && p.city.trim() !== "" ? AddressCity.tryParse(p.city) : null;
      const zipM =
        p.zipCode != null && p.zipCode.trim() !== "" ? AddressZipCode.tryParse(p.zipCode) : null;
      const countryM =
        p.country != null && p.country.trim() !== "" ? Country.tryParse(p.country) : null;
      if (p.zipCode != null && p.zipCode.trim() !== "" && zipM === null) return null;
      if (p.city != null && p.city.trim() !== "" && cityM === null) return null;
      if (p.country != null && p.country.trim() !== "" && countryM === null) return null;
      const streetM = AddressStreet.tryParse(p.street, {
        city: cityM?.value ?? null,
        zipCode: zipM?.formatted ?? zipM?.value ?? null,
      });
      if (streetM === null) return null;
      return new Address(streetM, zipM, cityM, countryM);
    }

    const input = arg as string | null | undefined;
    if (input == null || input.trim() === "") return null;
    const trimmed = input.trim();
    if (trimmed.length > MAX_INPUT_LENGTH) return null;

    const segments = splitSegments(trimmed);
    if (segments.length === 0) return null;

    let country: Country | null = null;
    country = consumeCountry(segments, country);

    let zipCode: AddressZipCode | null = null;
    let city: AddressCity | null = null;
    if (segments.length > 0) {
      const r = consumeZipAndCity(segments);
      if (r) {
        zipCode = r.zipCode;
        city = r.city;
      }
    }

    let streetText = segments.join(", ");
    if (zipCode === null || city === null) {
      const ext = extractTrailingZipCity(streetText);
      if (ext) {
        streetText = ext.street;
        zipCode = zipCode ?? ext.zipCode;
        city = city ?? ext.city;
      }
    }

    if (streetText.trim() === "") return null;
    const street = AddressStreet.tryParse(streetText, {
      city: city?.value ?? null,
      zipCode: zipCode?.formatted ?? zipCode?.value ?? null,
    });
    if (street === null) return null;
    return new Address(street, zipCode, city, country);
  }

  static parse(input: string): Address {
    const r = Address.tryParse(input);
    if (r === null) throw new Error("Invalid address.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Address.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Address.tryParse(input);
    if (r) return r.toString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Address.tryParse(input);
    if (r) return r.toNormalizedString();
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null) {
      const t = input.trim();
      return t.length > 0 ? t : null;
    }
    return null;
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Address.normalize(input) === input;
  }

  /**
   * Scans unstructured text for potential Swedish-style addresses.
   *
   * Results are heuristic candidates and can include false positives. Zip-code
   * anchored matches receive medium confidence, while street-only matches
   * receive low confidence.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<Address>[] {
    if (text.length === 0) return [];
    const results: TextCandidate<Address>[] = [];
    const covered: Array<[number, number]> = [];

    collectAddressMatches(
      text,
      ZIP_ANCHORED_SCAN_PATTERN,
      TextMatchConfidence.Medium,
      results,
      covered,
    );
    collectAddressMatches(
      text,
      STREET_ONLY_SCAN_PATTERN,
      TextMatchConfidence.Low,
      results,
      covered,
    );

    return results.sort((a, b) => a.startIndex - b.startIndex);
  }

  toNormalizedString(): string {
    const parts: string[] = [this.buildStreetLine()];
    if (this.zipCode) parts.push(this.zipCode.value);
    if (this.city) parts.push(this.city.value);
    if (this.country) parts.push(this.country.alpha2Code);
    return parts.join(", ");
  }

  toMultilineString(): string {
    const useEnglish = !PrimitivesDefaults.useLocalizedDisplayNames;
    const lines: string[] = [];
    if (this.careOf) lines.push(`c/o ${this.careOf}`);
    lines.push(this.buildStreetCoreLine());
    const locality = this.buildLocalityLine();
    if (locality) lines.push(locality);
    if (this.country && (!isSweden(this.country) || useEnglish)) {
      lines.push(useEnglish ? this.country.englishName : this.country.displayName);
    }
    return lines.join("\n");
  }

  toDisplayString(): string {
    return this.buildSingleLine(!PrimitivesDefaults.useLocalizedDisplayNames);
  }
  toEnglishString(): string {
    return this.buildSingleLine(true);
  }
  toNativeString(): string {
    const parts: string[] = [];
    if (this.careOf) parts.push(`c/o ${this.careOf}`);
    parts.push(this.buildStreetCoreLine());
    const locality = this.buildLocalityLine();
    if (locality) parts.push(locality);
    if (this.country && !isSweden(this.country)) parts.push(this.country.nativeName);
    return parts.join(", ");
  }

  toString(): string {
    return this.toDisplayString();
  }

  toDomesticString(): string {
    const parts: string[] = [];
    if (this.careOf) parts.push(`c/o ${this.careOf}`);
    parts.push(this.buildStreetCoreLine());
    const locality = this.buildDomesticLocalityLine();
    if (locality) parts.push(locality);
    return parts.join(", ");
  }

  /**
   * Multi-line form without the country line, using the country's own zip-code
   * formatting when a country-specific address type is registered.
   */
  toDomesticMultilineString(): string {
    const lines: string[] = [];
    if (this.careOf) lines.push(`c/o ${this.careOf}`);
    lines.push(this.buildStreetCoreLine());
    const locality = this.buildDomesticLocalityLine();
    if (locality) lines.push(locality);
    return lines.join("\n");
  }

  /**
   * Wraps this address in its country-specific type when the country is known
   * and an implementation is registered, otherwise `null`.
   */
  asCountryAddress(): ICountryAddress | null {
    if (this.country === null) return null;
    return getCountryAddressRegistration(this.country.alpha2Code)?.tryWrap(this) ?? null;
  }

  /** Countries that have a dedicated country-specific address type. */
  static get supportedCountryAddressTypes(): readonly Country[] {
    return getRegisteredCountryAddressCountries();
  }

  private buildStreetLine(): string {
    const parts: string[] = [];
    if (this.careOf) parts.push(`c/o ${this.careOf}`);
    parts.push(this.buildStreetCoreLine());
    return parts.join(", ");
  }

  private buildStreetCoreLine(): string {
    if (this.apartmentNumber) return `${this.street.street} lgh ${this.apartmentNumber}`;
    return this.street.street;
  }

  private buildLocalityLine(): string | null {
    let s = "";
    if (this.zipCode) s += this.zipCode.formatted;
    if (this.city) {
      if (s.length > 0) s += " ";
      s += this.city.value;
    }
    return s.length === 0 ? null : s;
  }

  private buildDomesticLocalityLine(): string | null {
    let s = this.countryFormattedZip() ?? this.zipCode?.formatted ?? "";
    if (this.city) {
      if (s.length > 0) s += " ";
      s += this.city.value;
    }
    return s.length === 0 ? null : s;
  }

  private countryFormattedZip(): string | null {
    if (this.zipCode === null || this.country === null) return null;
    return (
      getCountryAddressRegistration(this.country.alpha2Code)?.formatZip(this.zipCode.value) ?? null
    );
  }

  private buildSingleLine(useEnglish: boolean): string {
    const parts: string[] = [];
    if (this.careOf) parts.push(`c/o ${this.careOf}`);
    parts.push(this.buildStreetCoreLine());
    const locality = this.buildLocalityLine();
    if (locality) parts.push(locality);
    if (this.country && (!isSweden(this.country) || useEnglish)) {
      parts.push(useEnglish ? this.country.englishName : this.country.displayName);
    }
    return parts.join(", ");
  }
}

function isSweden(c: Country): boolean {
  return c.alpha2Code.toUpperCase() === "SE";
}

const STREET_SUFFIX_PATTERN = String.raw`(?:gatan|gata|vägen|väg|allén|allé|torget|torg|platsen|plats|stigen|stig|gränden|gränd|gången|gång|leden|led|backen|backe|kajen|kaj|bron|plan|stråket|terrassen|ringen|parken|hamnen)`;

const STREET_NAME_PATTERN =
  String.raw`(?:[\p{Lu}ÅÄÖ][\p{Ll}\p{M}'-]+\s+)*[\p{Lu}ÅÄÖ][\p{Ll}\p{M}'-]*` +
  STREET_SUFFIX_PATTERN;

const ZIP_ANCHORED_SCAN_PATTERN = new RegExp(
  String.raw`(?<candidate>(?:c\/o\s+[\p{L}\p{M} .'-]+,\s*)?` +
    STREET_NAME_PATTERN +
    String.raw`\s+\d{1,4}[\p{L}]?,?\s+\d{3}\s?\d{2}\s+[\p{Lu}ÅÄÖ][\p{L}\p{M}'-]+(?:\s+[\p{Lu}ÅÄÖ][\p{L}\p{M}'-]+)*(?:,\s*(?:SE|Sverige|Sweden))?)`,
  "gu",
);

const STREET_ONLY_SCAN_PATTERN = new RegExp(
  String.raw`(?<candidate>` + STREET_NAME_PATTERN + String.raw`\s+\d{1,4}[\p{L}]?)`,
  "gu",
);

function collectAddressMatches(
  text: string,
  pattern: RegExp,
  confidence: TextMatchConfidence,
  results: TextCandidate<Address>[],
  covered: Array<[number, number]>,
): void {
  pattern.lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const candidateText = match.groups?.candidate ?? match[0];
    const startIndex = match.index ?? 0;
    const endIndex = startIndex + candidateText.length;
    if (covered.some(([start, end]) => startIndex < end && start < endIndex)) continue;

    const value = Address.tryParse(candidateText);
    if (!value) continue;

    covered.push([startIndex, endIndex]);
    results.push(
      new TextCandidate({
        startIndex,
        length: candidateText.length,
        originalText: candidateText,
        typeName: "Address",
        category: TextCandidateCategory.Contact,
        normalizedForm: value.toNormalizedString(),
        formattedForm: value.toString(),
        maskedForm: maskAddressForScan(value),
        confidence,
        value,
      }),
    );
  }
}

function maskAddressForScan(address: Address): string {
  return address.toString().replace(/\d/g, "*");
}

function splitSegments(input: string): string[] {
  return input
    .replace(/\r/g, "\n")
    .split(/[\n,]/)
    .map((s) => collapseWhitespace(s))
    .filter((s) => s !== "");
}

function consumeCountry(segments: string[], current: Country | null): Country | null {
  if (segments.length === 0 || current !== null) return current;
  const last = segments[segments.length - 1]!;
  const direct = Country.tryParse(last);
  if (direct) {
    segments.pop();
    return direct;
  }
  const tokens = last.split(" ").filter((t) => t !== "");
  for (let n = Math.min(5, tokens.length); n >= 1; n--) {
    const suffix = tokens.slice(tokens.length - n).join(" ");
    const parsed = Country.tryParse(suffix);
    if (!parsed) continue;
    const prefix = tokens.slice(0, tokens.length - n).join(" ");
    if (prefix.trim() === "") segments.pop();
    else segments[segments.length - 1] = prefix;
    return parsed;
  }
  return current;
}

function consumeZipAndCity(
  segments: string[],
): { zipCode: AddressZipCode; city: AddressCity } | null {
  if (segments.length === 0) return null;
  const last = segments[segments.length - 1]!;
  const r = parseZipAndCity(last);
  if (!r) return null;
  segments.pop();
  return r;
}

function parseZipAndCity(input: string): { zipCode: AddressZipCode; city: AddressCity } | null {
  const normalized = collapseWhitespace(input);
  if (normalized === "") return null;
  const tokens = normalized.split(" ").filter((t) => t !== "");
  if (tokens.length < 2) return null;

  for (let n = Math.min(3, tokens.length - 1); n >= 1; n--) {
    const zip = tokens.slice(0, n).join(" ");
    const city = tokens.slice(n).join(" ");
    const z = AddressZipCode.tryParse(zip);
    const c = AddressCity.tryParse(city);
    if (z && c) return { zipCode: z, city: c };
  }
  for (let n = Math.min(3, tokens.length - 1); n >= 1; n--) {
    const cityP = tokens.slice(0, tokens.length - n).join(" ");
    const zipS = tokens.slice(tokens.length - n).join(" ");
    const z = AddressZipCode.tryParse(zipS);
    const c = AddressCity.tryParse(cityP);
    if (z && c) return { zipCode: z, city: c };
  }
  return null;
}

function extractTrailingZipCity(
  input: string,
): { street: string; zipCode: AddressZipCode; city: AddressCity } | null {
  const normalized = collapseWhitespace(input);
  if (normalized === "") return null;
  const tokens = normalized.split(" ").filter((t) => t !== "");
  if (tokens.length < 3) return null;
  for (let zipStart = tokens.length - 2; zipStart >= 1; zipStart--) {
    for (let zipCount = 1; zipCount <= Math.min(3, tokens.length - zipStart - 1); zipCount++) {
      const zip = tokens.slice(zipStart, zipStart + zipCount).join(" ");
      const city = tokens.slice(zipStart + zipCount).join(" ");
      const street = tokens.slice(0, zipStart).join(" ");
      const z = AddressZipCode.tryParse(zip);
      if (!z) continue;
      const c = AddressCity.tryParse(city);
      if (!c) continue;
      if (street.trim() === "") continue;
      return { street, zipCode: z, city: c };
    }
  }
  return null;
}
