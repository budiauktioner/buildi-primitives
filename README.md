# @budiauktioner/buildi-primitives

TypeScript primitives for Swedish, EU, and international value-object
validation, normalization, masking, and text scanning.

This is the TypeScript port of the .NET package
[`Buildi.Primitives`](https://www.nuget.org/packages/Buildi.Primitives), whose
[source](https://github.com/BudiAuktioner/Buildi.Primitives) remains the
behavioural specification for both languages.

> **Status**: early release, versioned from 0.1.0. Eleven of the thirteen .NET
> namespaces are ported and track the .NET package closely; `Product` is not
> ported yet. See [PARITY.md](PARITY.md) for the exact coverage and gaps.

## Install

```sh
pnpm add @budiauktioner/buildi-primitives
# or
npm install @budiauktioner/buildi-primitives
# or
yarn add @budiauktioner/buildi-primitives
# or
bun add @budiauktioner/buildi-primitives
```

## Quick start

```ts
import { SwedishOrganizationNumber } from "@budiauktioner/buildi-primitives/organization";

SwedishOrganizationNumber.isValid("559246-0421"); // true
SwedishOrganizationNumber.isValid("559246-0420"); // false — bad check digit

// Static helpers accept messy input and return null when it is not valid.
SwedishOrganizationNumber.format("5592460421"); // "559246-0421"
SwedishOrganizationNumber.normalize("559246-0421"); // "165592460421"
SwedishOrganizationNumber.format("nonsense"); // null

// Or parse once and keep the value object around.
const org = SwedishOrganizationNumber.parse("5592460421");
org.toString(); // "559246-0421"  — display form
org.toNormalizedString(); // "165592460421" — storage form
org.isPerson; // false — this is a legal entity, not a sole trader
```

`format()` produces the display form and `normalize()` the canonical form for
storage and comparison. For roughly half the types these are the same string;
for the rest they deliberately differ, as above. Store the normalized value and
render the formatted one.

## API conventions

Every value-object type follows the same shape:

```ts
class TypeName {
  static readonly typeInfo: PrimitiveTypeInfo;

  static tryParse(input: string | null | undefined): TypeName | null;
  static parse(input: string): TypeName; // throws on invalid input
  static isValid(input: string | null | undefined): boolean;
  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null;
  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null;
  static isNormalized(input: string | null | undefined): boolean;

  toNormalizedString(): string;
  toString(): string;

  equals(other: TypeName | null | undefined): boolean;
  compareTo(other: TypeName | null | undefined): number;
}
```

Constructors are private: a value object can only come from `parse` or
`tryParse`, so an instance is always valid. Every static helper accepts
`string | null | undefined`, so unvalidated input can be passed straight in.

Pass `{ fallbackToTrimmedInputWhenInvalid: true }` to `format` or `normalize`
to get the trimmed original input back instead of `null` when the input is not
valid — useful when rendering user-entered values you do not want to drop.

## Validation

Types with more than one meaningful failure mode add `validate()`, which
reports why the input was rejected rather than just that it was:

```ts
import { Iban } from "@budiauktioner/buildi-primitives/banking";

const result = Iban.validate("SE45 5000 0000 0583 9825 7460");

result.isValid; // false
result.issues.map((i) => i.reason); // ["InvalidCheckDigit"]
result.issues[0].description; // "Ogiltiga IBAN-kontrollsiffror."
```

`reason` is a stable `ValidationErrorReason` enum value safe to branch on.
`description` is human-readable and follows the display language described
under [Defaults and display language](#defaults-and-display-language); each
issue also exposes `englishDescription` and `localizedDescription` directly.

## Masking

Masking is done by module-level `maskX` functions, exported from the same
subpath as the type they mask:

```ts
import { Iban, maskIban } from "@budiauktioner/buildi-primitives/banking";
import { EmailAddress, maskEmailAddress } from "@budiauktioner/buildi-primitives/web";
import { PhoneNumber, maskPhoneNumber } from "@budiauktioner/buildi-primitives/contact";

maskIban(Iban.parse("SE4550000000058398257466")); // "SE45 **** **** **** **** ****"
maskEmailAddress(EmailAddress.parse("info@example.com")); // "i***@example.com"
maskPhoneNumber(PhoneNumber.parse("070-174 06 33")); // "+46*****0633"
```

Some take options, for example `maskEmailAddress(email, { maskDomain: true })`.

## Text scanning

Types that can plausibly appear in prose expose `findCandidatesInText`, and
`defaultTextScanner` runs all of them at once:

```ts
import { defaultTextScanner } from "@budiauktioner/buildi-primitives/text-scanning";

const text = "Hör av dig till info@example.com eller ring 070-174 06 33.";
const result = defaultTextScanner.scan(text);

result.emails.map((c) => c.normalizedForm); // ["info@example.com"]
result.phoneNumbers.map((c) => c.normalizedForm); // ["0046701740633"]

result.maskAll(text); // "Hör av dig till i***@example.com eller ring +46*****0633."
result.redactAll(text); // "Hör av dig till [REDACTED] eller ring [REDACTED]."
```

`TextScanResult` has a typed accessor per scannable type (`emails`, `ibans`,
`organizationNumbers`, and so on). Every candidate carries its span in the
source text, its normalized, formatted and masked forms, and a
`TextMatchConfidence`. Types with a checksum report `High`; bare digit
sequences report `Low`. Narrow a scan with
`scan(text, { minimumConfidence, includeCategories, excludeCategories })`.

Scanning is the one part of the package with import-time behaviour: importing
`@budiauktioner/buildi-primitives/text-scanning` (or the root entry) registers
all built-in scanners on `defaultTextScanner`. Importing only a value-object
subpath deliberately does not. Construct your own `TextScanner` if you want an
isolated registry.

## Defaults and display language

`PrimitivesDefaults` holds the process-wide culture, UI culture, default
country and default calling code. It affects display names, localized
validation messages, and how ambiguous input such as a national phone number
is interpreted.

```ts
import { PrimitivesDefaults, Country } from "@budiauktioner/buildi-primitives";

PrimitivesDefaults.culture; // "sv-SE"
PrimitivesDefaults.countryAlpha2Code; // "SE"

Country.parse("SE").displayName; // "Sverige"

PrimitivesDefaults.uiCulture = "en-US";
Country.parse("SE").displayName; // "Sweden"

PrimitivesDefaults.reset(); // back to the defaults
```

`useLocalizedDisplayNames` is a read-only getter derived from `uiCulture` — it
is `true` when `uiCulture` is Swedish. Set `uiCulture` to change the display
language; assigning to `useLocalizedDisplayNames` throws a `TypeError`. Types
that expose a `displayName` also expose `englishName` and `localizedName`, so a
mixed-locale app can bypass the global entirely.

## Sample data

Valid, publicly known values for tests, fixtures and documentation. Everything
here is a real parsed value object, so it stays valid as the rules evolve.

```ts
import { OrganizationSampleData } from "@budiauktioner/buildi-primitives/sample-data";

OrganizationSampleData.OrganizationNumber.all[0].toString(); // "559246-0421"
```

Only publicly known organizations and reserved test values are used, such as
RFC 2606 domains for email and the standard international test IBANs.

## Subpath exports and bundle size

The root entry re-exports everything for convenience. Import from a namespace
subpath instead when bundle size matters:

```ts
// ~392 kB minified — the root entry registers every text scanner
import { SwedishOrganizationNumber } from "@budiauktioner/buildi-primitives";

// ~40 kB minified — the same type, nothing else
import { SwedishOrganizationNumber } from "@budiauktioner/buildi-primitives/organization";
```

`measurement` is the one subpath that does not shrink to the type you ask for:
its unit tables are static class fields, which bundlers keep whether or not you
reference the class, so importing a single dimension still costs about 112 kB.

Available subpaths: `contact`, `person`, `organization`, `geography`, `web`,
`finance`, `property`, `banking`, `measurement`, `vehicle`, `validation`,
`text-scanning`, and `sample-data`.

```ts
import { SwedishPersonalIdentityNumber } from "@budiauktioner/buildi-primitives/person";
import { Country, Continent, Language } from "@budiauktioner/buildi-primitives/geography";
import { AddressCity, PhoneNumber, SwedishAddress } from "@budiauktioner/buildi-primitives/contact";
import { Currency, MoneyAmount, ExchangeRates } from "@budiauktioner/buildi-primitives/finance";
import {
  Length,
  Weight,
  Temperature,
  Percentage,
} from "@budiauktioner/buildi-primitives/measurement";
import {
  FuelType,
  TireDimension,
  VehicleIdentificationNumber,
} from "@budiauktioner/buildi-primitives/vehicle";
import { ValidationErrorReason } from "@budiauktioner/buildi-primitives/validation";
```

Use the root entry when you want the batteries-included behaviour, in
particular a `defaultTextScanner` that already knows every scannable type.

## Runtime targets

- Node.js 20.10 or newer (see [`.nvmrc`](.nvmrc)).
- Bun 1.1 or newer.
- Modern browsers (current Chromium, Firefox, Safari).
- No Node-only runtime APIs and no runtime dependencies; ES2022 plus standard
  `Intl` only.
- Ships ESM and CJS builds with type definitions for both.

## Development

All commands run from the repository root:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

See [AGENTS.md](AGENTS.md) for conventions and the per-type pattern,
[PARITY.md](PARITY.md) for the current state of .NET parity, and
[CHANGELOG.md](CHANGELOG.md) for release notes.

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
