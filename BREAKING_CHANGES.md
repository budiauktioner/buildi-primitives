# Breaking changes

Backwards-incompatible changes between versions of `@budiauktioner/buildi-primitives`.
Newest version on top. Non-breaking additions belong in [CHANGELOG.md](CHANGELOG.md),
not here.

## Conventions

- One `## Breaking changes <previous-version> - <new-version>` heading per release
  that contains breaking changes (e.g. `## Breaking changes 0.1.0 - 0.2.0`). The
  range makes it explicit which upgrade hop the entries apply to.
- One `### <short title>` heading per breaking change inside that version. Use as
  many sub-sections per change as you need: **What changed**, **Why**,
  **Migration**, **Examples**, etc.
- Order versions from newest to oldest.

## Unreleased

### `Country` membership flags renamed to match the .NET port

**Area:** `@budiauktioner/buildi-primitives/geography`

**What changed**

Two `Country` getters were renamed so that all five regional membership flags
follow the same naming as `Buildi.Primitives`:

| Before            | After               |
| ----------------- | ------------------- |
| `isEuropeanUnion` | `isInEuropeanUnion` |
| `isNordic`        | `isInNordics`       |

`isInEea`, `isInSchengen`, and `isInSepa` are unchanged.

**Why**

The two renamed getters were the only members of the group that diverged from
the .NET names, which made the set inconsistent both with the behavioural spec
and internally.

**Migration**

Rename the call sites. The semantics are identical.

```ts
// Before
if (country.isEuropeanUnion && country.isNordic) { ... }

// After
if (country.isInEuropeanUnion && country.isInNordics) { ... }
```
