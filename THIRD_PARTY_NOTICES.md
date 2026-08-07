# Third-party notices — `@budiauktioner/buildi-primitives` (TypeScript)

`@budiauktioner/buildi-primitives` ships with **zero runtime dependencies**. This document
collects attributions for the development tooling that builds, tests, and
validates the package, plus any public references whose definitions or test
data influenced the implementation.

## Reference specifications and test data

The TypeScript port reimplements all logic from scratch. The following public
sources are referenced for behavioural parity. None of them are linked at
runtime.

- [Skatteverket — Personnummer](https://skatteverket.se/privat/folkbokforing/personnummer.4.3810a01c150939e893f18c29.html)
  — official Swedish personal identity number rules.
- [Skatteverket — Samordningsnummer](https://skatteverket.se/) — coordination
  number rules.
- [Bolagsverket](https://bolagsverket.se/) — Swedish organization registry.
- [PostNord](https://www.postnord.se/) — Swedish postal city/zip-code rules.
- ISO 3166-1, ISO 3166-2, ISO 4217, ISO 639 — country / subdivision /
  currency / language codes.
- [GLEIF](https://www.gleif.org/) — LEI codes.
- [VIES VAT](https://ec.europa.eu/taxation_customs/vies/) — EU VAT number
  formats.
- [D&B](https://www.dnb.com/) — DUNS numbers.
- [Skatteverket — OCR](https://skatteverket.se/) and Bankgirot — OCR reference
  numbers.

## Algorithm derivations

- Luhn (mod 10) checksum — public domain algorithm.
- IBAN MOD-97 — defined in ISO 13616.
- LEI MOD-97-10 — defined in ISO 17442.

If any logic is later derived by reading the source of an MIT-licensed library
such as [ActiveLogin.Identity](https://github.com/ActiveLogin/ActiveLogin.Identity),
list that derivation here together with the upstream license.

## Development tooling

This package is built and validated using the following tools (development
dependencies; not shipped to consumers):

- [TypeScript](https://www.typescriptlang.org/) — Apache-2.0
- [tsup](https://tsup.egoist.dev/) — MIT
- [tsx](https://tsx.is/) — MIT
- [vitest](https://vitest.dev/) — MIT
- [eslint](https://eslint.org/) — MIT
- [typescript-eslint](https://typescript-eslint.io/) — MIT
- [prettier](https://prettier.io/) — MIT
- [publint](https://publint.dev/) — MIT
- [@arethetypeswrong/cli](https://arethetypeswrong.github.io/) — MIT
