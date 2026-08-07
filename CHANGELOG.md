# Changelog — `@budiauktioner/buildi-primitives`

All notable changes to the TypeScript port of `Buildi.Primitives` will be
documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

### Fixed

- Importing `@budiauktioner/buildi-primitives/text-scanning` on its own left
  `defaultTextScanner` empty, so scans silently returned no candidates. The
  registration ran only from the package root. It now runs when the
  `text-scanning` entry itself is imported.
