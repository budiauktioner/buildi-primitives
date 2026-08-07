# AGENTS.md — `@budiauktioner/buildi-primitives`

Rules and conventions for AI agents and humans working in the TypeScript
implementation of Buildi.Primitives. The .NET package `Buildi.Primitives`
remains the behavioural spec; this document translates it for TypeScript.

## Where everything lives

```
src/
  {namespace}/                 ← contact, person, organization, geography, validation, text-scanning
    {kebab-name}.ts            ← one file per public class, kebab-case file name
    {namespace}-masking.ts     ← masking helpers for types too small for their own file
    index.ts                   ← named re-exports
  internal/                    ← package-private helpers (no public re-export)
  primitive-type-info.ts
  primitives-defaults.ts
  sample-data/
test/                          ← vitest specs mirroring src/, one file per source file
package.json
tsconfig.json
tsup.config.ts
vitest.config.ts
```

All commands run from the repository root:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Naming conventions

- File names are **kebab-case**: `swedish-organization-number.ts`,
  `address-city.ts`, `lei-code.ts`.
- Exported type names are **PascalCase**: `SwedishOrganizationNumber`,
  `AddressCity`, `LeiCode`.
- Test files mirror the source file with a `.test.ts` suffix:
  `address-city.test.ts`.
- Folder names match the .NET namespaces, lowercased: `contact/`, `person/`,
  `organization/`, `geography/`, `validation/`, `text-scanning/`,
  `sample-data/`.
- Sweden-specific types are prefixed with `Swedish`. EU-specific types are
  prefixed with `Eu`. International types have no prefix.

## Adding a new value-object type

Use an existing type as a template. Every type follows the same shape.

### 1. Create the type class

File: `src/{namespace}/{kebab-name}.ts`.

```ts
import { PrimitiveTypeInfo } from "../primitive-type-info";

export interface FormatOptions {
  fallbackToTrimmedInputWhenInvalid?: boolean;
}

export class TypeName {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Type Name",
    localizedName: "Typnamn",
    emoji: "...",
    sources: Object.freeze(["https://source1", "https://source2"]),
  });

  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static tryParse(input: string | null | undefined): TypeName | null { ... }

  static parse(input: string): TypeName {
    const r = TypeName.tryParse(input);
    if (r === null) throw new Error("Invalid type name.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return TypeName.tryParse(input) !== null;
  }

  static format(input: string | null | undefined, options?: FormatOptions): string | null { ... }
  static normalize(input: string | null | undefined, options?: FormatOptions): string | null { ... }
  static isNormalized(input: string | null | undefined): boolean {
    return input != null && TypeName.normalize(input) === input;
  }

  toNormalizedString(): string { ... }
  toString(): string { ... }

  equals(other: TypeName | null | undefined): boolean { ... }
  compareTo(other: TypeName | null | undefined): number { ... }
}
```

Rules:

- Class is exported and uses a `private constructor`. TS consumers cannot
  bypass it; plain JS consumers technically can — invariants must therefore
  live in `tryParse` / `parse`, never in the constructor.
- `typeInfo` is frozen and the very first member.
- `tryParse` is the single source of truth. `parse`, `isValid`, `format`,
  `normalize`, `isNormalized` all delegate to it.
- `format` returns `null` on failure by default. Pass
  `{ fallbackToTrimmedInputWhenInvalid: true }` to get the trimmed original
  input back instead of `null` for non-empty invalid input.
- `normalize` returns `null` on failure by default. Same fallback option as
  `format`. Empty strings always return `null`.
- `isNormalized` returns `true` only when the input is valid and identical to
  its normalized form.
- All regex literals live at module scope and use the `/u` flag when matching
  Unicode property classes (`\p{L}`, `\p{Zs}`, etc.).
- Use `String.prototype.toLocaleLowerCase` and `toLocaleUpperCase` with
  `PrimitivesDefaults.culture` (a BCP-47 string such as `'sv-SE'`) for
  culture-sensitive operations.
- Date-dependent types accept an optional `Clock` parameter for testability,
  defined in [`internal/clock.ts`](src/internal/clock.ts).
- No external runtime dependencies. The `Intl` global is the only built-in
  used for locale-sensitive behaviour.

### 2. Create tests

File: `test/{namespace}/{kebab-name}.test.ts`.

Use vitest. Use `it.each([...])` for parameterized tests; this is the natural
TS equivalent of C# `[Theory] / [InlineData(...)]`.

Required cases:

- `isValid` / `tryParse` for each valid input shape.
- `isValid` / `tryParse` for `null`, `""`, `" "`, and a representative set of
  invalid inputs.
- `parse` throws for invalid inputs.
- `format` and `normalize` produce the expected canonical output.
- `format(...)` with `{ fallbackToTrimmedInputWhenInvalid: true }` returns the
  trimmed original input for non-empty invalid input.
- `equals` and `compareTo`.
- For text-scannable types: `findCandidatesInText` against curated prose.

### 3. Add sample data when applicable

File: `src/sample-data/{namespace}/{kebab-name}-sample-data.ts`.

```ts
import { TypeName } from "../../{namespace}/{kebab-name}";

export const TypeNameSampleData = {
  exampleOrg: TypeName.parse("..."),

  get all(): readonly TypeName[] {
    return [TypeNameSampleData.exampleOrg];
  },
};
```

Rules:

- Use `parse(...)` (not `tryParse`); failures surface at module load time.
- Only use publicly known organizations or well-known generic / reserved
  values. RFC 2606 reserved domains for email; well-known international test
  values for IBAN / BIC; etc.
- Always expose an `all` accessor.

### 4. Update `index.ts`

Add a named export from the new file in `src/{namespace}/index.ts` and, if
sample data was added, in `src/sample-data/index.ts`.

### 5. Wire text scanning when applicable

If the new type defines `findCandidatesInText`, register it in
[`text-scanning/text-scanner.ts`](src/text-scanning/text-scanner.ts) with the
correct `TextCandidateCategory`, and add a typed accessor on
[`text-scanning/text-scan-result.ts`](src/text-scanning/text-scan-result.ts).

## Cross-language API translation

| C# pattern                                                            | TypeScript equivalent                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `static bool TryParse(string?, out T?)`                               | `static tryParse(input): T \| null`                                      |
| `static T Parse(string)`                                              | `static parse(input): T` (throws `Error`)                                |
| `static bool IsValid(string?)`                                        | `static isValid(input): boolean`                                         |
| `static string? Format(input, fallbackToTrimmedInputWhenInvalid)`     | `static format(input, options?: FormatOptions): string \| null`          |
| `static string? Normalize(...)`                                       | `static normalize(input, options?): string \| null`                      |
| `static bool IsNormalized(string?)`                                   | `static isNormalized(input): boolean`                                    |
| `string ToString()`                                                   | `toString(): string`                                                     |
| `string ToNormalizedString()`                                         | `toNormalizedString(): string`                                           |
| `bool Equals(T)`                                                      | `equals(other): boolean`                                                 |
| `int CompareTo(T)`                                                    | `compareTo(other): number`                                               |
| `static ValidationResult Validate(string?)`                           | `static validate(input): ValidationResult`                               |
| `static IReadOnlyList<TextCandidate<T>> FindCandidatesInText(string)` | `static findCandidatesInText(text): TextCandidate<T>[]`                  |
| Extension method `value.ToMaskedString()`                             | Module-level `mask{TypeName}(value, opts?)`, exported from the namespace |
| `RegexOptions.Compiled`                                               | declare regex literals at module scope                                   |
| `IBudiTimeProvider` / `DateTime.UtcNow`                               | `Clock` interface from `internal/clock.ts`                               |
| `CultureInfo`                                                         | BCP-47 locale strings on `PrimitivesDefaults.culture`                    |
| `internal` factory methods                                            | private factory functions colocated with the class                       |

## Validation philosophy

- All validation is in-memory. No network calls.
- `isValid` normalizes first — a raw string may be valid if `tryParse`
  succeeds.
- `format` produces a display-friendly form.
- `normalize` produces a machine-comparable, storage-safe canonical form.
- `isNormalized` returns `true` iff `input === normalize(input)`.
- Types with checksums (Luhn, MOD-97, MOD-11, etc.) validate checksums during
  `tryParse`.

## Structured validation (`validate`)

Types with multiple meaningfully distinct failure paths expose
`static validate(input): ValidationResult`. The infrastructure is in
[`src/validation/`](src/validation):

- `ValidationErrorReason` — single shared enum across all types.
- `ValidationResult` — `rawInput`, `isValid`, `issues`. Created via
  internal factory helpers, not by callers.
- `ValidationIssue` — `reason`, `englishDescription`, `localizedDescription`,
  and a locale-aware `description` computed from
  `PrimitivesDefaults.useLocalizedDisplayNames`.

## Text scanning

Types that can reasonably appear in unstructured text expose
`static findCandidatesInText(text): TextCandidate<T>[]`. The infrastructure is
in [`src/text-scanning/`](src/text-scanning):

- `TextMatchConfidence` — `Low`, `Medium`, `High`.
- `TextCandidateCategory` — broad classification.
- `TextCandidate<T>` — span + normalized / formatted / masked forms +
  `confidence`.
- `TextScanner` — aggregate scanner that calls every registered
  `findCandidatesInText` function.
- `TextScanResult` — typed accessors, overlap resolution, mask / redact
  helpers.
- `TextScannerOptions` — include / exclude categories, minimum confidence.

Boundaries (`\b`, `(?<!\d)`, `(?!\d)`, etc.) keep false positives down.
Confidence reflects checksum strength: types with checksums use `High`;
plain digit sequences use `Low`.

## Breaking changes

Breaking changes are tracked in `BREAKING_CHANGES.md` at the repository root
using a version-hop heading, e.g. `## Breaking changes 0.1.0 - 0.2.0`. Add an
entry in the same commit that introduces the change.

## Building and testing

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test --coverage
pnpm build
pnpm pack --pack-destination ./tmp-pack
pnpm publint
pnpm attw
```

All of those must pass before completing any change.
