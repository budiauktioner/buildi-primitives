import { TextCandidate } from "./text-candidate.js";
import { TextCandidateCategory } from "./text-candidate-category.js";
import { TextMatchConfidence } from "./text-match-confidence.js";

// Type-only imports: every scannable type imports this module for `TextCandidate`,
// so importing them as values would form a cycle. These are erased at compile time.
import type { Iban } from "../banking/iban.js";
import type { Bic } from "../banking/bic.js";
import type { SwedishBankAccount } from "../banking/swedish-bank-account.js";
import type { SwedishBankgiroNumber } from "../banking/swedish-bankgiro-number.js";
import type { SwedishOcrReferenceNumber } from "../banking/swedish-ocr-reference-number.js";
import type { SwedishPostgiroNumber } from "../banking/swedish-postgiro-number.js";
import type { SwedishSwishNumber } from "../banking/swedish-swish-number.js";
import type { Address } from "../contact/address.js";
import type { AddressZipCode } from "../contact/address-zip-code.js";
import type { PhoneNumber } from "../contact/phone-number.js";
import type { SwedishAddress } from "../contact/swedish-address.js";
import type { Isin } from "../finance/isin.js";
import type { Area } from "../measurement/area.js";
import type { DataSize } from "../measurement/data-size.js";
import type { ElectricCharge } from "../measurement/electric-charge.js";
import type { ElectricCurrent } from "../measurement/electric-current.js";
import type { Energy } from "../measurement/energy.js";
import type { FlowRate } from "../measurement/flow-rate.js";
import type { Frequency } from "../measurement/frequency.js";
import type { Length } from "../measurement/length.js";
import type { Luminance } from "../measurement/luminance.js";
import type { LuminousFlux } from "../measurement/luminous-flux.js";
import type { Percentage } from "../measurement/percentage.js";
import type { Power } from "../measurement/power.js";
import type { SoundLevel } from "../measurement/sound-level.js";
import type { Pressure } from "../measurement/pressure.js";
import type { RotationalSpeed } from "../measurement/rotational-speed.js";
import type { Speed } from "../measurement/speed.js";
import type { Temperature } from "../measurement/temperature.js";
import type { Torque } from "../measurement/torque.js";
import type { Voltage } from "../measurement/voltage.js";
import type { Volume } from "../measurement/volume.js";
import type { Weight } from "../measurement/weight.js";
import type { Country } from "../geography/country.js";
import type { SwedishCounty } from "../geography/swedish-county.js";
import type { SwedishMunicipality } from "../geography/swedish-municipality.js";
import type { DunsNumber } from "../organization/duns-number.js";
import type { EuVatNumber } from "../organization/eu-vat-number.js";
import type { LeiCode } from "../organization/lei-code.js";
import type { SwedishOrganizationNumber } from "../organization/swedish-organization-number.js";
import type { SwedishCoordinationNumber } from "../person/swedish-coordination-number.js";
import type { SwedishPersonalIdentityNumber } from "../person/swedish-personal-identity-number.js";
import type { SwedishPropertyDesignation } from "../property/swedish-property-designation.js";
import type { EmailAddress } from "../web/email-address.js";
import type { Url } from "../web/url.js";
import type { BoltPattern } from "../vehicle/bolt-pattern.js";
import type { EmissionRate } from "../vehicle/emission-rate.js";
import type { EnginePower } from "../vehicle/engine-power.js";
import type { EuTypeApprovalNumber } from "../vehicle/eu-type-approval-number.js";
import type { EuroEmissionClass } from "../vehicle/euro-emission-class.js";
import type { FuelConsumption } from "../vehicle/fuel-consumption.js";
import type { OperatingHours } from "../vehicle/operating-hours.js";
import type { SwedishDrivingLicenseCategory } from "../vehicle/swedish-driving-license-category.js";
import type { SwedishEcoVehicleClassification } from "../vehicle/swedish-eco-vehicle-classification.js";
import type { SwedishVehicleRegistrationNumber } from "../vehicle/swedish-vehicle-registration-number.js";
import type { TireDimension } from "../vehicle/tire-dimension.js";
import type { VehicleIdentificationNumber } from "../vehicle/vehicle-identification-number.js";
import type { WheelRimDimension } from "../vehicle/wheel-rim-dimension.js";

/**
 * The result of scanning unstructured text for structured value types.
 * Contains all found candidates, a resolved non-overlapping subset, and
 * methods for bulk replacement / masking.
 *
 * Text scanning is heuristic-based. Candidates may be false positives, and
 * valid occurrences may be missed.
 */
export class TextScanResult {
  /** All candidates sorted by `startIndex`, including overlapping ones. */
  readonly all: readonly TextCandidate[];
  /**
   * Non-overlapping subset after resolution. When candidates overlap or one
   * contains another, the winner is chosen by: containment (longer enclosing
   * match wins), then higher {@link TextMatchConfidence}, then longer span,
   * then category priority.
   */
  readonly resolvedCandidates: readonly TextCandidate[];

  constructor(candidates: readonly TextCandidate[]) {
    const sorted = [...candidates].sort((a, b) => a.startIndex - b.startIndex);
    this.all = Object.freeze(sorted);
    this.resolvedCandidates = Object.freeze(resolve(sorted));
  }

  get totalCount(): number {
    return this.all.length;
  }

  /** Returns the number of candidates in the given category. */
  countByCategory(category: TextCandidateCategory): number {
    return this.all.reduce((acc, c) => (c.category === category ? acc + 1 : acc), 0);
  }

  /** Returns the number of candidates at or above the given confidence level. */
  countByConfidence(minimum: TextMatchConfidence): number {
    return this.all.reduce((acc, c) => (c.confidence >= minimum ? acc + 1 : acc), 0);
  }

  /** Returns all candidates whose `typeName` equals `typeName`. */
  byTypeName<T = unknown>(typeName: string): TextCandidate<T>[] {
    return this.all.filter((c) => c.typeName === typeName) as TextCandidate<T>[];
  }

  // Typed accessors. Each returns every candidate of that type from `all`,
  // before overlap resolution.

  get emails(): TextCandidate<EmailAddress>[] {
    return this.byTypeName<EmailAddress>("EmailAddress");
  }
  get urls(): TextCandidate<Url>[] {
    return this.byTypeName<Url>("Url");
  }
  get phoneNumbers(): TextCandidate<PhoneNumber>[] {
    return this.byTypeName<PhoneNumber>("PhoneNumber");
  }
  get zipCodes(): TextCandidate<AddressZipCode>[] {
    return this.byTypeName<AddressZipCode>("AddressZipCode");
  }
  get addresses(): TextCandidate<Address>[] {
    return this.byTypeName<Address>("Address");
  }
  get swedishAddresses(): TextCandidate<SwedishAddress>[] {
    return this.byTypeName<SwedishAddress>("SwedishAddress");
  }

  get personalIdentityNumbers(): TextCandidate<SwedishPersonalIdentityNumber>[] {
    return this.byTypeName<SwedishPersonalIdentityNumber>("SwedishPersonalIdentityNumber");
  }
  get coordinationNumbers(): TextCandidate<SwedishCoordinationNumber>[] {
    return this.byTypeName<SwedishCoordinationNumber>("SwedishCoordinationNumber");
  }

  get organizationNumbers(): TextCandidate<SwedishOrganizationNumber>[] {
    return this.byTypeName<SwedishOrganizationNumber>("SwedishOrganizationNumber");
  }
  get euVatNumbers(): TextCandidate<EuVatNumber>[] {
    return this.byTypeName<EuVatNumber>("EuVatNumber");
  }
  get leiCodes(): TextCandidate<LeiCode>[] {
    return this.byTypeName<LeiCode>("LeiCode");
  }
  get dunsNumbers(): TextCandidate<DunsNumber>[] {
    return this.byTypeName<DunsNumber>("DunsNumber");
  }

  get ibans(): TextCandidate<Iban>[] {
    return this.byTypeName<Iban>("Iban");
  }
  get bics(): TextCandidate<Bic>[] {
    return this.byTypeName<Bic>("Bic");
  }
  get bankgiroNumbers(): TextCandidate<SwedishBankgiroNumber>[] {
    return this.byTypeName<SwedishBankgiroNumber>("SwedishBankgiroNumber");
  }
  get postgiroNumbers(): TextCandidate<SwedishPostgiroNumber>[] {
    return this.byTypeName<SwedishPostgiroNumber>("SwedishPostgiroNumber");
  }
  get bankAccounts(): TextCandidate<SwedishBankAccount>[] {
    return this.byTypeName<SwedishBankAccount>("SwedishBankAccount");
  }
  get ocrReferences(): TextCandidate<SwedishOcrReferenceNumber>[] {
    return this.byTypeName<SwedishOcrReferenceNumber>("SwedishOcrReferenceNumber");
  }
  get swedishSwishNumbers(): TextCandidate<SwedishSwishNumber>[] {
    return this.byTypeName<SwedishSwishNumber>("SwedishSwishNumber");
  }
  get isins(): TextCandidate<Isin>[] {
    return this.byTypeName<Isin>("Isin");
  }

  get countries(): TextCandidate<Country>[] {
    return this.byTypeName<Country>("Country");
  }
  get counties(): TextCandidate<SwedishCounty>[] {
    return this.byTypeName<SwedishCounty>("SwedishCounty");
  }
  get municipalities(): TextCandidate<SwedishMunicipality>[] {
    return this.byTypeName<SwedishMunicipality>("SwedishMunicipality");
  }

  get propertyDesignations(): TextCandidate<SwedishPropertyDesignation>[] {
    return this.byTypeName<SwedishPropertyDesignation>("SwedishPropertyDesignation");
  }

  get areas(): TextCandidate<Area>[] {
    return this.byTypeName<Area>("Area");
  }
  get dataSizes(): TextCandidate<DataSize>[] {
    return this.byTypeName<DataSize>("DataSize");
  }
  get electricCharges(): TextCandidate<ElectricCharge>[] {
    return this.byTypeName<ElectricCharge>("ElectricCharge");
  }
  get electricCurrents(): TextCandidate<ElectricCurrent>[] {
    return this.byTypeName<ElectricCurrent>("ElectricCurrent");
  }
  get energies(): TextCandidate<Energy>[] {
    return this.byTypeName<Energy>("Energy");
  }
  get flowRates(): TextCandidate<FlowRate>[] {
    return this.byTypeName<FlowRate>("FlowRate");
  }
  get frequencies(): TextCandidate<Frequency>[] {
    return this.byTypeName<Frequency>("Frequency");
  }
  get lengths(): TextCandidate<Length>[] {
    return this.byTypeName<Length>("Length");
  }
  get luminances(): TextCandidate<Luminance>[] {
    return this.byTypeName<Luminance>("Luminance");
  }
  get luminousFluxes(): TextCandidate<LuminousFlux>[] {
    return this.byTypeName<LuminousFlux>("LuminousFlux");
  }
  get percentages(): TextCandidate<Percentage>[] {
    return this.byTypeName<Percentage>("Percentage");
  }
  get powers(): TextCandidate<Power>[] {
    return this.byTypeName<Power>("Power");
  }
  get soundLevels(): TextCandidate<SoundLevel>[] {
    return this.byTypeName<SoundLevel>("SoundLevel");
  }
  get pressures(): TextCandidate<Pressure>[] {
    return this.byTypeName<Pressure>("Pressure");
  }
  get rotationalSpeeds(): TextCandidate<RotationalSpeed>[] {
    return this.byTypeName<RotationalSpeed>("RotationalSpeed");
  }
  get speeds(): TextCandidate<Speed>[] {
    return this.byTypeName<Speed>("Speed");
  }
  get temperatures(): TextCandidate<Temperature>[] {
    return this.byTypeName<Temperature>("Temperature");
  }
  get torques(): TextCandidate<Torque>[] {
    return this.byTypeName<Torque>("Torque");
  }
  get voltages(): TextCandidate<Voltage>[] {
    return this.byTypeName<Voltage>("Voltage");
  }
  get volumes(): TextCandidate<Volume>[] {
    return this.byTypeName<Volume>("Volume");
  }
  get weights(): TextCandidate<Weight>[] {
    return this.byTypeName<Weight>("Weight");
  }

  get vehicleRegistrationNumbers(): TextCandidate<SwedishVehicleRegistrationNumber>[] {
    return this.byTypeName<SwedishVehicleRegistrationNumber>("SwedishVehicleRegistrationNumber");
  }
  get vehicleIdentificationNumbers(): TextCandidate<VehicleIdentificationNumber>[] {
    return this.byTypeName<VehicleIdentificationNumber>("VehicleIdentificationNumber");
  }
  get operatingHourValues(): TextCandidate<OperatingHours>[] {
    return this.byTypeName<OperatingHours>("OperatingHours");
  }
  get boltPatterns(): TextCandidate<BoltPattern>[] {
    return this.byTypeName<BoltPattern>("BoltPattern");
  }
  get wheelRimDimensions(): TextCandidate<WheelRimDimension>[] {
    return this.byTypeName<WheelRimDimension>("WheelRimDimension");
  }
  get tireDimensions(): TextCandidate<TireDimension>[] {
    return this.byTypeName<TireDimension>("TireDimension");
  }
  get euTypeApprovalNumbers(): TextCandidate<EuTypeApprovalNumber>[] {
    return this.byTypeName<EuTypeApprovalNumber>("EuTypeApprovalNumber");
  }
  get enginePowers(): TextCandidate<EnginePower>[] {
    return this.byTypeName<EnginePower>("EnginePower");
  }
  get fuelConsumptions(): TextCandidate<FuelConsumption>[] {
    return this.byTypeName<FuelConsumption>("FuelConsumption");
  }
  get emissionRates(): TextCandidate<EmissionRate>[] {
    return this.byTypeName<EmissionRate>("EmissionRate");
  }
  get euroEmissionClasses(): TextCandidate<EuroEmissionClass>[] {
    return this.byTypeName<EuroEmissionClass>("EuroEmissionClass");
  }
  get swedishEcoVehicleClassifications(): TextCandidate<SwedishEcoVehicleClassification>[] {
    return this.byTypeName<SwedishEcoVehicleClassification>("SwedishEcoVehicleClassification");
  }
  get drivingLicenseCategories(): TextCandidate<SwedishDrivingLicenseCategory>[] {
    return this.byTypeName<SwedishDrivingLicenseCategory>("SwedishDrivingLicenseCategory");
  }

  /** Returns all candidates in the given category. */
  byCategory(category: TextCandidateCategory): TextCandidate[] {
    return this.all.filter((c) => c.category === category);
  }

  /**
   * Replaces each resolved candidate's span in `text` with its `maskedForm`.
   */
  maskAll(text: string): string {
    return this.replaceAll(text, (c) => c.maskedForm);
  }

  /**
   * Replaces each resolved candidate's span in `text` with `replacement`.
   */
  redactAll(text: string, replacement = "[REDACTED]"): string {
    return this.replaceAll(text, () => replacement);
  }

  /**
   * Replaces each resolved candidate's span in `text` using a custom mapper.
   * Replacements are applied right-to-left on the original text so positions
   * remain valid.
   */
  replaceAll(text: string, replacer: (c: TextCandidate) => string): string {
    if (this.resolvedCandidates.length === 0) return text;
    let out = text;
    for (let i = this.resolvedCandidates.length - 1; i >= 0; i--) {
      const c = this.resolvedCandidates[i]!;
      if (c.startIndex + c.length > out.length) continue;
      out = out.slice(0, c.startIndex) + replacer(c) + out.slice(c.startIndex + c.length);
    }
    return out;
  }
}

const CATEGORY_PRIORITY: Record<TextCandidateCategory, number> = {
  [TextCandidateCategory.PersonalIdentifier]: 0,
  [TextCandidateCategory.Contact]: 1,
  [TextCandidateCategory.Financial]: 2,
  [TextCandidateCategory.OrganizationIdentifier]: 3,
  [TextCandidateCategory.Vehicle]: 4,
  [TextCandidateCategory.Property]: 5,
  [TextCandidateCategory.Product]: 6,
  [TextCandidateCategory.Geography]: 7,
  [TextCandidateCategory.Measurement]: 8,
};

function resolve(sorted: readonly TextCandidate[]): TextCandidate[] {
  if (sorted.length === 0) return [];

  const resolved: TextCandidate[] = [];
  for (const candidate of sorted) {
    let dominated = false;
    for (let i = resolved.length - 1; i >= 0; i--) {
      const existing = resolved[i]!;
      if (!existing.overlaps(candidate)) continue;
      const winner = pickWinner(existing, candidate);
      if (winner === existing) {
        dominated = true;
        break;
      }
      resolved.splice(i, 1);
    }
    if (!dominated) resolved.push(candidate);
  }

  resolved.sort((a, b) => a.startIndex - b.startIndex);
  return resolved;
}

function pickWinner(a: TextCandidate, b: TextCandidate): TextCandidate {
  if (a.contains(b)) return a;
  if (b.contains(a)) return b;
  if (a.confidence !== b.confidence) return a.confidence > b.confidence ? a : b;
  if (a.length !== b.length) return a.length > b.length ? a : b;
  const pa = CATEGORY_PRIORITY[a.category] ?? 99;
  const pb = CATEGORY_PRIORITY[b.category] ?? 99;
  return pa <= pb ? a : b;
}
