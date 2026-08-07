# Changelog — `@budiauktioner/buildi-primitives`

All notable changes to the TypeScript port of `Buildi.Primitives` will be
documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/).

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
