# Changelog — `@budiauktioner/buildi-primitives`

All notable changes to the TypeScript port of `Buildi.Primitives` will be
documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/).

## [0.3.0] - Unreleased

Tracks `Buildi.Primitives` 0.22.0.

### Added

- `WatercraftIdentificationNumber` in the `Vehicle` namespace: the hull
  marking of a small craft (`skrovnummer`), in either the ISO 10087 format
  (CIN/WIN, e.g. `NL-HXAB7A33G506`) or the twelve-character US hull
  identification number (HIN, e.g. `ZZZ00001A020`). Input may be lower case,
  contain whitespace, and omit the hyphen after the ISO country code; any other
  hyphen or punctuation is rejected. `normalize()` returns the number without
  separators, `format()` returns it as marked on the hull. The parsed value
  exposes `scheme`, `countryCode`, `country`, `manufacturerCode`,
  `serialNumber`, `productionMonthCode`, `productionMonth`,
  `productionYearDigit` and `modelYearDigits`. Years stay as the encoded digits
  because the number does not carry the century.
- `WatercraftIdentificationNumber.validate()` reports one issue per invalid
  segment, using four new `ValidationErrorReason` values:
  `InvalidManufacturerCode`, `InvalidSerialNumber`, `InvalidMonthCode` and
  `InvalidYearDigits`.
- `maskWatercraftIdentificationNumber`, which keeps the country and
  manufacturer codes visible, e.g. `NL-HXA*********`.
- `defaultTextScanner` finds watercraft identification numbers, exposed as
  `TextScanResult.watercraftIdentificationNumbers`. A hyphenated ISO number is
  reported with `Medium` confidence; an unseparated one and a US HIN with
  `Low`.
- `VehicleSampleData.WatercraftIdentificationNumber` in `sample-data`, holding
  the ISO 10087 worked example and a US HIN constructed for this library.

### Fixed

- `PhoneNumber.formatted`, `toLocalString()` and `format()` put the hyphen
  after the area code based on the number's length instead of the numbering
  plan, so every mobile number and most landlines were split in the wrong
  place (`0701-74 06 35` instead of `070-174 06 35`, `0846-50 04 56` instead
  of `08-465 004 56`). The area code is now looked up in PTS's numbering plan
  and the subscriber number is grouped by its own length, as Svenska
  skrivregler recommends. Swedish numbers formatted internationally get the
  same split, e.g. `+46 8 465 004 56`. `maskPhoneNumberDetailed` follows the
  new area code, e.g. `070-*** ** 33`. The normalized form is unchanged.
- `ContactSampleData.PhoneNumber.swedishFixedTest` is now `+46846500400`, from the
  PTS-reserved Stockholm range, instead of a number outside it.

## [0.2.1] - 2026-08-07

### Fixed

- The 21 `Measurement` scanners matched on ASCII word boundaries, so a unit
  abbreviation followed by a non-ASCII letter ended the match and produced a
  false positive. In Swedish prose this was common enough to matter:
  `24 månader` scanned as `24 m`, `3 tågresor` as `3 t`, and `123 väger` as
  `123 V`. They now use Unicode-aware boundaries, matching .NET, where `\b`
  is Unicode-aware already. `Vehicle` and `Product` scanners were already
  correct; this closes the same gap in `Measurement`.

## [0.2.0] - 2026-08-07

### Added

- The `Measurement` namespace, available from the new
  `@budiauktioner/buildi-primitives/measurement` subpath: 19 dimensions, 133
  units, five standalone types, plus `TemperatureDelta`. The dimensions are
  `Area`, `DataSize`, `ElectricCharge`, `ElectricCurrent`, `Energy`,
  `FlowRate`, `Frequency`, `Length`, `Luminance`, `LuminousFlux`, `Power`,
  `Pressure`, `RotationalSpeed`, `Speed`, `Temperature`, `Torque`, `Voltage`,
  `Volume` and `Weight`. Each supports parsing from any of its units, exact
  conversion between them, `toNaturalString()` auto-scaling, arithmetic, a
  `mask*` helper, and text scanning through the matching `TextScanResult`
  accessor. The five types with no unit table are `Count`, `Percentage`,
  `SoundLevel`, `Year` and `YearMonth`.
- Internal foundation for the rest of the namespace: exact base-10 arithmetic
  matching .NET `System.Decimal`, the measurement string splitter, and the
  shared unit-index and quantity base classes.
- The `Vehicle` namespace, available from the new
  `@budiauktioner/buildi-primitives/vehicle` subpath. All 29 types: the lookup
  types `FuelType`, `BodyType`, `TransmissionType`, `DrivetrainType`,
  `SuspensionType`, `TireType`, `TrackType`, `EuroEmissionClass`,
  `FuelConsumptionNorm`, `BoatHullMaterial`, `BoatCeDesignCategory`,
  `SwedishVehicleType`, `SwedishVehicleStatus`, `SwedishEcoVehicleClassification`
  and `SwedishDrivingLicenseCategory`; the measurements `EngineDisplacement`,
  `EnginePower`, `OdometerReading`, `OperatingHours`, `FuelConsumption`,
  `EnergyConsumption` and `EmissionRate`; and the identifiers and dimensions
  `VehicleIdentificationNumber`, `SwedishVehicleRegistrationNumber`,
  `TireDimension`, `WheelRimDimension`, `BoltPattern`, `EuTypeApprovalNumber`
  and `EuVehicleCategory`.
- Thirteen new `TextScanResult` accessors for the vehicle types the .NET
  `TextScanner` runs, including `vehicleRegistrationNumbers`,
  `vehicleIdentificationNumbers`, `tireDimensions` and `enginePowers`.
- The `Product` namespace, available from the new
  `@budiauktioner/buildi-primitives/product` subpath, which completes the port
  of all thirteen .NET namespaces. All 36 types: the lookup types
  `AspectRatio`, `BatteryChemistry`, `ClothingFit`, `ClothingGender`,
  `ClothingSeason`, `DisplayPanelType`, `ElectricalPhase`,
  `EuEnergyEfficiencyClass`, `PowerSource`, `Refrigerant` and
  `StorageMediaType`; the capacities `StorageCapacity`, `RamCapacity`,
  `ProcessorSpeed` and `BatteryCapacity`; the GTIN family `Gtin`, `Gtin8`,
  `Gtin12`, `Gtin13` and `Gtin14`; the sizes `ClothingSize`,
  `AdultClothingSize`, `ChildClothingSize`, `ShoeSize`, `AdultShoeSize` and
  `ChildShoeSize`; and `Color`, `CameraResolution`, `ScreenResolution`,
  `ScreenSize`, `IpRating`, `HsCode`, `GoogleProductCategory`,
  `OperatingSystemInfo`, `OperatingSystemName` and `OperatingSystemVersion`.
- Ten new `TextScanResult` accessors for the product types the .NET
  `TextScanner` runs: `gtin8s`, `gtin12s`, `gtin13s`, `gtin14s`, `ipRatings`,
  `electricalPhases`, `refrigerants`, `colors`, `screenResolutions` and
  `screenSizes`.

### Changed

- Version 0.2.0 expands `defaultTextScanner` with the Measurement, Vehicle, and
  Product scanners. Existing callers that need the 0.1.x scan scope can migrate
  by passing `excludeCategories` for `TextCandidateCategory.Measurement`,
  `.Vehicle`, and `.Product`; callers that want an explicit allowlist can use
  `includeCategories` instead.

## [0.1.1] - 2026-08-07

First release published from CI through npm trusted publishing, so this is
also the first version carrying a provenance attestation. No API changes.

### Changed

- `publishConfig` no longer forces `provenance`. It applies to every publish
  including local ones, where npm has no CI provider to attest against and
  fails outright. The release workflow requests provenance explicitly.
- `repository.url`, `homepage` and `bugs.url` now spell the GitHub owner in
  lowercase. npm compares `repository.url` against the provenance statement
  case-sensitively and rejects the publish on a mismatch.

## [0.1.0] - 2026-08-07

First public release.

### Added

- Initial TypeScript port scaffolding.
- Public types for the Organization, Banking, Person, Geography, Finance,
  Contact, Web, Property, Validation, and TextScanning namespaces.
- Subpath exports per namespace for tree-shaking.
- Local SwedishPersonalIdentityNumber implementation (no ActiveLogin dependency).
- `TextScanResult` typed accessors for all 24 scannable types.
- `Country.usesEuro`, `currencyCode`, `currency`, `currencies`,
  `primaryLanguage`, `officialLanguages`, `latitude`, `longitude`, `value`, and
  `formatted`.
- `Address.asCountryAddress()`, `Address.toDomesticMultilineString()`,
  `Address.supportedCountryAddressTypes`, and `SwedishAddress.countryZipCode`.
- `Currency.nativeName` / `toNativeString()` and `Url.toUrl()` / `Url.fromUrl()`.
- `maskSwedishOrganizationName` and `maskPersonAge`.
- 28 further `PhoneCallingCode` named constants, for 35 in total.
- `PhoneNumberTestData` covering all 495 PTS-reserved test phone numbers.
- `TextDirection`, `WritingScript`, and `SwedishOrganizationTypeHintResult` are
  now exported from their namespace barrels.
- [PARITY.md](PARITY.md) and a parity guard test covering the .NET public surface.

### Changed

- `Country.isEuropeanUnion` and `Country.isNordic` renamed to
  `isInEuropeanUnion` and `isInNordics`. See [BREAKING_CHANGES.md](BREAKING_CHANGES.md).
- Scannable types now import the `text-scanning` leaf modules instead of its
  barrel, removing an import cycle between the two.
- `registerDefaultTextScanners` is now exported from the `text-scanning`
  namespace.
- `sideEffects` lists the four entries that register defaults at import time
  instead of claiming `false` for the whole package. Every other entry stays
  tree-shakeable, so subpath imports are unaffected.

### Fixed

- Importing `@budiauktioner/buildi-primitives/text-scanning` on its own left
  `defaultTextScanner` empty, so scans silently returned no candidates. The
  registration ran only from the package root. It now runs when the
  `text-scanning` entry itself is imported.
